"""
Model Trainer - Fine-tune AI detection models on verified data
Continuously improves as more users verify content
"""

import os
import json
import torch
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional
from datasets import Dataset
from transformers import (
    RobertaTokenizer,
    RobertaForSequenceClassification,
    Trainer,
    TrainingArguments,
    EarlyStoppingCallback
)
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
import numpy as np

from app.ml.training_data_collector import training_collector


class ModelTrainer:
    """
    Fine-tunes RoBERTa model on platform-specific verified data
    """

    def __init__(self, model_dir: str = "./models"):
        self.model_dir = Path(model_dir)
        self.model_dir.mkdir(exist_ok=True, parents=True)

        # Label mapping
        self.label2id = {'human': 0, 'mixed': 1, 'ai': 2}
        self.id2label = {v: k for k, v in self.label2id.items()}

    async def prepare_dataset(self, min_examples: int = 100) -> Optional[Dict]:
        """
        Prepare training dataset from collected verifications
        Returns None if not enough data
        """
        # Get training examples
        examples = await training_collector.get_training_dataset(
            min_examples=min_examples,
            only_confirmed=True,
            balance_classes=True
        )

        if len(examples) < min_examples:
            print(f"[Trainer] Not enough data: {len(examples)}/{min_examples}")
            return None

        # Convert to format for training
        texts = [ex['content'] for ex in examples]
        labels = [self.label2id[ex['label']] for ex in examples]

        # Split into train/val/test
        train_texts, temp_texts, train_labels, temp_labels = train_test_split(
            texts, labels, test_size=0.3, random_state=42, stratify=labels
        )
        val_texts, test_texts, val_labels, test_labels = train_test_split(
            temp_texts, temp_labels, test_size=0.5, random_state=42, stratify=temp_labels
        )

        return {
            'train': {'text': train_texts, 'label': train_labels},
            'val': {'text': val_texts, 'label': val_labels},
            'test': {'text': test_texts, 'label': test_labels},
            'total_examples': len(examples)
        }

    def compute_metrics(self, eval_pred):
        """Compute metrics for evaluation"""
        predictions, labels = eval_pred
        predictions = np.argmax(predictions, axis=1)

        accuracy = accuracy_score(labels, predictions)
        precision, recall, f1, _ = precision_recall_fscore_support(
            labels, predictions, average='weighted'
        )

        return {
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1': f1
        }

    async def fine_tune(
        self,
        base_model: str = "roberta-base",
        num_epochs: int = 3,
        batch_size: int = 16,
        learning_rate: float = 2e-5,
        min_examples: int = 100
    ) -> Optional[Dict]:
        """
        Fine-tune the model on collected data

        Returns training results or None if not enough data
        """
        print(f"[Trainer] Starting fine-tuning process...")

        # Prepare dataset
        dataset_dict = await self.prepare_dataset(min_examples)
        if dataset_dict is None:
            return None

        print(f"[Trainer] Dataset prepared: {dataset_dict['total_examples']} examples")
        print(f"  Train: {len(dataset_dict['train']['text'])}")
        print(f"  Val: {len(dataset_dict['val']['text'])}")
        print(f"  Test: {len(dataset_dict['test']['text'])}")

        # Load tokenizer and model
        print(f"[Trainer] Loading base model: {base_model}")
        tokenizer = RobertaTokenizer.from_pretrained(base_model)
        model = RobertaForSequenceClassification.from_pretrained(
            base_model,
            num_labels=3,
            id2label=self.id2label,
            label2id=self.label2id
        )

        # Tokenize datasets
        def tokenize_function(examples):
            return tokenizer(
                examples['text'],
                padding='max_length',
                truncation=True,
                max_length=512
            )

        train_dataset = Dataset.from_dict(dataset_dict['train'])
        val_dataset = Dataset.from_dict(dataset_dict['val'])
        test_dataset = Dataset.from_dict(dataset_dict['test'])

        train_dataset = train_dataset.map(tokenize_function, batched=True)
        val_dataset = val_dataset.map(tokenize_function, batched=True)
        test_dataset = test_dataset.map(tokenize_function, batched=True)

        # Training arguments
        model_version = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_dir = self.model_dir / f"verifily-detector-{model_version}"

        training_args = TrainingArguments(
            output_dir=str(output_dir),
            num_train_epochs=num_epochs,
            per_device_train_batch_size=batch_size,
            per_device_eval_batch_size=batch_size,
            learning_rate=learning_rate,
            warmup_steps=100,
            weight_decay=0.01,
            logging_dir=str(output_dir / 'logs'),
            logging_steps=10,
            eval_strategy="epoch",
            save_strategy="epoch",
            load_best_model_at_end=True,
            metric_for_best_model="f1",
            greater_is_better=True,
            save_total_limit=2,
            report_to="none"  # Disable wandb/tensorboard
        )

        # Trainer
        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=train_dataset,
            eval_dataset=val_dataset,
            compute_metrics=self.compute_metrics,
            callbacks=[EarlyStoppingCallback(early_stopping_patience=2)]
        )

        # Train
        print(f"[Trainer] Starting training ({num_epochs} epochs)...")
        train_result = trainer.train()

        # Evaluate on test set
        print(f"[Trainer] Evaluating on test set...")
        test_results = trainer.evaluate(test_dataset)

        # Save model
        print(f"[Trainer] Saving model to {output_dir}")
        trainer.save_model(str(output_dir))
        tokenizer.save_pretrained(str(output_dir))

        # Save metadata
        metadata = {
            'model_version': model_version,
            'base_model': base_model,
            'training_examples': dataset_dict['total_examples'],
            'train_examples': len(dataset_dict['train']['text']),
            'val_examples': len(dataset_dict['val']['text']),
            'test_examples': len(dataset_dict['test']['text']),
            'num_epochs': num_epochs,
            'batch_size': batch_size,
            'learning_rate': learning_rate,
            'test_accuracy': test_results['eval_accuracy'],
            'test_f1': test_results['eval_f1'],
            'test_precision': test_results['eval_precision'],
            'test_recall': test_results['eval_recall'],
            'trained_at': datetime.now().isoformat()
        }

        with open(output_dir / 'metadata.json', 'w') as f:
            json.dump(metadata, f, indent=2)

        print(f"[Trainer] Training complete!")
        print(f"  Test Accuracy: {test_results['eval_accuracy']:.4f}")
        print(f"  Test F1: {test_results['eval_f1']:.4f}")
        print(f"  Model saved to: {output_dir}")

        return {
            'model_path': str(output_dir),
            'model_version': model_version,
            'metrics': metadata
        }

    def get_latest_model(self) -> Optional[Path]:
        """Get the latest trained model"""
        models = sorted(self.model_dir.glob("verifily-detector-*"))
        return models[-1] if models else None


# Global instance
model_trainer = ModelTrainer()
