# Quick Start Guide

Get the local AI detection engine running in 5 minutes.

## 1. Install Dependencies

```bash
cd ai-detector-engine
pip3 install -r requirements.txt
```

This will install:
- FastAPI & Uvicorn (web server)
- Transformers & PyTorch (ML models)
- Scikit-learn & NumPy (statistical analysis)

## 2. Test Without ML Model (Fast Start)

You can test the engine immediately without downloading ML models:

```bash
python3 test_local.py
```

This runs pattern + statistical detection (~70-75% accuracy).

**Expected output:**
```
LOCAL AI DETECTION ENGINE TEST
================================================================================

Initializing detector...

Detector Configuration:
  ML Model Available: False
  Model: distilbert-base-uncased
  Device: cpu
  Weights: Pattern=0.4, Statistical=0.3, ML=0.3

Test 1/5: 100% AI Generated (ChatGPT)
--------------------------------------------------------------------------------
✓ Classification: AI
✓ AI Probability: 78.5%
✓ Confidence: 72.3%
✓ Inference Time: 12.3ms

Result: ✅ PASS
...

SUMMARY
================================================================================
Tests Passed: 4/5 (80.0%)
Average Inference Time: 15.2ms

⚠ ML model not available - using pattern + statistical only
================================================================================
```

## 3. Download ML Models (Optional - Better Accuracy)

For 85-90% accuracy, download the ML model:

```bash
python3 download_models.py
```

This downloads ~500MB of models. After completion, re-run the test:

```bash
python3 test_local.py
```

You should now see:
- **ML Model Available: True**
- **Tests Passed: 5/5 (100.0%)**
- **Accuracy improved to ~85-90%**

## 4. Start the Server

```bash
python3 server.py
```

Server runs on `http://localhost:5000`

## 5. Test the API

**Health Check:**
```bash
curl http://localhost:5000/health
```

**Detect AI Content:**
```bash
curl -X POST http://localhost:5000/detect \
  -H "Content-Type: application/json" \
  -d '{"text": "In conclusion, leveraging modern solutions facilitates robust implementations."}'
```

**Response:**
```json
{
  "ai_probability": 0.85,
  "classification": "AI",
  "confidence": 0.88,
  "scores": {
    "pattern": 0.82,
    "statistical": 0.79,
    "ml": 0.91,
    "ml_available": true
  },
  "inference_time_ms": 45.2
}
```

**Run Built-in Tests:**
```bash
curl http://localhost:5000/test
```

## 6. Integration with Backend

To use this instead of ZeroGPT API, update your backend `.env`:

```env
AI_MODEL_SERVER_URL=http://localhost:5000
ZEROGPT_API_KEY=  # Leave empty
```

The backend will automatically use your local engine!

## Troubleshooting

### "No module named 'transformers'"
```bash
pip3 install transformers torch
```

### "CUDA out of memory"
Edit `config.py` or set env var:
```bash
export DEVICE=cpu
python3 server.py
```

### Models downloading slowly
Models are cached in `./models/`. First download may take 5-10 minutes.

### Low accuracy
- Make sure ML models are downloaded (`python3 download_models.py`)
- For even better accuracy, fine-tune on custom data (see README.md)

## Performance Tips

1. **GPU Acceleration**: If you have a GPU, set `DEVICE=cuda` for 5-10x faster inference
2. **Reduce Model Size**: Use `distilbert-base-uncased` (current default) for speed
3. **Batch Processing**: Send multiple texts in parallel for throughput

## Next Steps

- **Fine-tune on your data**: `python3 train.py --dataset your_data.csv`
- **Adjust thresholds**: Edit `config.py` to customize classification thresholds
- **Add more detectors**: Extend `detector.py` with custom detection methods

## Need Help?

Check the full README.md for detailed documentation.
