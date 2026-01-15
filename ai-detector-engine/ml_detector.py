"""Machine Learning based AI detection using transformers"""

import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from typing import Dict, Optional
import os
import logging

logger = logging.getLogger(__name__)

class MLDetector:
    def __init__(self, model_name: str = "distilbert-base-uncased",
                 cache_dir: str = "./models", device: str = "cpu"):
        """
        Initialize ML detector with transformer model

        Args:
            model_name: HuggingFace model name or path to fine-tuned model
            cache_dir: Directory to cache models
            device: 'cpu' or 'cuda'
        """
        self.device = device
        self.model_name = model_name
        self.cache_dir = cache_dir

        self.model = None
        self.tokenizer = None
        self.loaded = False

        # Try to load model, but don't fail if unavailable
        try:
            self._load_model()
        except Exception as e:
            logger.warning(f"Could not load ML model: {e}. Using fallback detection.")

    def _load_model(self):
        """Load the transformer model"""
        os.makedirs(self.cache_dir, exist_ok=True)

        logger.info(f"Loading ML model: {self.model_name}")

        # Check if we have a fine-tuned model
        finetuned_path = os.path.join(self.cache_dir, "finetuned_model")

        if os.path.exists(finetuned_path):
            logger.info("Loading fine-tuned model...")
            self.tokenizer = AutoTokenizer.from_pretrained(finetuned_path)
            self.model = AutoModelForSequenceClassification.from_pretrained(finetuned_path)
        else:
            # Use pre-trained model as baseline
            # In production, this should be fine-tuned on AI detection data
            logger.info("Loading pre-trained model (not fine-tuned for AI detection yet)...")
            self.tokenizer = AutoTokenizer.from_pretrained(
                self.model_name,
                cache_dir=self.cache_dir
            )
            # We'll use a simple classifier on top
            self.model = AutoModelForSequenceClassification.from_pretrained(
                self.model_name,
                num_labels=2,  # Binary: AI or Human
                cache_dir=self.cache_dir
            )

        self.model.to(self.device)
        self.model.eval()
        self.loaded = True

        logger.info("ML model loaded successfully")

    def detect(self, text: str) -> Dict:
        """
        Detect AI content using ML model

        Returns:
            Dict with ml_score (0-1) and confidence
        """
        if not self.loaded:
            # Fallback: return neutral score if model not available
            return {
                'ml_score': 0.5,
                'confidence': 0.0,
                'available': False,
                'reason': 'Model not loaded'
            }

        try:
            # Tokenize
            inputs = self.tokenizer(
                text,
                return_tensors="pt",
                truncation=True,
                max_length=512,
                padding=True
            )
            inputs = {k: v.to(self.device) for k, v in inputs.items()}

            # Inference
            with torch.no_grad():
                outputs = self.model(**inputs)
                logits = outputs.logits

                # Apply softmax to get probabilities
                probs = torch.softmax(logits, dim=1)

                # Get AI probability (assuming label 1 = AI)
                ai_prob = probs[0][1].item()
                confidence = max(probs[0]).item()

            return {
                'ml_score': round(ai_prob, 4),
                'confidence': round(confidence, 4),
                'available': True,
                'model': self.model_name
            }

        except Exception as e:
            logger.error(f"ML detection error: {e}")
            return {
                'ml_score': 0.5,
                'confidence': 0.0,
                'available': False,
                'error': str(e)
            }

    def fine_tune(self, train_texts: list, train_labels: list,
                  val_texts: list = None, val_labels: list = None,
                  epochs: int = 3, batch_size: int = 16):
        """
        Fine-tune the model on AI detection data

        Args:
            train_texts: List of training texts
            train_labels: List of labels (0=human, 1=AI)
            val_texts: Optional validation texts
            val_labels: Optional validation labels
            epochs: Number of training epochs
            batch_size: Batch size for training
        """
        if not self.loaded:
            raise RuntimeError("Model not loaded. Cannot fine-tune.")

        from torch.utils.data import Dataset, DataLoader
        from torch.optim import AdamW
        from tqdm import tqdm

        class TextDataset(Dataset):
            def __init__(self, texts, labels, tokenizer):
                self.texts = texts
                self.labels = labels
                self.tokenizer = tokenizer

            def __len__(self):
                return len(self.texts)

            def __getitem__(self, idx):
                encoding = self.tokenizer(
                    self.texts[idx],
                    truncation=True,
                    max_length=512,
                    padding='max_length',
                    return_tensors='pt'
                )
                return {
                    'input_ids': encoding['input_ids'].flatten(),
                    'attention_mask': encoding['attention_mask'].flatten(),
                    'labels': torch.tensor(self.labels[idx], dtype=torch.long)
                }

        # Create datasets
        train_dataset = TextDataset(train_texts, train_labels, self.tokenizer)
        train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)

        # Setup training
        optimizer = AdamW(self.model.parameters(), lr=2e-5)
        self.model.train()

        logger.info(f"Starting fine-tuning for {epochs} epochs...")

        for epoch in range(epochs):
            total_loss = 0
            progress = tqdm(train_loader, desc=f"Epoch {epoch+1}/{epochs}")

            for batch in progress:
                optimizer.zero_grad()

                input_ids = batch['input_ids'].to(self.device)
                attention_mask = batch['attention_mask'].to(self.device)
                labels = batch['labels'].to(self.device)

                outputs = self.model(
                    input_ids=input_ids,
                    attention_mask=attention_mask,
                    labels=labels
                )

                loss = outputs.loss
                total_loss += loss.item()

                loss.backward()
                optimizer.step()

                progress.set_postfix({'loss': loss.item()})

            avg_loss = total_loss / len(train_loader)
            logger.info(f"Epoch {epoch+1} average loss: {avg_loss:.4f}")

        # Save fine-tuned model
        save_path = os.path.join(self.cache_dir, "finetuned_model")
        os.makedirs(save_path, exist_ok=True)
        self.model.save_pretrained(save_path)
        self.tokenizer.save_pretrained(save_path)

        logger.info(f"Fine-tuned model saved to {save_path}")
        self.model.eval()
