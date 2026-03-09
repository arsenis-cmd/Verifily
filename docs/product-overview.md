# Verifily — Product Overview

**ML data quality infrastructure. Evaluate, score, clean, and monitor datasets — from ingestion to production.**

Verifily is a complete platform for ML data quality. It scores every row in your dataset on six quality axes using trained transformer models, detects contamination and drift, produces ship/don't-ship decisions, and runs as a CLI, API server, or Python SDK. One command gates your pipeline. Sixty endpoints power your infrastructure.

---

## The Problem

ML teams don't have infrastructure for data quality. They have model evaluation (loss curves, benchmarks) but nothing that answers: *is the data itself good enough to train on?*

| Failure | What happens | What Verifily does |
|---------|-------------|-------------------|
| Low-quality training data | Model learns noise, poor generalization | Scores every row on coherence, informativeness, complexity, safety, formatting, uniqueness |
| Eval contamination | Training data overlaps with eval set; metrics are inflated | SHA-256 exact matching + n-gram Jaccard similarity detection |
| Distribution drift | Production data diverges from training distribution | 8 statistical tests including Classifier Two-Sample Test (C2ST) |
| No quality signal | "The data looks fine" — no quantitative measure | Trained DeBERTa-v3-large ensemble (117k human annotations, R²=0.32) |
| Silent regression | Quality drops between dataset versions; nobody notices | Dataset diff with structural, distributional, and semantic comparison |
| PII in training data | Names, emails, phone numbers in dataset rows | Regex-based PII scanner with configurable thresholds and redaction |
| Irreproducible runs | "It worked on my machine" | SHA-256 hash chain over config, data, environment, and seed |
| No audit trail | Cannot explain why a model was shipped or held | Decision summary (JSON + plaintext) persisted alongside run artifacts |

---

## Core Capabilities

### 1. Multi-Axis Quality Annotation

Score every row in your dataset on six quality axes using trained ML models. No heuristics in the main path — real transformer inference with graceful fallbacks.

```bash
verifily annotate --in data/train.jsonl --out annotations/
```

| Axis | Model | What It Measures |
|------|-------|-----------------|
| Coherence | Fine-tuned DeBERTa-v3-large ensemble | Logical structure and flow |
| Informativeness | Fine-tuned DeBERTa-v3-large ensemble | Useful information density |
| Complexity | Fine-tuned DeBERTa-v3-large ensemble | Linguistic and conceptual depth |
| Safety | toxic-bert (unitary/toxic-bert) | Toxicity and harmful content |
| Formatting | distilgpt2 perplexity scoring | Text fluency and formatting quality |
| Uniqueness | Sentence-transformer dense embeddings | Novelty relative to the dataset |

**Quality model**: 3-model ensemble of DeBERTa-v3-large (435M params each), trained end-to-end on 105k cleaned human annotations from HelpSteer2, UltraFeedback, and oasst2. Huber loss, layer-wise learning rate decay, missing-label masking. Each row gets four continuous scores (0-1) that aggregate into dataset-level quality profiles.

**Fallback chain**: Every axis degrades gracefully. If torch is unavailable, sentence-transformers provides embeddings. If no ML at all, pure-Python heuristics (Flesch-Kincaid, Jaccard, regex) take over. The pipeline never crashes — it adapts.

### 2. Intelligent Data Selection

Select the best subset of your data for training using quality-aware strategies.

```bash
verifily select --in data/train.jsonl --budget 5000 --strategy quality_diverse
```

| Strategy | How It Works |
|----------|-------------|
| `quality_diverse` (default) | MMR-variant balancing quality scores and embedding diversity |
| `quality_top` | Top-K by aggregate quality score |
| `diverse` | Farthest-point sampling for maximum coverage |
| `random` | Random sampling with deterministic seed |

Deduplication filter runs before selection (configurable similarity threshold). Both dense (sentence-transformer) and sparse (TF-IDF) similarity paths.

### 3. Quality Prediction

Predict the overall quality score of a dataset before running the full pipeline.

```bash
verifily predict --in data/train.jsonl
```

30-feature Ridge regression model trained on quality report metrics. Produces a predicted score, risk factors, and actionable recommendations. `what_if_remove` simulates removing low-quality rows and re-predicts the score.

### 4. Model Quality Judge

Aggregate quality assessment using the trained DeBERTa ensemble.

Returns a 0-100 dataset quality score, per-row scores, low-quality count, and high-quality fraction. Primary backend is the fine-tuned quality model's "overall" axis. Falls back to embedding-based scoring, then heuristics.

### 5. Contamination Detection

Detect when eval set rows have leaked into training data.

```bash
verifily contamination --train data/train.jsonl --eval data/eval.jsonl
```

- **Exact overlap**: SHA-256 hash of each row; any collision is a verbatim leak
- **Near-duplicate**: N-gram Jaccard similarity via MinHash LSH catches paraphrased copies
- **NL2SQL three-tier gate**: Exact SQL, template fingerprint, question near-duplicate

### 6. Distribution Drift Detection

Eight statistical tests to detect when data distributions shift.

```bash
verifily drift --baseline data/v1.jsonl --current data/v2.jsonl
```

| Test | Type | ML Required |
|------|------|------------|
| Kolmogorov-Smirnov | Continuous distribution comparison | No |
| Chi-squared | Categorical distribution comparison | No |
| Population Stability Index | Binned distribution shift | No |
| Vocabulary drift (sparse) | Jaccard on top-K terms | No |
| Vocabulary drift (dense) | Embedded term centroids | Yes |
| Centroid shift (sparse) | TF-IDF centroid cosine distance | No |
| Centroid shift (dense) | Sentence-transformer centroid distance | Yes |
| C2ST | Train classifier to distinguish datasets | Yes |

Severity levels: none, minor, major, severe. Each test produces a p-value, statistic, and human-readable detail.

### 7. Dataset Diff

Comprehensive comparison between two dataset versions.

```bash
verifily diff-datasets --a data/v1.jsonl --b data/v2.jsonl
```

- **Structural**: SHA-256 fingerprint matching for added/removed/unchanged rows
- **Quality**: Full annotation comparison with per-axis deltas
- **Distribution**: All 8 drift tests applied automatically
- **Semantic**: Dense embedding centroid similarity
- **Topics**: K-means topic cluster comparison

### 8. Domain Detection

Automatic domain classification with 3-tier detection and 6 domain profiles.

| Tier | Method | Accuracy |
|------|--------|----------|
| 1 | BART-large-MNLI zero-shot NLI | Highest |
| 2 | Sentence-transformer centroid matching | Medium |
| 3 | Keyword/regex heuristics | Fallback |

**Domains**: code, medical, legal, conversational, instruction, general. Each domain profile has custom quality checks, axis weight adjustments, and calibrated thresholds.

### 9. Dataset Classification

Automatic schema detection, bucketing, PII detection, and duplicate flagging.

```bash
# Via API async job
POST /v1/jobs/classify
```

Detects dataset structure, groups rows into buckets by schema similarity, tags PII and duplicates, and optionally exports per-bucket JSONL files with suggested next steps.

### 10. Pipeline Decision Gate

End-to-end: validate, score, check contamination, compare against baseline, produce a ship/don't-ship decision.

```bash
verifily pipeline --config pipeline.yaml --ci
```

Three possible outcomes:

| Recommendation | Meaning | Exit code |
|---------------|---------|-----------|
| **SHIP** | All criteria pass | 0 |
| **DONT_SHIP** | At least one hard blocker | 1 |
| **INVESTIGATE** | Ambiguous — metrics pass but risk flags present | 2 |

---

## API Server

Full REST API with 60+ endpoints. Runs locally or deployed.

```bash
verifily serve --host 0.0.0.0 --port 8000
```

**Middleware stack** (outer to inner): Request ID → Auth → Rate Limit → Billing Enforcement → Budget → Handler

### Core Endpoints

| Category | Endpoints |
|----------|-----------|
| Health | `GET /health`, `GET /ready` |
| Pipeline | `POST /v1/pipeline`, `/v1/contamination`, `/v1/report` |
| ML v2 | `POST /v1/annotate`, `/v1/select`, `/v1/predict`, `/v1/diff` |
| Async Jobs | `POST /v1/jobs/{pipeline,contamination,report,classify}`, `GET /v1/jobs/{id}`, `/v1/jobs/{id}/result` |
| Drift | Included in `/v1/diff` |
| Billing | `GET /v1/billing/{events,invoice-preview,plans,usage}`, `POST /v1/billing/{checkout,webhook}` |
| Admin | `POST /v1/admin/{orgs,users,memberships,team-projects,api-keys}` |
| Monitor | `POST /v1/monitor/{start,stop}`, `GET /v1/monitor/{status,history}` |
| Audit | `GET /v1/audit/export` |

### Authentication Modes

| Mode | Use Case |
|------|----------|
| **None** | Local development, no auth required |
| **Simple** | Single API key via `VERIFILY_API_KEY` env var |
| **Advanced** | Scoped key registry with per-key project and scope restrictions |
| **Teams** | Full multi-tenant: orgs, users, memberships, project-scoped keys |
| **Enterprise** | HMAC-signed tokens, RBAC (Owner/Admin/Member/Viewer), policy enforcement, audit export |

### Async Jobs

Long-running operations execute as background jobs with polling.

```python
job = client.submit_pipeline_job(data=rows, config=config)
result = client.wait_for_job(job["job_id"], timeout=300)
```

Job types: PIPELINE, REPORT, CONTAMINATION, CLASSIFY. JSONL persistence for crash recovery.

### Billing

Four plans with metered usage and enforcement.

| Plan | Base Price | Row Cap/Month |
|------|-----------|---------------|
| FREE | $0 | 50,000 |
| STARTER | $99 | 1,000,000 |
| PRO | $499 | 5,000,000 |
| ENTERPRISE | Custom | Unlimited |

Usage metering, invoice generation (JSON + CSV), Stripe integration (checkout sessions, webhooks, subscription management). Opt-in enforcement returns 402 when cap exceeded.

---

## Python SDK

```bash
pip install verifily[sdk]
```

```python
from verifily_sdk import VerifilyClient

client = VerifilyClient(base_url="http://localhost:8000", api_key="vfy-...")

# Annotate a dataset
result = client.annotate(texts=["Hello world", "How are you?"])

# Select best rows
selected = client.select(texts=texts, budget=1000, strategy="quality_diverse")

# Predict quality
prediction = client.predict(texts=texts)

# Compare datasets
diff = client.diff(texts_a=old_texts, texts_b=new_texts)

# Submit async job
job = client.submit_pipeline_job(data=rows, config=config)
result = client.wait_for_job(job["job_id"])

# Billing
usage = client.billing_usage(period="2026-02")
```

50+ methods covering all API endpoints. Typed exceptions, retry with backoff, context manager support.

---

## CLI Reference

```
Core
  verifily pipeline          End-to-end: validate → score → contamination → decision
  verifily annotate          Score dataset on 6 quality axes (ML-powered)
  verifily select            Select best subset using quality-aware strategies
  verifily predict           Predict dataset quality score with risk factors
  verifily report            Dataset quality report with PII scan
  verifily contamination     Detect train/eval overlap
  verifily diff-datasets     Compare two dataset versions
  verifily drift             Detect distribution drift (8 statistical tests)

Data
  verifily ingest            Normalize raw data (JSONL, CSV, Parquet, hf://)
  verifily contract-check    Validate dataset schema and run artifacts
  verifily fingerprint       Privacy-safe dataset summary

NL2SQL
  verifily nl2sql validate      Validate NL2SQL dataset structure
  verifily nl2sql fingerprint   SQL normalization + template fingerprinting
  verifily nl2sql split         Leakage-resistant train/eval splitting
  verifily nl2sql gate          Three-tier contamination gate

Infrastructure
  verifily serve             Start API server (60+ endpoints)
  verifily login             Authenticate with license key
  verifily account           Show license status and tier
  verifily doctor            Environment health check
  verifily quickstart        Scaffold a complete project
  verifily version           Show version, Python, platform

Admin (API)
  verifily admin org-create           Create organization
  verifily admin user-create          Create user
  verifily admin member-add           Add member to org
  verifily admin team-project-create  Create team project
  verifily admin key-issue            Issue scoped API key
  verifily whoami                     Show current identity

Billing (API)
  verifily billing-events    View billing events
  verifily billing-preview   Preview next invoice
  verifily billing-usage     Current period usage
```

Every command supports `--verbose` for debug output. Pipeline commands support `--ci` for CI mode.

---

## Dataset Transformation

Clean data in, versioned artifacts out.

**Eight canonical schemas** — auto-detected from field names:

| Schema | Required Fields | Use Case |
|--------|----------------|----------|
| `sft` | instruction, output | Supervised fine-tuning |
| `qa` | question, answer | Question answering |
| `classification` | text, label | Text classification |
| `chat` | messages (list of {role, content}) | Multi-turn conversations |
| `summarization` | document, summary | Summarization tasks |
| `translation` | source, target, source_lang, target_lang | Translation pairs |
| `rm_pairwise` | prompt, chosen, rejected | Reward model training |
| `nl2sql` | question, sql, schema/schema_ref | Natural language to SQL |

**Pipeline steps**: Ingest → Normalize → Flatten → Deduplicate (SHA-256 + MinHash LSH) → PII Scan → Label → Synthesize → Filter → Package

Every dataset gets a content-addressed version ID, lineage record, and SHA-256 integrity chain.

**Input formats**: JSONL, CSV, Parquet, HuggingFace Hub (`hf://` URIs), plaintext.

---

## Integrations

All opt-in with lazy imports — no hard dependencies.

| Integration | What It Does |
|-------------|-------------|
| **HuggingFace Hub** | Load datasets via `hf://` URIs |
| **Weights & Biases** | Log pipeline decisions, metrics, artifacts |
| **MLflow** | Track runs, log metrics, register models on SHIP |
| **GitHub Actions** | Pre-built action + CI config generator |
| **Stripe** | Billing checkout, webhooks, subscription management |

---

## CI Integration

```yaml
# GitHub Actions
- name: Verifily gate
  run: verifily pipeline --config pipeline.yaml --ci

# With integrations
- name: Verifily gate
  run: |
    verifily pipeline --config pipeline.yaml --ci \
      --wandb --wandb-project my-project
```

Exit code 0 = ship. Exit code 1 = don't ship. Exit code 2 = investigate.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        verifily_cli_v1                          │
│                                                                 │
│  CLI (50+ commands)          Core ML                            │
│  ├─ pipeline                 ├─ ml_backends (6 models)          │
│  ├─ annotate                 ├─ annotator (6 axes)              │
│  ├─ select                   ├─ model_judge                     │
│  ├─ predict                  ├─ learned_scorer                  │
│  ├─ report                   ├─ predictor                       │
│  ├─ contamination            ├─ selector (4 strategies)         │
│  ├─ diff-datasets            ├─ stat_tests (8 tests)            │
│  ├─ drift                    ├─ dataset_diff                    │
│  ├─ nl2sql (4 cmds)         ├─ domain_profiles (6 domains)     │
│  ├─ billing (3 cmds)        ├─ nl2sql                          │
│  ├─ admin (6 cmds)          └─ classify                        │
│  └─ serve                                                       │
│                              API Server (60+ endpoints)         │
│  Integrations                ├─ Auth (5 modes)                  │
│  ├─ huggingface              ├─ Billing (4 plans)               │
│  ├─ wandb                    ├─ Teams (RBAC)                    │
│  ├─ mlflow                   ├─ Jobs (async, persistent)        │
│  └─ stripe                   ├─ Monitor                         │
│                              └─ Audit                           │
│  Quality Model (v7)                                             │
│  ├─ 3x DeBERTa-v3-large     Enterprise Security                │
│  ├─ 105k training samples    ├─ HMAC tokens                     │
│  └─ 4 quality axes           ├─ 4-role RBAC                     │
│                              ├─ Policy enforcement              │
│                              └─ Audit export                    │
└──────────┬──────────────────────────────┬───────────────────────┘
           │                              │
           ▼                              ▼
┌──────────────────┐           ┌──────────────────────┐
│  verifily_sdk    │           │  verifily_transform   │
│                  │           │                      │
│  50+ methods     │           │  ingest → normalize  │
│  Typed errors    │           │  → dedup → PII scan  │
│  Retry/backoff   │           │  → label → package   │
│  Async jobs      │           │                      │
└──────────────────┘           └──────────────────────┘
```

**Licensing**: Ed25519 signed keys. FREE (basic), PRO ($99/mo), ENTERPRISE (custom). 14-day PRO trial on first run.

---

## ML Model Stack

| Model | Purpose | Size | Source |
|-------|---------|------|--------|
| DeBERTa-v3-large (x3) | Quality scoring (4 axes) | 1.6 GB each | Trained on HelpSteer2 + UltraFeedback + oasst2 |
| all-MiniLM-L6-v2 | Sentence embeddings (384-dim) | 80 MB | sentence-transformers |
| toxic-bert | Safety/toxicity classification | 440 MB | unitary/toxic-bert |
| distilgpt2 | Perplexity/formatting scoring | 330 MB | HuggingFace |
| BART-large-MNLI | Zero-shot domain classification | 1.6 GB | facebook/bart-large-mnli |
| Ridge regression | Quality prediction (30 features) | <1 KB | Trained on UltraFeedback |

All models are lazy-loaded on first use. Missing models degrade gracefully to heuristics. No model is required — the CLI works without any ML dependencies installed.

---

## Testing

1,725 tests covering all components. All passing.

| Area | Tests |
|------|-------|
| ML backends + quality model | ~50 |
| Annotator (6 axes) | 33 |
| Selector (4 strategies) | 13 |
| Statistical tests + C2ST | ~20 |
| Licensing | 47 |
| Billing | 123 |
| Teams RBAC | 36 |
| Enterprise security | 46 |
| API endpoints + jobs | ~200 |
| SDK | ~60 |
| Core (pipeline, contamination, etc.) | ~1,100 |

---

## Quick Start

```bash
# Install
pip install verifily              # core CLI
pip install "verifily[ml]"        # + ML models (torch, transformers, sentence-transformers)
pip install "verifily[api]"       # + API server (FastAPI, uvicorn)
pip install "verifily[all]"       # everything

# Score a dataset
verifily annotate --in data/train.jsonl --out annotations/

# Select best 5000 rows
verifily select --in data/train.jsonl --budget 5000 --strategy quality_diverse

# Check for contamination
verifily contamination --train data/train.jsonl --eval data/eval.jsonl

# Detect drift between versions
verifily drift --baseline data/v1.jsonl --current data/v2.jsonl

# Compare two datasets
verifily diff-datasets --a data/v1.jsonl --b data/v2.jsonl

# Run the full pipeline
verifily pipeline --config pipeline.yaml --ci

# Start the API server
verifily serve --host 0.0.0.0 --port 8000
```

---

## Who It's For

**You should use Verifily if:**

- You need to measure data quality before training, not just model quality after
- You ship models regularly and need a repeatable, auditable release process
- You want every row in your dataset scored on coherence, informativeness, complexity, safety, formatting, and uniqueness
- You need to detect contamination, drift, or quality regression between dataset versions
- You need an API server with auth, billing, teams, and async jobs for your ML platform
- You work with NL2SQL datasets and need SQL-aware leakage detection

**Verifily is not:**

- A training framework (it evaluates data, not trains models)
- A model registry (artifacts are local or API-served, not a hosted registry)
- A monitoring dashboard (it produces quality scores and decisions, not charts)

---

*Verifily is the quality layer between your data and your models.*
