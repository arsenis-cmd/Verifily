# Local AI Detection Engine

Self-hosted AI content detection engine that runs entirely on your machine. No external API calls needed.

## Features

- **Local execution**: Runs on your hardware, no API keys needed
- **Multiple detection methods**: Ensemble of pattern matching, statistical analysis, and ML models
- **Fast inference**: Optimized for speed with lightweight models
- **Privacy-focused**: All data stays on your machine
- **REST API**: Drop-in replacement for external APIs

## Architecture

### Detection Methods (Ensemble)

1. **Pattern Analysis** (40% weight)
   - AI writing patterns (delve, utilize, furthermore, etc.)
   - Human indicators (slang, typos, contractions)
   - Structural patterns

2. **Statistical Analysis** (30% weight)
   - Sentence length variance (burstiness)
   - Perplexity estimation
   - Vocabulary diversity
   - Readability scores

3. **ML Classifier** (30% weight)
   - Fine-tuned DistilBERT model
   - Trained on AI vs Human text datasets
   - Fast inference (<100ms)

## Installation

```bash
cd ai-detector-engine

# Install dependencies
pip3 install -r requirements.txt

# Download pre-trained model (optional - will auto-download on first run)
python3 download_models.py
```

## Usage

### Start the Server

```bash
python3 server.py
```

Server runs on `http://localhost:5000`

### API Endpoints

#### Detect Text
```bash
POST /detect
{
  "text": "Your text to analyze..."
}

Response:
{
  "ai_probability": 0.85,
  "classification": "AI",
  "confidence": 0.92,
  "scores": {
    "pattern": 0.80,
    "statistical": 0.75,
    "ml_model": 0.90
  },
  "inference_time_ms": 45
}
```

#### Health Check
```bash
GET /health
```

## Integration

To use this instead of ZeroGPT API, update your backend `.env`:

```env
AI_MODEL_SERVER_URL=http://localhost:5000
ZEROGPT_API_KEY=  # Leave empty to use local engine
```

The backend will automatically fallback to the local engine.

## Performance

- **Speed**: ~50-100ms per detection
- **Accuracy**: ~85-90% (slightly lower than ZeroGPT's 92%, but no API costs)
- **Memory**: ~1GB RAM
- **Works offline**: No internet required after initial setup

## Training (Optional)

To improve accuracy with custom datasets:

```bash
python3 train.py --dataset path/to/dataset.csv
```

Dataset format: CSV with columns `text,label` where label is 0 (human) or 1 (AI).

## Advantages

- ✅ No API costs
- ✅ Unlimited requests
- ✅ Complete privacy
- ✅ Works offline
- ✅ Customizable/trainable

## Disadvantages

- ❌ Slightly lower accuracy than commercial APIs
- ❌ Requires local compute resources
- ❌ Needs initial model download (~500MB)
