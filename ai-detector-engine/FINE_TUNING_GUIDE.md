# Complete Fine-Tuning Guide for AI Detection

This guide walks you through creating a production-ready AI detection model from scratch.

## 🎯 Overview

**What you'll do:**
1. Prepare training data (AI vs Human text samples)
2. Train the model on your data
3. Test the accuracy
4. Deploy the fine-tuned model

**Time required:** 2-4 hours (depending on dataset size and hardware)

**Hardware:** Works on any computer (faster with GPU)

---

## 📚 STEP 1: Prepare Your Dataset

### Option A: Use Sample Data (Quick Test - 5 minutes)

Perfect for testing the process:

```bash
cd /Users/arsenispapachristos/Desktop/SDK_PoC/poc-mvp/ai-detector-engine

# Create sample dataset
python3 prepare_dataset.py
```

This creates `training_data_sample.csv` with 30 examples (15 AI + 15 Human).

**Output:**
```
✓ Sample dataset created: training_data_sample.csv
  Total samples: 30
  AI samples: 15
  Human samples: 15

Note: This is a SMALL sample dataset for testing only!
For production, you need 5,000-10,000+ samples.
```

### Option B: Download Real Dataset (Production - 30 minutes)

For production-quality results, use a large dataset:

```bash
# Install dataset library
pip3 install datasets

# Download HC3 dataset (24,000 samples)
python3 -c "
from datasets import load_dataset
import pandas as pd

# Load dataset
dataset = load_dataset('Hello-SimpleAI/HC3', 'all')

# Convert to simple format
data = []
for item in dataset['train']:
    # Human answer
    data.append({'text': item['human_answers'][0], 'label': 0})
    # ChatGPT answer
    data.append({'text': item['chatgpt_answers'][0], 'label': 1})

# Save as CSV
df = pd.DataFrame(data)
df = df.sample(frac=1, random_state=42)  # Shuffle
df.to_csv('training_data_hc3.csv', index=False)

print(f'✓ Created training_data_hc3.csv with {len(df)} samples')
"
```

### Option C: Create Your Own Dataset (Best - Variable time)

Most accurate for your specific use case:

**Format:** Create a CSV file with two columns:
```csv
text,label
"lol this is so cool omg 😍",0
"In conclusion, leveraging modern solutions facilitates robust implementations.",1
"can't believe this worked first try lmao",0
"It is important to note that comprehensive approaches enable optimal outcomes.",1
```

- **label = 0** means HUMAN
- **label = 1** means AI

**Tips for collecting data:**

1. **AI samples:** Use ChatGPT/Claude to generate text
   ```
   Prompt: "Write 100 formal blog posts about technology in 2-3 paragraphs each"
   ```

2. **Human samples:**
   - Scrape Reddit comments
   - Twitter/X posts
   - Your own platform's content
   - Stack Overflow answers

3. **Balance:** Keep 50/50 ratio (equal AI and Human samples)

4. **Diversity:** Include different:
   - Topics (tech, news, casual chat, formal writing)
   - Lengths (short tweets, long articles)
   - Styles (formal, casual, technical)

**Minimum recommended sizes:**
- Testing: 1,000 samples (500 AI + 500 Human)
- MVP: 5,000 samples
- Production: 10,000+ samples

---

## 🔧 STEP 2: Train the Model

Once you have your dataset, training is simple:

### Basic Training (Default Settings)

```bash
python3 train.py --dataset training_data_sample.csv --epochs 3
```

**What happens:**
1. Model loads (DistilBERT - ~250MB)
2. Data splits into train/validation (80/20)
3. Trains for 3 epochs (~5-15 minutes depending on data size)
4. Saves fine-tuned model to `models/finetuned_model/`

**Expected output:**
```
Loading dataset from training_data_sample.csv
Loaded 30 samples
  - Human samples: 15
  - AI samples: 15

Dataset split:
  - Training: 24 samples
  - Validation: 6 samples

Initializing model on cpu...
Loading pre-trained model (not fine-tuned for AI detection yet)...
ML model loaded successfully

Starting fine-tuning...
Epoch 1/3: 100%|████████████| 2/2 [00:05<00:00,  2.50s/it, loss=0.6234]
Epoch 1 average loss: 0.6234

Epoch 2/3: 100%|████████████| 2/2 [00:04<00:00,  2.20s/it, loss=0.3421]
Epoch 2 average loss: 0.3421

Epoch 3/3: 100%|████████████| 2/2 [00:04<00:00,  2.10s/it, loss=0.1523]
Epoch 3 average loss: 0.1523

✓ Training complete!
Fine-tuned model saved to models/finetuned_model

To use the fine-tuned model, restart the server.
```

### Advanced Training Options

```bash
# Train with more epochs for better accuracy
python3 train.py --dataset your_data.csv --epochs 5

# Use smaller batch size if running out of memory
python3 train.py --dataset your_data.csv --batch-size 8

# Use GPU for faster training (if available)
python3 train.py --dataset your_data.csv --device cuda

# Custom validation split
python3 train.py --dataset your_data.csv --test-size 0.3  # 30% validation
```

### Understanding Training Loss

The loss value shows how well the model is learning:

| Loss Value | Meaning | Action |
|-----------|---------|--------|
| > 0.5 | Still learning | Continue training (more epochs) |
| 0.2-0.5 | Good progress | Almost done |
| 0.1-0.2 | Excellent | Model is well-trained |
| < 0.1 | Perfect | Might be overfitting (too specific) |

**Tip:** Loss should decrease each epoch. If it stays the same or increases, something's wrong.

---

## 🧪 STEP 3: Test the Fine-Tuned Model

After training, test the accuracy:

```bash
python3 test_local.py
```

**Look for these improvements:**

| Metric | Before Training | After Training | Goal |
|--------|----------------|----------------|------|
| Accuracy | 75% | 85-95% | > 85% |
| ML Model Available | False | True | True |
| Tests Passed | 3/5 | 5/5 | All pass |
| Inference Time | 15ms | 50ms | < 100ms |

**Sample output:**
```
LOCAL AI DETECTION ENGINE TEST
================================================================================

Detector Configuration:
  ML Model Available: True ✓
  Model: distilbert-base-uncased
  Device: cpu

Test 1/5: 100% AI Generated (ChatGPT)
✓ Classification: AI
✓ AI Probability: 92.3% ✓
✓ Confidence: 89.1%
Result: ✅ PASS

...

SUMMARY
Tests Passed: 5/5 (100.0%) ✓
Average Inference Time: 48.3ms

✓ ML model is loaded and active
```

---

## 🚀 STEP 4: Deploy the Model

### Start the Server with Fine-Tuned Model

```bash
python3 server.py
```

The server automatically uses your fine-tuned model if available.

### Test the API

```bash
# Test endpoint
curl -X POST http://localhost:5000/detect \
  -H "Content-Type: application/json" \
  -d '{
    "text": "In conclusion, leveraging robust solutions facilitates comprehensive implementations."
  }'
```

**Expected response:**
```json
{
  "ai_probability": 0.91,
  "classification": "AI",
  "confidence": 0.88,
  "scores": {
    "pattern": 0.82,
    "statistical": 0.79,
    "ml": 0.96,
    "ml_available": true
  },
  "inference_time_ms": 47.2
}
```

---

## 🎓 Improving Model Accuracy

If your model isn't accurate enough (< 85%), try these:

### 1. Get More Data (Most Important!)

```bash
# More samples = better accuracy
1,000 samples → ~75% accuracy
5,000 samples → ~85% accuracy
10,000 samples → ~90% accuracy
50,000 samples → ~95% accuracy
```

### 2. Train Longer

```bash
# More epochs (but watch for overfitting)
python3 train.py --dataset your_data.csv --epochs 5
```

### 3. Use Better Data

**Good data:**
- Diverse topics and styles
- Natural, realistic samples
- Balanced (50/50 AI/Human)
- Representative of what you'll detect

**Bad data:**
- All same topic/style
- Artificial or synthetic
- Imbalanced (80% AI, 20% Human)
- Not representative of real use

### 4. Adjust Batch Size

```bash
# Larger batch = more stable learning
python3 train.py --dataset your_data.csv --batch-size 32
```

### 5. Use GPU (If Available)

```bash
# 5-10x faster training
python3 train.py --dataset your_data.csv --device cuda
```

---

## 📊 Model Performance Checklist

Before deploying to production, verify:

- [ ] Accuracy > 85% on test data
- [ ] ML model loads successfully
- [ ] Inference time < 100ms
- [ ] Balanced dataset used (50/50)
- [ ] Tested on diverse text samples
- [ ] False positive rate < 15%
- [ ] False negative rate < 15%

---

## 🔄 Iterative Improvement Process

```
1. Collect initial dataset (1,000 samples)
   ↓
2. Train model (3 epochs)
   ↓
3. Test accuracy → If < 85%, continue
   ↓
4. Analyze errors (which texts are misclassified?)
   ↓
5. Add more samples of those error types
   ↓
6. Retrain with larger dataset
   ↓
7. Repeat until accuracy > 85%
```

---

## 🆘 Troubleshooting

### "RuntimeError: CUDA out of memory"
```bash
# Use CPU instead
python3 train.py --dataset your_data.csv --device cpu

# Or reduce batch size
python3 train.py --dataset your_data.csv --batch-size 8 --device cuda
```

### "Accuracy stuck at ~50%"
- **Cause:** Model isn't learning (too simple or broken data)
- **Fix:** Check your dataset labels are correct (0=human, 1=AI)

### "Model predicts everything as AI (or Human)"
- **Cause:** Imbalanced dataset
- **Fix:** Ensure 50/50 balance in training data

### "Training takes forever"
- **Cause:** Large dataset or slow hardware
- **Fix:** Use GPU (`--device cuda`) or reduce dataset size for testing

### "Model works in testing but not in production"
- **Cause:** Training data doesn't match real data
- **Fix:** Collect real examples from your users and retrain

---

## 💡 Quick Reference

```bash
# 1. Prepare data
python3 prepare_dataset.py

# 2. Train model
python3 train.py --dataset training_data_sample.csv --epochs 3

# 3. Test accuracy
python3 test_local.py

# 4. Start server
python3 server.py

# 5. Test API
curl -X POST http://localhost:5000/test
```

---

## 📞 Need Help?

Check these if stuck:
1. Run `python3 test_local.py` to diagnose issues
2. Check `models/finetuned_model/` exists after training
3. Verify dataset format: `python3 -c "import pandas as pd; print(pd.read_csv('your_data.csv').head())"`
4. See full logs: Training shows progress bars and loss values

**Common issue:** Model not found → Run `python3 train.py` first!
