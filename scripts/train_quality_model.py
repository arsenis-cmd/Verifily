#!/usr/bin/env python3
"""Train a multi-axis quality regressor by fine-tuning microsoft/deberta-v3-base.

Uses combined training data (HelpSteer2 + UltraFeedback + oasst2, ~117k rows)
with missing-label masking so each dataset contributes what it has.

v6.1 improvements over v5:
  - Per-axis loss weighting — compensates for label scarcity on complexity (17%)
  - All 117k rows (no subsampling)
  - v5 shared head architecture (better cross-axis transfer than per-axis)

Architecture:
    deberta-v3-base (184M params, improved disentangled attention)
      → CLS token (768-dim)
      → Dropout(0.1)
      → Linear(768, 256) → GELU → Dropout(0.15) → Linear(256, 4)
      → Sigmoid

Targets (unified, all normalized 0-1):
    coherence, informativeness, complexity, overall

Usage:
    PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION=python python scripts/train_quality_model.py

Outputs:
    verifily_cli_v1/core/quality_model/   (model + tokenizer + meta)
"""

from __future__ import annotations

import json
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

DATA_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "verifily_cli_v1", "data",
)
MODEL_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "verifily_cli_v1", "core", "quality_model",
)

AXES = ["coherence", "informativeness", "complexity", "overall"]
BASE_MODEL = "microsoft/deberta-v3-base"
MAX_SEQ_LEN = 512
EPOCHS = 5
BATCH_SIZE = 8
GRAD_ACCUM = 4  # effective batch size = 32
LR_TRANSFORMER = 1e-5
LR_HEAD = 5e-4
WEIGHT_DECAY = 0.001
WARMUP_RATIO = 0.06
VAL_FRACTION = 0.10
PATIENCE = 2
HEAD_HIDDEN = 256
HEAD_DROPOUT = 0.15

# Per-axis loss weights: inverse of label coverage fraction (clamped)
# coherence=96% → 1.0, informativeness=71% → 1.4, complexity=17% → 5.0, overall=71% → 1.4
AXIS_WEIGHTS = [1.0, 1.4, 5.0, 1.4]


# ---------------------------------------------------------------------------
# Data loading
# ---------------------------------------------------------------------------

def load_combined():
    """Load unified combined_quality.jsonl."""
    path = os.path.join(DATA_DIR, "combined_quality.jsonl")
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"{path} not found. Run: python scripts/download_training_data.py"
        )
    rows = []
    with open(path) as f:
        for line in f:
            rows.append(json.loads(line))
    return rows


def prepare_training_data(rows):
    """Extract texts, targets, and masks from unified data.

    Returns:
        texts: list of strings
        targets: list of [coherence, informativeness, complexity, overall]
        masks: list of [bool, bool, bool, bool] — True if label exists
    """
    texts = []
    targets = []
    masks = []

    for row in rows:
        text = row.get("text", "")
        if len(text.strip()) < 20:
            continue

        target = []
        mask = []
        for ax in AXES:
            val = row.get(ax)
            if val is not None:
                target.append(max(0.0, min(1.0, float(val))))
                mask.append(True)
            else:
                target.append(0.0)  # placeholder, masked out
                mask.append(False)

        # Skip rows with zero labels
        if not any(mask):
            continue

        texts.append(text.strip())
        targets.append(target)
        masks.append(mask)

    return texts, targets, masks


# ---------------------------------------------------------------------------
# Model
# ---------------------------------------------------------------------------

def build_model(base_model_name: str, num_axes: int = 4):
    """Build deberta + shared expanded regression head.

    Architecture: deberta-v3-base → CLS → Dropout(0.1) →
                  Linear(hidden, HEAD_HIDDEN) → GELU → Dropout(HEAD_DROPOUT) →
                  Linear(HEAD_HIDDEN, num_axes) → Sigmoid
    """
    import torch
    import torch.nn as nn
    from transformers import AutoModel, AutoTokenizer

    tokenizer = AutoTokenizer.from_pretrained(base_model_name)
    base = AutoModel.from_pretrained(base_model_name)

    class QualityModel(nn.Module):
        def __init__(self, base_model, hidden_size, num_axes):
            super().__init__()
            self.base = base_model
            self.dropout = nn.Dropout(0.1)
            self.head = nn.Sequential(
                nn.Linear(hidden_size, HEAD_HIDDEN),
                nn.GELU(),
                nn.Dropout(HEAD_DROPOUT),
                nn.Linear(HEAD_HIDDEN, num_axes),
            )
            self.sigmoid = nn.Sigmoid()

        def forward(self, input_ids, attention_mask):
            outputs = self.base(input_ids=input_ids, attention_mask=attention_mask)
            cls = self.dropout(outputs.last_hidden_state[:, 0])
            return self.sigmoid(self.head(cls))

    hidden_size = base.config.hidden_size
    model = QualityModel(base, hidden_size, num_axes)

    return model, tokenizer, hidden_size


# ---------------------------------------------------------------------------
# Dataset
# ---------------------------------------------------------------------------

class QualityDataset:
    def __init__(self, texts, targets, masks, tokenizer, max_length):
        self.texts = texts
        self.targets = targets
        self.masks = masks
        self.tokenizer = tokenizer
        self.max_length = max_length

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        import torch
        encoding = self.tokenizer(
            self.texts[idx],
            truncation=True,
            max_length=self.max_length,
            padding="max_length",
            return_tensors="pt",
        )
        return {
            "input_ids": encoding["input_ids"].squeeze(0),
            "attention_mask": encoding["attention_mask"].squeeze(0),
            "targets": torch.tensor(self.targets[idx], dtype=torch.float32),
            "masks": torch.tensor(self.masks[idx], dtype=torch.float32),
        }


# ---------------------------------------------------------------------------
# Training
# ---------------------------------------------------------------------------

def train(model, tokenizer, texts, targets, masks, device):
    """Fine-tune with missing-label masking and per-axis loss weighting."""
    import torch
    import torch.nn as nn
    from torch.utils.data import DataLoader

    n = len(texts)
    n_val = int(n * VAL_FRACTION)
    n_train = n - n_val

    # Deterministic shuffle
    rng = random.Random(42)
    indices = list(range(n))
    rng.shuffle(indices)

    train_texts = [texts[i] for i in indices[:n_train]]
    train_targets = [targets[i] for i in indices[:n_train]]
    train_masks = [masks[i] for i in indices[:n_train]]
    val_texts = [texts[i] for i in indices[n_train:]]
    val_targets = [targets[i] for i in indices[n_train:]]
    val_masks = [masks[i] for i in indices[n_train:]]

    train_ds = QualityDataset(train_texts, train_targets, train_masks, tokenizer, MAX_SEQ_LEN)
    val_ds = QualityDataset(val_texts, val_targets, val_masks, tokenizer, MAX_SEQ_LEN)

    train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=BATCH_SIZE * 2, shuffle=False)

    # Separate LR for transformer and head
    transformer_params = list(model.base.parameters())
    head_params = list(model.dropout.parameters()) + list(model.head.parameters())

    optimizer = torch.optim.AdamW([
        {"params": transformer_params, "lr": LR_TRANSFORMER},
        {"params": head_params, "lr": LR_HEAD},
    ], weight_decay=WEIGHT_DECAY)

    total_steps = len(train_loader) * EPOCHS // GRAD_ACCUM
    warmup_steps = int(total_steps * WARMUP_RATIO)

    def lr_lambda(step):
        if step < warmup_steps:
            return step / max(1, warmup_steps)
        progress = (step - warmup_steps) / max(1, total_steps - warmup_steps)
        return 0.5 * (1.0 + math.cos(math.pi * progress))

    scheduler = torch.optim.lr_scheduler.LambdaLR(optimizer, lr_lambda)

    # Per-axis loss weights
    axis_weights = torch.tensor(AXIS_WEIGHTS, dtype=torch.float32, device=device).unsqueeze(0)

    model = model.to(device)

    best_val_loss = float("inf")
    best_state = None
    best_r2 = None
    no_improve = 0
    global_step = 0

    for epoch in range(EPOCHS):
        model.train()
        epoch_loss = 0.0
        n_batches = 0
        optimizer.zero_grad()

        for batch_idx, batch in enumerate(train_loader):
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            tgt = batch["targets"].to(device)
            mask = batch["masks"].to(device)

            preds = model(input_ids, attention_mask)

            # Weighted masked MSE loss
            diff_sq = (preds - tgt) ** 2
            weighted_diff = diff_sq * mask * axis_weights
            masked_loss = weighted_diff.sum() / (mask * axis_weights).sum().clamp(min=1)
            loss = masked_loss / GRAD_ACCUM

            loss.backward()

            if (batch_idx + 1) % GRAD_ACCUM == 0 or (batch_idx + 1) == len(train_loader):
                torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
                optimizer.step()
                scheduler.step()
                optimizer.zero_grad()
                global_step += 1

            epoch_loss += masked_loss.item()
            n_batches += 1

        avg_train_loss = epoch_loss / n_batches

        # Validation (unweighted for honest evaluation)
        model.eval()
        val_loss = 0.0
        val_batches = 0
        axis_preds = {ax: [] for ax in AXES}
        axis_tgts = {ax: [] for ax in AXES}

        with torch.no_grad():
            for batch in val_loader:
                input_ids = batch["input_ids"].to(device)
                attention_mask = batch["attention_mask"].to(device)
                tgt = batch["targets"].to(device)
                mask = batch["masks"].to(device)

                preds = model(input_ids, attention_mask)

                # Unweighted val loss for honest early stopping
                diff_sq = (preds - tgt) ** 2
                masked_loss = (diff_sq * mask).sum() / mask.sum().clamp(min=1)
                val_loss += masked_loss.item()
                val_batches += 1

                preds_cpu = preds.cpu()
                tgt_cpu = tgt.cpu()
                mask_cpu = mask.cpu()

                for ax_idx, ax in enumerate(AXES):
                    for j in range(len(preds_cpu)):
                        if mask_cpu[j][ax_idx] > 0.5:
                            axis_preds[ax].append(preds_cpu[j][ax_idx].item())
                            axis_tgts[ax].append(tgt_cpu[j][ax_idx].item())

        val_loss /= val_batches

        # Per-axis R²
        r2_per_axis = []
        for ax in AXES:
            if len(axis_preds[ax]) < 10:
                r2_per_axis.append(0.0)
                continue
            p = torch.tensor(axis_preds[ax])
            t = torch.tensor(axis_tgts[ax])
            ss_res = ((p - t) ** 2).sum()
            ss_tot = ((t - t.mean()) ** 2).sum()
            r2 = (1 - ss_res / ss_tot.clamp(min=1e-8)).item()
            r2_per_axis.append(r2)

        r2_str = ", ".join(f"{a}={r:.3f}" for a, r in zip(AXES, r2_per_axis))
        cur_lr = scheduler.get_last_lr()[0]
        avg_r2 = sum(r2_per_axis) / len(r2_per_axis)
        print(f"  Epoch {epoch + 1}/{EPOCHS}: train={avg_train_loss:.4f} "
              f"val={val_loss:.4f} lr={cur_lr:.6f} R²=[{r2_str}] avg={avg_r2:.3f}")

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}
            best_r2 = list(r2_per_axis)
            no_improve = 0
        else:
            no_improve += 1
            if no_improve >= PATIENCE:
                print(f"  Early stopping at epoch {epoch + 1}")
                break

    model.load_state_dict(best_state)
    model = model.cpu()

    return model, best_r2, n_train, n_val


# ---------------------------------------------------------------------------
# Export
# ---------------------------------------------------------------------------

def export_model(model, tokenizer, hidden_size, r2_scores, n_train, n_val):
    """Save fine-tuned model + tokenizer + metadata."""
    import torch

    os.makedirs(MODEL_DIR, exist_ok=True)

    torch.save(model.state_dict(), os.path.join(MODEL_DIR, "model.pt"))
    tokenizer.save_pretrained(MODEL_DIR)

    meta = {
        "version": 6,
        "architecture": (
            f"{BASE_MODEL} → CLS → Dropout(0.1) → "
            f"Linear({hidden_size},{HEAD_HIDDEN}) → GELU → Dropout({HEAD_DROPOUT}) → "
            f"Linear({HEAD_HIDDEN},4) → Sigmoid"
        ),
        "base_model": BASE_MODEL,
        "hidden_size": hidden_size,
        "head_hidden": HEAD_HIDDEN,
        "head_dropout": HEAD_DROPOUT,
        "num_axes": 4,
        "output_axes": AXES,
        "max_seq_length": MAX_SEQ_LEN,
        "training_data": "combined (HelpSteer2 + UltraFeedback + oasst2, 117k total)",
        "n_train": n_train,
        "n_val": n_val,
        "val_r2": {ax: round(r2, 4) for ax, r2 in zip(AXES, r2_scores)},
        "avg_r2": round(sum(r2_scores) / len(r2_scores), 4),
        "training_config": {
            "epochs": EPOCHS,
            "batch_size": BATCH_SIZE,
            "grad_accum": GRAD_ACCUM,
            "lr_transformer": LR_TRANSFORMER,
            "lr_head": LR_HEAD,
            "weight_decay": WEIGHT_DECAY,
            "warmup_ratio": WARMUP_RATIO,
            "axis_weights": AXIS_WEIGHTS,
            "missing_label_masking": True,
        },
    }

    with open(os.path.join(MODEL_DIR, "quality_meta.json"), "w") as f:
        json.dump(meta, f, indent=2)

    print(f"  Saved model to {MODEL_DIR}/model.pt")
    print(f"  Saved tokenizer to {MODEL_DIR}/")
    print(f"  Saved metadata to {MODEL_DIR}/quality_meta.json")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    import torch

    print("=" * 60)
    print("Verifily — Train Quality Model v6.1")
    print(f"  Model: {BASE_MODEL} (fine-tuned end-to-end)")
    print(f"  Head: shared expanded ({HEAD_HIDDEN}-dim, GELU, dropout {HEAD_DROPOUT})")
    print(f"  Loss weighting: {AXIS_WEIGHTS}")
    print(f"  Data: Combined 3 datasets, all rows")
    print("=" * 60)

    device = torch.device("cpu")
    if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        device = torch.device("mps")
    elif torch.cuda.is_available():
        device = torch.device("cuda")
    print(f"\nDevice: {device}")

    # 1. Load data
    print("\n1. Loading combined training data...")
    rows = load_combined()
    print(f"   Loaded {len(rows)} rows (using all)")

    # 2. Prepare targets
    print("\n2. Preparing training data...")
    texts, targets, masks = prepare_training_data(rows)
    print(f"   {len(texts)} valid rows")
    for ax_idx, ax in enumerate(AXES):
        labeled = sum(1 for m in masks if m[ax_idx])
        print(f"   {ax}: {labeled} labeled ({labeled * 100 // len(texts)}%) [weight={AXIS_WEIGHTS[ax_idx]}]")

    # 3. Build model
    print(f"\n3. Building model ({BASE_MODEL} + shared expanded head)...")
    model, tokenizer, hidden_size = build_model(BASE_MODEL, num_axes=len(AXES))
    n_params = sum(p.numel() for p in model.parameters())
    print(f"   Total params: {n_params:,}")

    # 4. Train
    print(f"\n4. Fine-tuning ({EPOCHS} epochs, batch={BATCH_SIZE}x{GRAD_ACCUM}, "
          f"LR={LR_TRANSFORMER}/{LR_HEAD})...")
    model, r2_scores, n_train, n_val = train(model, tokenizer, texts, targets, masks, device)

    print(f"\n   Best validation R² (n_train={n_train}, n_val={n_val}):")
    for ax, r2 in zip(AXES, r2_scores):
        print(f"     {ax}: R² = {r2:.4f}")
    avg_r2 = sum(r2_scores) / len(r2_scores)
    print(f"     average: R² = {avg_r2:.4f}")

    # 5. Export
    print("\n5. Exporting model...")
    export_model(model, tokenizer, hidden_size, r2_scores, n_train, n_val)

    print("\n" + "=" * 60)
    print(f"Done. Quality model v6.1 trained on {n_train + n_val} rows.")
    print(f"Average R² = {avg_r2:.4f}")
    print("=" * 60)


if __name__ == "__main__":
    main()
