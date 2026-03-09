#!/usr/bin/env python3
"""Verifily v7 — Cloud training pipeline for 3-model ensemble quality regressor.

Self-contained script designed for RunPod A100 80GB.

5-phase pipeline:
  Phase 1: Train initial deberta-v3-large on all 117k rows
  Phase 2: Data cleaning — remove noisiest 10% of labels
  Phase 3: Retrain on cleaned data (seed=42)
  Phase 4: Ensemble — train 2 more models (seeds 123, 456) on cleaned data
  Phase 5: Export — package all models + tokenizer + metadata

Architecture (each of 3 models):
  microsoft/deberta-v3-large (435M params, 24 layers, 1024-dim)
    → CLS token (1024-dim)
    → Dropout(0.1)
    → Linear(1024, 512) → GELU → Dropout(0.15) → Linear(512, 4)
    → Sigmoid

Usage:
  cd /workspace
  python3 cloud_train.py 2>&1 | tee training.log

Inputs:
  /workspace/combined_quality.jsonl  (117k rows, uploaded from local)

Outputs:
  /workspace/quality_model/          (3 model.pt files + tokenizer + meta)
"""

from __future__ import annotations

import copy
import json
import math
import os
import random
import time
from typing import Dict, List, Optional, Tuple

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset
from tqdm import tqdm
from transformers import AutoModel, AutoTokenizer

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

BASE_MODEL = "microsoft/deberta-v3-large"
HIDDEN_SIZE = 1024
HEAD_HIDDEN = 512
HEAD_DROPOUT = 0.15
NUM_AXES = 4
AXES = ["coherence", "informativeness", "complexity", "overall"]

MAX_SEQ_LEN = 512
BATCH_SIZE = 32
GRAD_ACCUM = 2  # effective batch = 64
EPOCHS = 10
PATIENCE = 3
LR_TRANSFORMER = 1e-5
LR_HEAD = 3e-4
WEIGHT_DECAY = 0.01
WARMUP_RATIO = 0.06
GRAD_CLIP = 1.0
LLRD_FACTOR = 0.85  # layer-wise learning rate decay

HUBER_DELTA = 0.2
AXIS_WEIGHTS = [1.0, 1.4, 2.5, 1.4]

ENSEMBLE_SEEDS = [42, 123, 456]
CLEANING_PERCENTILE = 90  # remove top 10% by loss

VAL_FRACTION = 0.10

DATA_PATH = os.environ.get(
    "VERIFILY_DATA_PATH",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "combined_quality.jsonl"),
)
OUTPUT_DIR = os.environ.get(
    "VERIFILY_OUTPUT_DIR",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "quality_model"),
)


# ---------------------------------------------------------------------------
# Reproducibility
# ---------------------------------------------------------------------------

def set_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


# ---------------------------------------------------------------------------
# Data loading
# ---------------------------------------------------------------------------

def load_data(path: str) -> List[dict]:
    """Load combined_quality.jsonl."""
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"{path} not found. Upload combined_quality.jsonl to /workspace/"
        )
    rows = []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    print(f"  Loaded {len(rows)} rows from {path}")
    return rows


def prepare_training_data(
    rows: List[dict],
) -> Tuple[List[str], List[List[float]], List[List[bool]]]:
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

        if not any(mask):
            continue

        texts.append(text.strip())
        targets.append(target)
        masks.append(mask)

    return texts, targets, masks


# ---------------------------------------------------------------------------
# Dataset
# ---------------------------------------------------------------------------

class QualityDataset(Dataset):
    def __init__(
        self,
        texts: List[str],
        targets: List[List[float]],
        masks: List[List[bool]],
        tokenizer,
        max_length: int = MAX_SEQ_LEN,
    ):
        self.texts = texts
        self.targets = targets
        self.masks = masks
        self.tokenizer = tokenizer
        self.max_length = max_length

    def __len__(self) -> int:
        return len(self.texts)

    def __getitem__(self, idx: int) -> dict:
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
            "masks": torch.tensor(
                [float(m) for m in self.masks[idx]], dtype=torch.float32
            ),
        }


# ---------------------------------------------------------------------------
# Model
# ---------------------------------------------------------------------------

class QualityModel(nn.Module):
    """deberta-v3-large + shared expanded regression head."""

    def __init__(
        self,
        base_model: nn.Module,
        hidden_size: int = HIDDEN_SIZE,
        num_axes: int = NUM_AXES,
        head_hidden: int = HEAD_HIDDEN,
        head_dropout: float = HEAD_DROPOUT,
    ):
        super().__init__()
        self.base = base_model
        self.dropout = nn.Dropout(0.1)
        self.head = nn.Sequential(
            nn.Linear(hidden_size, head_hidden),
            nn.GELU(),
            nn.Dropout(head_dropout),
            nn.Linear(head_hidden, num_axes),
        )
        self.sigmoid = nn.Sigmoid()

    def forward(
        self,
        input_ids: torch.Tensor,
        attention_mask: torch.Tensor,
    ) -> torch.Tensor:
        outputs = self.base(input_ids=input_ids, attention_mask=attention_mask)
        cls = self.dropout(outputs.last_hidden_state[:, 0])
        return self.sigmoid(self.head(cls))


def build_model(seed: int = 42) -> Tuple[QualityModel, AutoTokenizer]:
    """Build a fresh deberta-v3-large + quality head."""
    set_seed(seed)
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
    base = AutoModel.from_pretrained(BASE_MODEL, dtype=torch.float32)
    model = QualityModel(base)
    n_params = sum(p.numel() for p in model.parameters())
    print(f"  Built model ({n_params:,} params, seed={seed})")
    return model, tokenizer


# ---------------------------------------------------------------------------
# Training loop
# ---------------------------------------------------------------------------

def compute_r2(preds: List[float], targets: List[float]) -> float:
    """Compute R² for a single axis."""
    if len(preds) < 10:
        return 0.0
    p = torch.tensor(preds)
    t = torch.tensor(targets)
    ss_res = ((p - t) ** 2).sum()
    ss_tot = ((t - t.mean()) ** 2).sum()
    return (1.0 - ss_res / ss_tot.clamp(min=1e-8)).item()


def train_model(
    model: QualityModel,
    tokenizer: AutoTokenizer,
    texts: List[str],
    targets: List[List[float]],
    masks: List[List[bool]],
    device: torch.device,
    seed: int = 42,
    tag: str = "",
) -> Tuple[QualityModel, List[float], int, int]:
    """Full training loop with early stopping.

    Returns (model, best_r2_per_axis, n_train, n_val).
    """
    set_seed(seed)

    n = len(texts)
    n_val = int(n * VAL_FRACTION)
    n_train = n - n_val

    # Deterministic shuffle with this seed
    indices = list(range(n))
    rng = random.Random(seed)
    rng.shuffle(indices)

    train_texts = [texts[i] for i in indices[:n_train]]
    train_targets = [targets[i] for i in indices[:n_train]]
    train_masks = [masks[i] for i in indices[:n_train]]
    val_texts = [texts[i] for i in indices[n_train:]]
    val_targets = [targets[i] for i in indices[n_train:]]
    val_masks = [masks[i] for i in indices[n_train:]]

    train_ds = QualityDataset(train_texts, train_targets, train_masks, tokenizer)
    val_ds = QualityDataset(val_texts, val_targets, val_masks, tokenizer)

    train_loader = DataLoader(
        train_ds, batch_size=BATCH_SIZE, shuffle=True, num_workers=4, pin_memory=True,
    )
    val_loader = DataLoader(
        val_ds, batch_size=BATCH_SIZE * 2, shuffle=False, num_workers=4, pin_memory=True,
    )

    # Layer-wise learning rate decay (LLRD) for transformer
    # Higher LR for top layers, lower for bottom layers
    opt_groups = []
    num_layers = model.base.config.num_hidden_layers  # 24 for deberta-v3-large

    # Embeddings get lowest LR
    embed_params = list(model.base.embeddings.parameters())
    if embed_params:
        opt_groups.append({
            "params": embed_params,
            "lr": LR_TRANSFORMER * (LLRD_FACTOR ** num_layers),
        })

    # Each encoder layer gets progressively higher LR
    for layer_idx in range(num_layers):
        layer_params = list(model.base.encoder.layer[layer_idx].parameters())
        layer_lr = LR_TRANSFORMER * (LLRD_FACTOR ** (num_layers - 1 - layer_idx))
        opt_groups.append({"params": layer_params, "lr": layer_lr})

    # Remaining transformer params (LayerNorm, etc.) get full transformer LR
    assigned = set()
    for g in opt_groups:
        for p in g["params"]:
            assigned.add(id(p))
    remaining_base = [p for p in model.base.parameters() if id(p) not in assigned]
    if remaining_base:
        opt_groups.append({"params": remaining_base, "lr": LR_TRANSFORMER})

    # Head gets highest LR
    head_params = list(model.dropout.parameters()) + list(model.head.parameters())
    opt_groups.append({"params": head_params, "lr": LR_HEAD})

    optimizer = torch.optim.AdamW(opt_groups, weight_decay=WEIGHT_DECAY)

    total_steps = (len(train_loader) // GRAD_ACCUM) * EPOCHS
    warmup_steps = int(total_steps * WARMUP_RATIO)

    # Each param group gets its own lambda (all use the same cosine schedule)
    def lr_lambda(step: int) -> float:
        if step < warmup_steps:
            return step / max(1, warmup_steps)
        progress = (step - warmup_steps) / max(1, total_steps - warmup_steps)
        return 0.5 * (1.0 + math.cos(math.pi * progress))

    scheduler = torch.optim.lr_scheduler.LambdaLR(
        optimizer, [lr_lambda] * len(opt_groups),
    )

    # Huber loss (SmoothL1 with beta=delta) + per-axis weights
    loss_fn = nn.SmoothL1Loss(beta=HUBER_DELTA, reduction="none")
    axis_weights = torch.tensor(AXIS_WEIGHTS, dtype=torch.float32, device=device).unsqueeze(0)

    model = model.to(device)
    use_amp = torch.cuda.is_available()
    scaler = torch.amp.GradScaler("cuda") if use_amp else None

    best_val_loss = float("inf")
    best_state = None
    best_r2: Optional[List[float]] = None
    no_improve = 0

    prefix = f"[{tag}] " if tag else ""

    for epoch in range(EPOCHS):
        model.train()
        epoch_loss = 0.0
        n_batches = 0
        t0 = time.time()

        optimizer.zero_grad(set_to_none=True)
        pbar = tqdm(train_loader, desc=f"{prefix}Epoch {epoch+1}/{EPOCHS}", leave=False)
        for batch_idx, batch in enumerate(pbar):
            input_ids = batch["input_ids"].to(device, non_blocking=True)
            attention_mask = batch["attention_mask"].to(device, non_blocking=True)
            tgt = batch["targets"].to(device, non_blocking=True)
            mask = batch["masks"].to(device, non_blocking=True)

            if use_amp:
                with torch.amp.autocast(device_type="cuda", dtype=torch.float16):
                    preds = model(input_ids, attention_mask)
                    per_elem = loss_fn(preds, tgt)
                    weighted = per_elem * mask * axis_weights
                    loss = weighted.sum() / (mask * axis_weights).sum().clamp(min=1)
                    loss = loss / GRAD_ACCUM
                scaler.scale(loss).backward()
            else:
                preds = model(input_ids, attention_mask)
                per_elem = loss_fn(preds, tgt)
                weighted = per_elem * mask * axis_weights
                loss = weighted.sum() / (mask * axis_weights).sum().clamp(min=1)
                loss = loss / GRAD_ACCUM
                loss.backward()

            if (batch_idx + 1) % GRAD_ACCUM == 0 or (batch_idx + 1) == len(train_loader):
                if use_amp:
                    scaler.unscale_(optimizer)
                    torch.nn.utils.clip_grad_norm_(model.parameters(), GRAD_CLIP)
                    scaler.step(optimizer)
                    scaler.update()
                else:
                    torch.nn.utils.clip_grad_norm_(model.parameters(), GRAD_CLIP)
                    optimizer.step()
                scheduler.step()
                optimizer.zero_grad(set_to_none=True)

            epoch_loss += loss.item() * GRAD_ACCUM
            n_batches += 1
            pbar.set_postfix(loss=f"{loss.item() * GRAD_ACCUM:.4f}")

        avg_train_loss = epoch_loss / max(n_batches, 1)

        # Validation
        model.eval()
        val_loss = 0.0
        val_batches = 0
        axis_preds: Dict[str, List[float]] = {ax: [] for ax in AXES}
        axis_tgts: Dict[str, List[float]] = {ax: [] for ax in AXES}

        with torch.no_grad():
            for batch in val_loader:
                input_ids = batch["input_ids"].to(device, non_blocking=True)
                attention_mask = batch["attention_mask"].to(device, non_blocking=True)
                tgt = batch["targets"].to(device, non_blocking=True)
                mask = batch["masks"].to(device, non_blocking=True)

                if use_amp:
                    with torch.amp.autocast(device_type="cuda", dtype=torch.float16):
                        preds = model(input_ids, attention_mask)
                else:
                    preds = model(input_ids, attention_mask)

                # Unweighted loss for fair early stopping
                per_elem = loss_fn(preds, tgt)
                masked_loss = (per_elem * mask).sum() / mask.sum().clamp(min=1)
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

        val_loss /= max(val_batches, 1)

        # Per-axis R²
        r2_per_axis = []
        for ax in AXES:
            r2 = compute_r2(axis_preds[ax], axis_tgts[ax])
            r2_per_axis.append(r2)

        r2_str = ", ".join(f"{a}={r:.3f}" for a, r in zip(AXES, r2_per_axis))
        avg_r2 = sum(r2_per_axis) / len(r2_per_axis)
        cur_lr = scheduler.get_last_lr()[0]
        elapsed = time.time() - t0

        print(
            f"  {prefix}Epoch {epoch+1}/{EPOCHS}: "
            f"train={avg_train_loss:.4f} val={val_loss:.4f} "
            f"lr={cur_lr:.2e} R²=[{r2_str}] avg={avg_r2:.3f} "
            f"({elapsed:.0f}s)"
        )

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}
            best_r2 = list(r2_per_axis)
            no_improve = 0
        else:
            no_improve += 1
            if no_improve >= PATIENCE:
                print(f"  {prefix}Early stopping at epoch {epoch+1}")
                break

    model.load_state_dict(best_state)
    model = model.cpu()

    return model, best_r2, n_train, n_val


# ---------------------------------------------------------------------------
# Phase 1: Initial large model training
# ---------------------------------------------------------------------------

def phase1_initial_train(
    texts: List[str],
    targets: List[List[float]],
    masks: List[List[bool]],
    device: torch.device,
) -> Tuple[QualityModel, AutoTokenizer, List[float]]:
    """Phase 1: Train deberta-v3-large on all data."""
    print("\n" + "=" * 60)
    print("PHASE 1: Initial large model training (all data)")
    print("=" * 60)

    model, tokenizer = build_model(seed=42)
    model, r2_scores, n_train, n_val = train_model(
        model, tokenizer, texts, targets, masks, device, seed=42, tag="P1",
    )

    avg_r2 = sum(r2_scores) / len(r2_scores)
    print(f"\n  Phase 1 result: avg R² = {avg_r2:.4f}")
    for ax, r2 in zip(AXES, r2_scores):
        print(f"    {ax}: R² = {r2:.4f}")

    return model, tokenizer, r2_scores


# ---------------------------------------------------------------------------
# Phase 2: Data cleaning
# ---------------------------------------------------------------------------

def phase2_clean_data(
    model: QualityModel,
    tokenizer: AutoTokenizer,
    texts: List[str],
    targets: List[List[float]],
    masks: List[List[bool]],
    device: torch.device,
) -> Tuple[List[int], dict]:
    """Phase 2: Score all training rows, remove noisiest 10%.

    Returns (clean_indices, cleaning_report).
    """
    print("\n" + "=" * 60)
    print("PHASE 2: Data cleaning (removing noisy labels)")
    print("=" * 60)

    model = model.to(device)
    model.eval()

    loss_fn = nn.SmoothL1Loss(beta=HUBER_DELTA, reduction="none")

    ds = QualityDataset(texts, targets, masks, tokenizer)
    loader = DataLoader(
        ds, batch_size=BATCH_SIZE * 2, shuffle=False, num_workers=4, pin_memory=True,
    )

    per_sample_loss = []

    with torch.no_grad():
        for batch in tqdm(loader, desc="Scoring all rows"):
            input_ids = batch["input_ids"].to(device, non_blocking=True)
            attention_mask = batch["attention_mask"].to(device, non_blocking=True)
            tgt = batch["targets"].to(device, non_blocking=True)
            mask = batch["masks"].to(device, non_blocking=True)

            preds = model(input_ids, attention_mask)
            per_elem = loss_fn(preds, tgt)
            # Per-sample: average loss across labeled axes
            sample_loss = (per_elem * mask).sum(dim=1) / mask.sum(dim=1).clamp(min=1)
            per_sample_loss.extend(sample_loss.cpu().tolist())

    model = model.cpu()

    per_sample_loss = np.array(per_sample_loss)
    threshold = np.percentile(per_sample_loss, CLEANING_PERCENTILE)
    clean_mask = per_sample_loss <= threshold
    clean_indices = [i for i, keep in enumerate(clean_mask) if keep]
    removed_indices = [i for i, keep in enumerate(clean_mask) if not keep]

    report = {
        "original_rows": len(texts),
        "cleaned_rows": len(clean_indices),
        "removed_rows": len(removed_indices),
        "percentile": CLEANING_PERCENTILE,
        "loss_threshold": float(threshold),
        "mean_loss_kept": float(per_sample_loss[clean_mask].mean()),
        "mean_loss_removed": float(per_sample_loss[~clean_mask].mean()),
    }

    print(f"  Original: {report['original_rows']} rows")
    print(f"  Removed:  {report['removed_rows']} rows (loss > {threshold:.4f})")
    print(f"  Cleaned:  {report['cleaned_rows']} rows")
    print(f"  Mean loss kept:    {report['mean_loss_kept']:.4f}")
    print(f"  Mean loss removed: {report['mean_loss_removed']:.4f}")

    # Save report + clean indices for resume
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    report_path = os.path.join(OUTPUT_DIR, "data_cleaning_report.json")
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)
    indices_path = os.path.join(OUTPUT_DIR, "clean_indices.json")
    with open(indices_path, "w") as f:
        json.dump(clean_indices, f)
    print(f"  Saved cleaning report to {report_path}")
    print(f"  Saved {len(clean_indices)} clean indices to {indices_path}")

    return clean_indices, report


# ---------------------------------------------------------------------------
# Phase 3: Retrain on cleaned data (seed=42)
# ---------------------------------------------------------------------------

def phase3_retrain(
    tokenizer: AutoTokenizer,
    texts: List[str],
    targets: List[List[float]],
    masks: List[List[bool]],
    clean_indices: List[int],
    device: torch.device,
) -> Tuple[QualityModel, List[float]]:
    """Phase 3: Retrain on cleaned data with seed=42."""
    print("\n" + "=" * 60)
    print("PHASE 3: Retrain on cleaned data (seed=42)")
    print("=" * 60)

    clean_texts = [texts[i] for i in clean_indices]
    clean_targets = [targets[i] for i in clean_indices]
    clean_masks = [masks[i] for i in clean_indices]
    print(f"  Training on {len(clean_texts)} cleaned rows")

    model, _ = build_model(seed=42)
    model, r2_scores, n_train, n_val = train_model(
        model, tokenizer, clean_texts, clean_targets, clean_masks,
        device, seed=42, tag="P3-seed42",
    )

    avg_r2 = sum(r2_scores) / len(r2_scores)
    print(f"\n  Phase 3 result: avg R² = {avg_r2:.4f}")
    for ax, r2 in zip(AXES, r2_scores):
        print(f"    {ax}: R² = {r2:.4f}")

    # Save checkpoint immediately (survive pod migration)
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    ckpt_path = os.path.join(OUTPUT_DIR, "model_seed42.pt")
    torch.save(model.state_dict(), ckpt_path)
    r2_path = os.path.join(OUTPUT_DIR, "r2_seed42.json")
    with open(r2_path, "w") as f:
        json.dump(dict(zip(AXES, r2_scores)), f)
    print(f"  Checkpoint saved: {ckpt_path}")

    return model, r2_scores


# ---------------------------------------------------------------------------
# Phase 4: Ensemble (seeds 123, 456)
# ---------------------------------------------------------------------------

def phase4_ensemble(
    tokenizer: AutoTokenizer,
    texts: List[str],
    targets: List[List[float]],
    masks: List[List[bool]],
    clean_indices: List[int],
    device: torch.device,
) -> List[Tuple[QualityModel, int, List[float]]]:
    """Phase 4: Train 2 more models on cleaned data with different seeds.

    Returns list of (model, seed, r2_scores).
    """
    print("\n" + "=" * 60)
    print("PHASE 4: Ensemble training (seeds 123, 456)")
    print("=" * 60)

    clean_texts = [texts[i] for i in clean_indices]
    clean_targets = [targets[i] for i in clean_indices]
    clean_masks = [masks[i] for i in clean_indices]

    results = []
    for seed in ENSEMBLE_SEEDS[1:]:  # 123, 456
        print(f"\n  --- Training ensemble member seed={seed} ---")
        model, _ = build_model(seed=seed)
        model, r2_scores, n_train, n_val = train_model(
            model, tokenizer, clean_texts, clean_targets, clean_masks,
            device, seed=seed, tag=f"P4-seed{seed}",
        )

        avg_r2 = sum(r2_scores) / len(r2_scores)
        print(f"\n  Seed {seed} result: avg R² = {avg_r2:.4f}")
        for ax, r2 in zip(AXES, r2_scores):
            print(f"    {ax}: R² = {r2:.4f}")

        # Save checkpoint immediately (survive pod migration)
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        ckpt_path = os.path.join(OUTPUT_DIR, f"model_seed{seed}.pt")
        torch.save(model.state_dict(), ckpt_path)
        r2_path = os.path.join(OUTPUT_DIR, f"r2_seed{seed}.json")
        with open(r2_path, "w") as f:
            json.dump(dict(zip(AXES, r2_scores)), f)
        print(f"  Checkpoint saved: {ckpt_path}")

        results.append((model, seed, r2_scores))

    return results


# ---------------------------------------------------------------------------
# Phase 5: Export
# ---------------------------------------------------------------------------

def phase5_export(
    models: List[Tuple[QualityModel, int, List[float]]],
    tokenizer: AutoTokenizer,
    cleaning_report: dict,
) -> None:
    """Phase 5: Export all models + tokenizer + metadata."""
    print("\n" + "=" * 60)
    print("PHASE 5: Export")
    print("=" * 60)

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    model_files = []
    all_r2 = {ax: [] for ax in AXES}

    for model, seed, r2_scores in models:
        filename = f"model_seed{seed}.pt"
        filepath = os.path.join(OUTPUT_DIR, filename)
        torch.save(model.state_dict(), filepath)
        model_files.append(filename)
        size_mb = os.path.getsize(filepath) / (1024 * 1024)
        print(f"  Saved {filename} ({size_mb:.0f} MB)")

        for ax, r2 in zip(AXES, r2_scores):
            all_r2[ax].append(r2)

    # Save tokenizer
    tokenizer.save_pretrained(OUTPUT_DIR)
    print(f"  Saved tokenizer to {OUTPUT_DIR}/")

    # Compute ensemble R² (average of individual model R²s)
    ensemble_r2 = {ax: round(np.mean(all_r2[ax]), 4) for ax in AXES}
    avg_r2 = round(np.mean(list(ensemble_r2.values())), 4)

    # Per-model R² for metadata
    per_model_r2 = {}
    for model, seed, r2_scores in models:
        per_model_r2[f"seed{seed}"] = {
            ax: round(r2, 4) for ax, r2 in zip(AXES, r2_scores)
        }

    meta = {
        "version": 7,
        "base_model": BASE_MODEL,
        "hidden_size": HIDDEN_SIZE,
        "head_hidden": HEAD_HIDDEN,
        "head_dropout": HEAD_DROPOUT,
        "num_axes": NUM_AXES,
        "output_axes": AXES,
        "max_seq_length": MAX_SEQ_LEN,
        "ensemble": True,
        "model_files": model_files,
        "val_r2": ensemble_r2,
        "avg_r2": avg_r2,
        "per_model_r2": per_model_r2,
        "loss_function": "huber",
        "huber_delta": HUBER_DELTA,
        "data_cleaning": {
            "original_rows": cleaning_report["original_rows"],
            "cleaned_rows": cleaning_report["cleaned_rows"],
            "percentile": cleaning_report["percentile"],
        },
        "training_config": {
            "epochs": EPOCHS,
            "batch_size": BATCH_SIZE,
            "lr_transformer": LR_TRANSFORMER,
            "lr_head": LR_HEAD,
            "weight_decay": WEIGHT_DECAY,
            "warmup_ratio": WARMUP_RATIO,
            "axis_weights": AXIS_WEIGHTS,
            "patience": PATIENCE,
            "seeds": ENSEMBLE_SEEDS,
        },
    }

    meta_path = os.path.join(OUTPUT_DIR, "quality_meta.json")
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)
    print(f"  Saved metadata to {meta_path}")

    total_size = sum(
        os.path.getsize(os.path.join(OUTPUT_DIR, mf)) for mf in model_files
    )
    print(f"\n  Total model size: {total_size / (1024**3):.2f} GB")
    print(f"  Ensemble avg R²: {avg_r2}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def _detect_resume_phase() -> str:
    """Auto-detect which phase to resume from based on saved checkpoints."""
    model_files = {
        seed: os.path.exists(os.path.join(OUTPUT_DIR, f"model_seed{seed}.pt"))
        for seed in ENSEMBLE_SEEDS
    }
    has_clean_indices = os.path.exists(os.path.join(OUTPUT_DIR, "clean_indices.json"))

    if all(model_files.values()):
        return "phase5"  # all 3 models exist, just export
    if model_files[42] and model_files.get(123, False):
        return "phase4_seed456"  # seed42+123 done, only 456 left
    if model_files[42]:
        return "phase4"  # seed42 done, train 123+456
    if has_clean_indices:
        return "phase3"  # clean indices saved, retrain from scratch
    return "phase1"  # start from beginning


def _load_checkpoint_model(seed: int, device: torch.device) -> Tuple[QualityModel, List[float]]:
    """Load a saved model checkpoint + its R² scores."""
    model, tokenizer = build_model(seed=seed)
    ckpt_path = os.path.join(OUTPUT_DIR, f"model_seed{seed}.pt")
    model.load_state_dict(torch.load(ckpt_path, map_location="cpu"))
    r2_path = os.path.join(OUTPUT_DIR, f"r2_seed{seed}.json")
    with open(r2_path) as f:
        r2_dict = json.load(f)
    r2_scores = [r2_dict[ax] for ax in AXES]
    print(f"  Loaded checkpoint: model_seed{seed}.pt (avg R²={sum(r2_scores)/len(r2_scores):.4f})")
    return model, r2_scores


def main():
    t_start = time.time()

    print("=" * 60)
    print("Verifily v7 — Cloud-Trained Production Quality Model")
    print(f"  Base model: {BASE_MODEL}")
    print(f"  Head: shared expanded ({HEAD_HIDDEN}-dim, GELU, dropout {HEAD_DROPOUT})")
    print(f"  Loss: Huber (delta={HUBER_DELTA}), axis weights={AXIS_WEIGHTS}")
    print(f"  Ensemble seeds: {ENSEMBLE_SEEDS}")
    print(f"  Data cleaning: remove top {100 - CLEANING_PERCENTILE}% by loss")
    print(f"  Batch size: {BATCH_SIZE}, epochs: {EPOCHS}, patience: {PATIENCE}")
    print(f"  Data: {DATA_PATH}")
    print(f"  Output: {OUTPUT_DIR}")
    print("=" * 60)

    # Auto-detect resume point
    resume_from = _detect_resume_phase()
    if resume_from != "phase1":
        print(f"\n  >>> RESUMING from {resume_from} (checkpoints detected) <<<")

    # Device
    if torch.cuda.is_available():
        device = torch.device("cuda")
        print(f"\nDevice: {device} ({torch.cuda.get_device_name()})")
        print(f"  VRAM: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
    elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        device = torch.device("mps")
        print(f"\nDevice: {device}")
    else:
        device = torch.device("cpu")
        print(f"\nDevice: {device} (WARNING: training will be very slow)")

    # Load data
    print("\n1. Loading data...")
    rows = load_data(DATA_PATH)
    texts, targets, masks = prepare_training_data(rows)
    print(f"   {len(texts)} valid rows")
    for ax_idx, ax in enumerate(AXES):
        labeled = sum(1 for m in masks if m[ax_idx])
        pct = labeled * 100 // len(texts)
        print(f"   {ax}: {labeled} labeled ({pct}%) [weight={AXIS_WEIGHTS[ax_idx]}]")

    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)

    if resume_from == "phase1":
        # Phase 1: Initial training on all data
        p1_model, tokenizer, p1_r2 = phase1_initial_train(texts, targets, masks, device)

        # Phase 2: Data cleaning
        clean_indices, cleaning_report = phase2_clean_data(
            p1_model, tokenizer, texts, targets, masks, device,
        )

        # Phase 3: Retrain on cleaned data (seed=42)
        p3_model, p3_r2 = phase3_retrain(
            tokenizer, texts, targets, masks, clean_indices, device,
        )

        # Phase 4: Ensemble (seeds 123, 456)
        p4_results = phase4_ensemble(
            tokenizer, texts, targets, masks, clean_indices, device,
        )

    elif resume_from == "phase3":
        # Load clean indices from saved file
        indices_path = os.path.join(OUTPUT_DIR, "clean_indices.json")
        with open(indices_path) as f:
            clean_indices = json.load(f)
        report_path = os.path.join(OUTPUT_DIR, "data_cleaning_report.json")
        with open(report_path) as f:
            cleaning_report = json.load(f)
        print(f"\n  Loaded {len(clean_indices)} clean indices from checkpoint")

        # Phase 3: Retrain on cleaned data (seed=42)
        p3_model, p3_r2 = phase3_retrain(
            tokenizer, texts, targets, masks, clean_indices, device,
        )

        # Phase 4: Ensemble (seeds 123, 456)
        p4_results = phase4_ensemble(
            tokenizer, texts, targets, masks, clean_indices, device,
        )

    elif resume_from == "phase4":
        # Load clean indices + seed42 checkpoint
        indices_path = os.path.join(OUTPUT_DIR, "clean_indices.json")
        with open(indices_path) as f:
            clean_indices = json.load(f)
        report_path = os.path.join(OUTPUT_DIR, "data_cleaning_report.json")
        with open(report_path) as f:
            cleaning_report = json.load(f)

        p3_model, p3_r2 = _load_checkpoint_model(42, device)

        # Phase 4: Train both seeds 123 and 456
        p4_results = phase4_ensemble(
            tokenizer, texts, targets, masks, clean_indices, device,
        )

    elif resume_from == "phase4_seed456":
        # Load clean indices + seed42 + seed123 checkpoints
        indices_path = os.path.join(OUTPUT_DIR, "clean_indices.json")
        with open(indices_path) as f:
            clean_indices = json.load(f)
        report_path = os.path.join(OUTPUT_DIR, "data_cleaning_report.json")
        with open(report_path) as f:
            cleaning_report = json.load(f)

        p3_model, p3_r2 = _load_checkpoint_model(42, device)
        p4_model_123, p4_r2_123 = _load_checkpoint_model(123, device)

        # Only train seed 456
        clean_texts = [texts[i] for i in clean_indices]
        clean_targets = [targets[i] for i in clean_indices]
        clean_masks = [masks[i] for i in clean_indices]

        print("\n" + "=" * 60)
        print("PHASE 4 (resumed): Training seed=456 only")
        print("=" * 60)
        model_456, _ = build_model(seed=456)
        model_456, r2_456, _, _ = train_model(
            model_456, tokenizer, clean_texts, clean_targets, clean_masks,
            device, seed=456, tag="P4-seed456",
        )
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        torch.save(model_456.state_dict(), os.path.join(OUTPUT_DIR, "model_seed456.pt"))
        with open(os.path.join(OUTPUT_DIR, "r2_seed456.json"), "w") as f:
            json.dump(dict(zip(AXES, r2_456)), f)

        p4_results = [(p4_model_123, 123, p4_r2_123), (model_456, 456, r2_456)]

    elif resume_from == "phase5":
        # All models exist, just load and export
        indices_path = os.path.join(OUTPUT_DIR, "clean_indices.json")
        with open(indices_path) as f:
            clean_indices = json.load(f)
        report_path = os.path.join(OUTPUT_DIR, "data_cleaning_report.json")
        with open(report_path) as f:
            cleaning_report = json.load(f)

        p3_model, p3_r2 = _load_checkpoint_model(42, device)
        p4_model_123, p4_r2_123 = _load_checkpoint_model(123, device)
        p4_model_456, p4_r2_456 = _load_checkpoint_model(456, device)
        p4_results = [(p4_model_123, 123, p4_r2_123), (p4_model_456, 456, p4_r2_456)]

    # Combine all 3 models: seed42 from phase3 + seed123, seed456 from phase4
    all_models = [(p3_model, 42, p3_r2)] + p4_results

    # Phase 5: Export
    phase5_export(all_models, tokenizer, cleaning_report)

    elapsed = time.time() - t_start
    hours = int(elapsed // 3600)
    minutes = int((elapsed % 3600) // 60)
    print(f"\n{'=' * 60}")
    print(f"DONE. Total time: {hours}h {minutes}m")
    print(f"Output: {OUTPUT_DIR}/")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
