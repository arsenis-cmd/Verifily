"""
Pre-train AI Detection Model on Public Datasets
Uses RAID + HC3 datasets for robust multi-model detection

Run this ONCE to bootstrap the model before collecting user verifications
"""

import asyncio
import argparse
import torch
from pathlib import Path
from datasets import load_dataset, concatenate_datasets
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
from datetime import datetime


class PublicDatasetTrainer:
    """
    Pre-trains model on large public datasets before fine-tuning on user data
    """

    def __init__(self, model_dir: str = "./models"):
        self.model_dir = Path(model_dir)
        self.model_dir.mkdir(exist_ok=True, parents=True)

        # Label mapping
        self.label2id = {'human': 0, 'ai': 1}
        self.id2label = {v: k for k, v in self.label2id.items()}

    def load_raid_dataset(self, max_samples: int = 100000):
        """
        Load RAID dataset - the gold standard for adversarial AI detection
        10M+ documents with adversarial attacks
        """
        print("[RAID] Loading dataset...")
        try:
            # Load RAID from Hugging Face
            raid = load_dataset("liamdugan/raid", split="train", streaming=True)

            samples = []
            for i, example in enumerate(raid):
                if i >= max_samples:
                    break

                # RAID format: {text, label, model, domain, attack}
                # label: 0=human, 1=AI
                text = example.get('text', '')
                label = example.get('label', 0)

                if text and len(text) > 50:  # Filter short texts
                    samples.append({
                        'text': text,
                        'label': label,
                        'source': 'raid'
                    })

                if i % 10000 == 0:
                    print(f"[RAID] Loaded {i} samples...")

            print(f"[RAID] Total samples: {len(samples)}")
            return samples

        except Exception as e:
            print(f"[RAID] Error loading: {e}")
            return []

    def load_hc3_dataset(self, max_samples: int = 50000):
        """
        Load HC3 dataset - Human vs ChatGPT comparisons
        """
        print("[HC3] Loading dataset...")
        try:
            # Load HC3 from Hugging Face
            hc3 = load_dataset("Hello-SimpleAI/HC3", split="train")

            samples = []
            for i, example in enumerate(hc3):
                if i >= max_samples:
                    break

                # HC3 format: {question, human_answers, chatgpt_answers}
                question = example.get('question', '')

                # Add human answers (label=0)
                human_answers = example.get('human_answers', [])
                for answer in human_answers[:2]:  # Max 2 per question
                    text = f"{question} {answer}"
                    if len(text) > 50:
                        samples.append({
                            'text': text,
                            'label': 0,
                            'source': 'hc3_human'
                        })

                # Add ChatGPT answers (label=1)
                chatgpt_answers = example.get('chatgpt_answers', [])
                for answer in chatgpt_answers[:2]:  # Max 2 per question
                    text = f"{question} {answer}"
                    if len(text) > 50:
                        samples.append({
                            'text': text,
                            'label': 1,
                            'source': 'hc3_chatgpt'
                        })

                if i % 5000 == 0:
                    print(f"[HC3] Processed {i} examples...")

            print(f"[HC3] Total samples: {len(samples)}")
            return samples

        except Exception as e:
            print(f"[HC3] Error loading: {e}")
            return []

    def load_ai_detection_pile(self, max_samples: int = 50000):
        """
        Load AI Text Detection Pile - GPT2/3/ChatGPT/GPTJ
        """
        print("[AI-Pile] Loading dataset...")
        try:
            pile = load_dataset("artem9k/ai-text-detection-pile", split="train", streaming=True)

            samples = []
            for i, example in enumerate(pile):
                if i >= max_samples:
                    break

                text = example.get('text', '')
                label = 1 if example.get('label') == 'generated' else 0

                if text and len(text) > 50:
                    samples.append({
                        'text': text,
                        'label': label,
                        'source': 'ai_pile'
                    })

                if i % 10000 == 0:
                    print(f"[AI-Pile] Loaded {i} samples...")

            print(f"[AI-Pile] Total samples: {len(samples)}")
            return samples

        except Exception as e:
            print(f"[AI-Pile] Error loading: {e}")
            return []

    def prepare_combined_dataset(self, max_raid: int = 100000, max_hc3: int = 50000, max_pile: int = 50000):
        """
        Combine all public datasets
        """
        print("="*80)
        print("LOADING PUBLIC DATASETS")
        print("="*80)
        print()

        all_samples = []

        # Load RAID (priority - has adversarial attacks)
        raid_samples = self.load_raid_dataset(max_raid)
        all_samples.extend(raid_samples)
        print()

        # Load HC3
        hc3_samples = self.load_hc3_dataset(max_hc3)
        all_samples.extend(hc3_samples)
        print()

        # Load AI Detection Pile
        pile_samples = self.load_ai_detection_pile(max_pile)
        all_samples.extend(pile_samples)
        print()

        print(f"TOTAL COMBINED SAMPLES: {len(all_samples)}")

        # Balance classes
        human_samples = [s for s in all_samples if s['label'] == 0]
        ai_samples = [s for s in all_samples if s['label'] == 1]

        print(f"  Human: {len(human_samples)}")
        print(f"  AI: {len(ai_samples)}")

        # Balance to equal sizes
        min_size = min(len(human_samples), len(ai_samples))
        import random
        random.shuffle(human_samples)
        random.shuffle(ai_samples)

        balanced_samples = human_samples[:min_size] + ai_samples[:min_size]
        random.shuffle(balanced_samples)

        print(f"  Balanced: {len(balanced_samples)} ({min_size} each)")
        print()

        # Split train/val/test
        texts = [s['text'] for s in balanced_samples]
        labels = [s['label'] for s in balanced_samples]

        train_texts, temp_texts, train_labels, temp_labels = train_test_split(
            texts, labels, test_size=0.2, random_state=42, stratify=labels
        )
        val_texts, test_texts, val_labels, test_labels = train_test_split(
            temp_texts, temp_labels, test_size=0.5, random_state=42, stratify=temp_labels
        )

        print(f"Dataset Split:")
        print(f"  Train: {len(train_texts)}")
        print(f"  Val: {len(val_texts)}")
        print(f"  Test: {len(test_texts)}")
        print()

        return {
            'train': {'text': train_texts, 'label': train_labels},
            'val': {'text': val_texts, 'label': val_labels},
            'test': {'text': test_texts, 'label': test_labels}
        }

    def compute_metrics(self, eval_pred):
        """Compute evaluation metrics"""
        predictions, labels = eval_pred
        predictions = np.argmax(predictions, axis=1)

        accuracy = accuracy_score(labels, predictions)
        precision, recall, f1, _ = precision_recall_fscore_support(
            labels, predictions, average='binary'
        )

        return {
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1': f1
        }

    def train(
        self,
        base_model: str = "FacebookAI/roberta-base",
        num_epochs: int = 3,
        batch_size: int = 16,
        learning_rate: float = 2e-5,
        max_raid: int = 100000,
        max_hc3: int = 50000,
        max_pile: int = 50000
    ):
        """
        Pre-train model on public datasets
        """
        print("="*80)
        print("VERIFILY PRE-TRAINING - PUBLIC DATASETS")
        print("="*80)
        print()

        # Load and combine datasets
        dataset_dict = self.prepare_combined_dataset(max_raid, max_hc3, max_pile)

        # Load tokenizer and model
        print(f"Loading base model: {base_model}")
        tokenizer = RobertaTokenizer.from_pretrained(base_model)
        model = RobertaForSequenceClassification.from_pretrained(
            base_model,
            num_labels=2,
            id2label=self.id2label,
            label2id=self.label2id
        )
        print()

        # Tokenize
        from datasets import Dataset

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

        print("Tokenizing datasets...")
        train_dataset = train_dataset.map(tokenize_function, batched=True)
        val_dataset = val_dataset.map(tokenize_function, batched=True)
        test_dataset = test_dataset.map(tokenize_function, batched=True)
        print()

        # Training setup
        model_version = f"verifily-pretrained-{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        output_dir = self.model_dir / model_version

        training_args = TrainingArguments(
            output_dir=str(output_dir),
            num_train_epochs=num_epochs,
            per_device_train_batch_size=batch_size,
            per_device_eval_batch_size=batch_size,
            learning_rate=learning_rate,
            warmup_steps=500,
            weight_decay=0.01,
            logging_dir=str(output_dir / 'logs'),
            logging_steps=500,
            eval_strategy="steps",
            eval_steps=2000,
            save_strategy="steps",
            save_steps=2000,
            load_best_model_at_end=True,
            metric_for_best_model="f1",
            greater_is_better=True,
            save_total_limit=3,
            report_to="none"
        )

        # Train
        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=train_dataset,
            eval_dataset=val_dataset,
            compute_metrics=self.compute_metrics,
            callbacks=[EarlyStoppingCallback(early_stopping_patience=3)]
        )

        print("="*80)
        print("STARTING TRAINING")
        print("="*80)
        print()
        trainer.train()

        # Evaluate on test set
        print()
        print("="*80)
        print("EVALUATING ON TEST SET")
        print("="*80)
        print()
        test_results = trainer.evaluate(test_dataset)

        # Save model
        print()
        print(f"Saving model to {output_dir}")
        trainer.save_model(str(output_dir))
        tokenizer.save_pretrained(str(output_dir))

        # Save metadata
        import json
        metadata = {
            'model_version': model_version,
            'base_model': base_model,
            'training_type': 'public_datasets_pretrain',
            'datasets': {
                'raid': max_raid,
                'hc3': max_hc3,
                'ai_pile': max_pile
            },
            'total_examples': len(dataset_dict['train']['text']) + len(dataset_dict['val']['text']) + len(dataset_dict['test']['text']),
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

        print()
        print("="*80)
        print("✅ PRE-TRAINING COMPLETE!")
        print("="*80)
        print()
        print(f"Model Version: {model_version}")
        print(f"Model Path: {output_dir}")
        print()
        print("Test Metrics:")
        print(f"  Accuracy: {test_results['eval_accuracy']:.4f}")
        print(f"  F1 Score: {test_results['eval_f1']:.4f}")
        print(f"  Precision: {test_results['eval_precision']:.4f}")
        print(f"  Recall: {test_results['eval_recall']:.4f}")
        print()
        print("Next Steps:")
        print("1. Update advanced_detector.py to use this model")
        print("2. Collect user verifications through dashboard")
        print("3. Fine-tune on your verified data: python train_model.py")
        print()

        return {
            'model_path': str(output_dir),
            'model_version': model_version,
            'metrics': metadata
        }


def main():
    parser = argparse.ArgumentParser(description='Pre-train on public AI detection datasets')
    parser.add_argument('--epochs', type=int, default=3,
                      help='Number of training epochs (default: 3)')
    parser.add_argument('--batch-size', type=int, default=16,
                      help='Training batch size (default: 16)')
    parser.add_argument('--learning-rate', type=float, default=2e-5,
                      help='Learning rate (default: 2e-5)')
    parser.add_argument('--max-raid', type=int, default=100000,
                      help='Max RAID samples (default: 100k)')
    parser.add_argument('--max-hc3', type=int, default=50000,
                      help='Max HC3 samples (default: 50k)')
    parser.add_argument('--max-pile', type=int, default=50000,
                      help='Max AI-Pile samples (default: 50k)')

    args = parser.parse_args()

    trainer = PublicDatasetTrainer()
    trainer.train(
        num_epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.learning_rate,
        max_raid=args.max_raid,
        max_hc3=args.max_hc3,
        max_pile=args.max_pile
    )


if __name__ == "__main__":
    main()
