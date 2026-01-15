#!/usr/bin/env python3
"""Download and cache ML models for offline use"""

import os
import logging
from transformers import AutoTokenizer, AutoModelForSequenceClassification

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def download_models(cache_dir: str = "./models"):
    """Download models for offline use"""

    os.makedirs(cache_dir, exist_ok=True)

    models_to_download = [
        "distilbert-base-uncased",  # Default lightweight model
        # Add more models as needed
    ]

    for model_name in models_to_download:
        logger.info(f"Downloading {model_name}...")

        try:
            # Download tokenizer
            logger.info("  - Downloading tokenizer...")
            tokenizer = AutoTokenizer.from_pretrained(
                model_name,
                cache_dir=cache_dir
            )

            # Download model
            logger.info("  - Downloading model...")
            model = AutoModelForSequenceClassification.from_pretrained(
                model_name,
                num_labels=2,
                cache_dir=cache_dir
            )

            logger.info(f"✓ {model_name} downloaded successfully")

        except Exception as e:
            logger.error(f"✗ Failed to download {model_name}: {e}")

    logger.info("\nModel download complete!")
    logger.info(f"Models cached in: {os.path.abspath(cache_dir)}")
    logger.info(f"Total size: ~500MB")

if __name__ == "__main__":
    download_models()
