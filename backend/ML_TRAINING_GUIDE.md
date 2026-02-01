# Verifily ML Training Guide

## Overview

Verifily's AI detection gets **better over time** through continuous learning from user verifications. This is your **competitive advantage** - the more users verify content, the more accurate the system becomes!

## How It Works

### 1. Automatic Data Collection

Every time a user verifies content through the dashboard (`/api/v1/verify/human`):
- Content is automatically stored as a training example
- Label: `human` (user-confirmed)
- Metadata: platform, username, confidence scores
- Status: Ready for training

**No manual work required** - the system collects training data automatically!

### 2. Training the Model

Once you have 100+ verified examples, you can retrain the model:

```bash
# Check training data stats
python train_model.py --stats

# Train with default settings (3 epochs, batch size 16)
python train_model.py

# Custom training
python train_model.py --epochs 5 --batch-size 32 --learning-rate 1e-5

# Export data only (for inspection)
python train_model.py --export-only
```

### 3. Model Improvement Cycle

```
Users Verify Content → Training Data Collected → Model Retrained → Better Detection → More Accurate Verifications → Loop!
```

## API Endpoints

### Check Training Data Stats
```bash
curl https://verifily-production.up.railway.app/api/v1/ml/training-data/stats
```

Response:
```json
{
  "success": true,
  "stats": {
    "total_examples": 250,
    "by_label": {
      "human": 200,
      "ai": 30,
      "mixed": 20
    },
    "confirmed": 250,
    "used_for_training": 100,
    "available_for_training": 150
  },
  "ready_for_training": true
}
```

### Trigger Model Training
```bash
curl -X POST https://verifily-production.up.railway.app/api/v1/ml/train \
  -H "Content-Type: application/json" \
  -d '{"min_examples": 100, "num_epochs": 3}'
```

### List Trained Models
```bash
curl https://verifily-production.up.railway.app/api/v1/ml/models
```

### Export Training Data
```bash
curl -X POST https://verifily-production.up.railway.app/api/v1/ml/export-data \
  -H "Content-Type: application/json" \
  -d '{"output_path": "training_data.jsonl"}'
```

## Training Schedule

**Recommended:**
- **Weekly retraining** once you have 100+ new examples
- **Monthly retraining** with full dataset for major improvements

**Automated (future):**
```bash
# Add to cron (weekly on Sunday at 2 AM)
0 2 * * 0 cd /app && python train_model.py --epochs 3
```

## Model Performance Tracking

After training, check metrics:
- **Test Accuracy**: Should be > 0.85 (85%+)
- **Test F1 Score**: Should be > 0.80 (80%+)
- **Precision/Recall**: Balanced for both classes

Example output:
```
✅ TRAINING COMPLETE!

Model Version: 20260201_153000
Model Path: ./models/verifily-detector-20260201_153000

Metrics:
  Test Accuracy: 0.9250
  Test F1 Score: 0.9180
  Test Precision: 0.9200
  Test Recall: 0.9160

Training Examples:
  Total: 250
  Train: 175
  Val: 37
  Test: 38
```

## Network Effect Benefits

### Phase 1: Bootstrap (0-100 verifications)
- Use pre-trained RoBERTa
- Accuracy: ~70-75%
- Collect training data

### Phase 2: Initial Training (100-500 verifications)
- First custom model
- Accuracy: ~80-85%
- Learning platform-specific patterns

### Phase 3: Mature Model (500-1000+ verifications)
- Highly accurate custom model
- Accuracy: ~90-95%
- Better than Turnitin (85-90%)

### Phase 4: Competitive Moat (1000+ verifications)
- Continuously improving
- Accuracy: 95%+
- **Nobody can replicate your data**

## Advanced: Model Versioning

Models are saved with timestamps:
```
./models/
  verifily-detector-20260201_153000/
    - pytorch_model.bin (model weights)
    - config.json (model config)
    - tokenizer files
    - metadata.json (training metrics)
```

To use a specific model in production:
1. Update `advanced_detector.py` to load from custom path
2. Or set environment variable: `CUSTOM_MODEL_PATH=./models/verifily-detector-VERSION`

## Troubleshooting

### Not Enough Data
```
❌ Not enough training data!
   Need: 100
   Have: 45
```
**Solution**: Wait for more dashboard verifications. Promote the dashboard!

### Low Accuracy
```
Test Accuracy: 0.6500 (65%)
```
**Solutions**:
- Need more training data (aim for 200+)
- Increase epochs: `--epochs 5`
- Check class balance (should be roughly equal)

### Class Imbalance
```
By Label:
  - human: 180
  - ai: 10
  - mixed: 10
```
**Solution**: The system auto-balances, but try to collect diverse examples. Consider manually adding AI-generated examples for testing.

## Best Practices

1. **Quality > Quantity**: User-verified content is gold standard data
2. **Diverse Examples**: Collect from multiple platforms and content types
3. **Regular Retraining**: Don't wait too long - retrain monthly
4. **Monitor Metrics**: Track accuracy trends over time
5. **A/B Testing**: Keep old model while testing new one

## Security Notes

- Training data contains user content - handle with care
- Training database: `training_data.db`
- Encrypt in production
- GDPR: Allow users to request data deletion

## Future Enhancements

- [ ] Active learning (request labels for uncertain predictions)
- [ ] Multi-model ensemble (combine multiple fine-tuned models)
- [ ] Per-platform models (Twitter vs LinkedIn vs Blog)
- [ ] Automated retraining pipeline
- [ ] Model performance dashboard

---

**Remember**: Your ML system is a **competitive moat**. The more users you have, the better your detection becomes, and the harder it is for competitors to catch up!
