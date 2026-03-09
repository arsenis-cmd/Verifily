# Verifily

ML data quality gate. Ingest, validate, and ship datasets with confidence.

Verifily catches contamination, PII leaks, SQL template leakage, contract violations, and metric regressions before they reach production. It runs locally — no network, no GPU, no external services.

One command gates your CI pipeline. Exit 0 means ship.

## Install

```bash
pip install -e .
```

For integrations (HuggingFace, W&B, MLflow) and API server:

```bash
pip install -e ".[all]"
```

## 60-Second Quick Start

```bash
# 1. Scaffold a project
verifily quickstart my_project

# 2. Ingest raw data (JSONL, CSV, Parquet, or HuggingFace)
verifily ingest --in my_project/data/raw/sample.csv \
                --out my_project/data/artifact \
                --schema sft

# 3. Run the CI gate
verifily pipeline --config my_project/verifily.yaml --ci
# Exit 0 = SHIP, 1 = DONT_SHIP, 2 = INVESTIGATE
```

Or run the full demo end-to-end:

```bash
bash scripts/demo_quickstart_ci.sh
```

## What Verifily Prevents

| Risk | How Verifily catches it |
|------|------------------------|
| Train/eval data leakage | Exact-match + Jaccard contamination detection via MinHash LSH |
| SQL template leakage | Three-tier NL2SQL gate: exact SQL, template fingerprint, question near-dup |
| PII in training data | Regex-based PII scan with configurable thresholds and redaction |
| Missing or corrupt artifacts | Run contract validation (hashes, configs, eval results) |
| Metric regressions | Threshold checks against baselines with delta tracking |
| Ambiguous ship decisions | Deterministic gate: blockers always block, no silent passes |
| Dataset drift | Privacy-safe fingerprinting and diff without raw data exposure |

## Supported Schemas

8 canonical dataset types, auto-detected from field names:

| Schema | Required fields | Use case |
|--------|----------------|----------|
| `sft` | instruction, output | Supervised fine-tuning |
| `qa` | question, answer | Question answering |
| `classification` | text, label | Text classification |
| `chat` | messages | Multi-turn conversations |
| `summarization` | document, summary | Summarization tasks |
| `translation` | source, target | Translation pairs |
| `rm_pairwise` | prompt, chosen, rejected | Reward model training |
| `nl2sql` | question, sql, schema | Natural language to SQL |

## CLI Commands

| Command | Purpose |
|---------|---------|
| `verifily quickstart <path>` | Scaffold a working project |
| `verifily ingest` | Normalize raw data to artifact format (JSONL, CSV, Parquet, hf://) |
| `verifily pipeline --ci` | Run full quality gate (CI mode) |
| `verifily report` | Dataset quality report with PII scan |
| `verifily contamination` | Detect train/eval overlap |
| `verifily contract-check` | Validate run artifacts |
| `verifily fingerprint` | Privacy-safe dataset summary |
| `verifily diff-datasets` | Compare two datasets |
| `verifily ci-init` | Generate GitHub/GitLab CI config |
| `verifily serve` | Start API server |
| `verifily version` | Show version, Python, platform |

### NL2SQL Commands

| Command | Purpose |
|---------|---------|
| `verifily nl2sql validate` | Validate NL2SQL dataset structure |
| `verifily nl2sql fingerprint` | SQL normalization + template fingerprinting |
| `verifily nl2sql split` | Leakage-resistant train/eval splitting |
| `verifily nl2sql gate` | Three-tier contamination gate for NL2SQL |

## Integrations

All opt-in with lazy imports. No hard dependencies.

| Integration | What it does |
|-------------|-------------|
| **HuggingFace Datasets** | Load datasets via `hf://` URIs |
| **Weights & Biases** | Log decisions, metrics, and artifacts |
| **MLflow** | Track runs with model registry integration |
| **GitHub Actions** | Pre-built action + CI workflow generator |

```bash
# HuggingFace
verifily ingest --in "hf://squad" --out datasets/squad --schema qa

# W&B + MLflow
verifily pipeline --config pipeline.yaml --wandb --mlflow
```

## CI Exit Codes

| Code | Label | Meaning |
|------|-------|---------|
| `0` | SHIP | All quality gates passed |
| `1` | DONT_SHIP | One or more blockers failed |
| `2` | INVESTIGATE | Risk flags present, no hard blockers |
| `3` | CONTRACT_FAIL | Run contract invalid |
| `4` | TOOL_ERROR | Invalid config or unexpected error |

## Documentation

- [Product Overview](docs/product-overview.md)
- [Quick Install](docs/quick_install.md)
- [3-Minute Quickstart](docs/3_minute_quickstart.md)
- [Decision Gate](docs/decision_gate.md)
- [Dataset Fingerprints](docs/fingerprints.md)
- [CI Init](docs/ci/quick_ci_init.md)
- [API & Jobs](docs/api_jobs.md)
- [Monitor](docs/monitor.md)
- [Versioning & Stability](VERSIONING.md)
- [Changelog](CHANGELOG.md)

## Versioning

Verifily follows [Semantic Versioning](https://semver.org/). See [VERSIONING.md](VERSIONING.md).

Current version: `1.4.1`

## Stability Guarantees

- **Deterministic outputs** — fixed seed produces identical results across runs
- **Stable contracts** — `run_contract_v1` schema is frozen within the v1.x line
- **Stable exit codes** — 0/1/2/3/4 semantics are frozen
- **Backward compatibility** within MAJOR version — artifacts from any v1.x release are accepted
- **1,300+ tests** — all deterministic, no network, no GPU

## License

Business Source License 1.1 (BSL-1.1). See [LICENSE](LICENSE) for details.

You may use Verifily for any purpose except offering it as a commercial data quality or ML pipeline gating service to third parties. On 2030-02-16, the license converts to Apache 2.0.
