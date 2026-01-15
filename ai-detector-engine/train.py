#!/usr/bin/env python3
"""Train/fine-tune the AI detection model on custom data"""

import argparse
import pandas as pd
import logging
from sklearn.model_selection import train_test_split

from ml_detector import MLDetector
from config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def load_dataset(dataset_path: str):
    """
    Load dataset from CSV

    Expected format:
    - text: column with text samples
    - label: column with labels (0=human, 1=AI)
    """
    logger.info(f"Loading dataset from {dataset_path}")

    df = pd.read_csv(dataset_path)

    if 'text' not in df.columns or 'label' not in df.columns:
        raise ValueError("Dataset must have 'text' and 'label' columns")

    texts = df['text'].tolist()
    labels = df['label'].tolist()

    logger.info(f"Loaded {len(texts)} samples")
    logger.info(f"  - Human samples: {labels.count(0)}")
    logger.info(f"  - AI samples: {labels.count(1)}")

    return texts, labels

def main():
    parser = argparse.ArgumentParser(description='Train AI detection model')
    parser.add_argument('--dataset', required=True, help='Path to training dataset (CSV)')
    parser.add_argument('--test-size', type=float, default=0.2, help='Test set size (default: 0.2)')
    parser.add_argument('--epochs', type=int, default=3, help='Number of epochs (default: 3)')
    parser.add_argument('--batch-size', type=int, default=16, help='Batch size (default: 16)')
    parser.add_argument('--device', default='cpu', help='Device: cpu or cuda (default: cpu)')

    args = parser.parse_args()

    # Load dataset
    texts, labels = load_dataset(args.dataset)

    # Split into train/val
    train_texts, val_texts, train_labels, val_labels = train_test_split(
        texts, labels, test_size=args.test_size, random_state=42, stratify=labels
    )

    logger.info(f"\nDataset split:")
    logger.info(f"  - Training: {len(train_texts)} samples")
    logger.info(f"  - Validation: {len(val_texts)} samples")

    # Initialize detector
    logger.info(f"\nInitializing model on {args.device}...")
    detector = MLDetector(
        model_name=settings.MODEL_NAME,
        cache_dir=settings.MODEL_CACHE_DIR,
        device=args.device
    )

    # Fine-tune
    logger.info(f"\nStarting fine-tuning...")
    detector.fine_tune(
        train_texts=train_texts,
        train_labels=train_labels,
        val_texts=val_texts,
        val_labels=val_labels,
        epochs=args.epochs,
        batch_size=args.batch_size
    )

    logger.info("\n✓ Training complete!")
    logger.info(f"Fine-tuned model saved to {settings.MODEL_CACHE_DIR}/finetuned_model")
    logger.info("\nTo use the fine-tuned model, restart the server.")

if __name__ == "__main__":
    main()
