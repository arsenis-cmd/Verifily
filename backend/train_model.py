"""
CLI Script to Train AI Detection Model
Run this periodically (e.g., weekly) to retrain the model on new verified data
"""

import asyncio
import argparse
from app.ml.model_trainer import model_trainer
from app.ml.training_data_collector import training_collector


async def main():
    parser = argparse.ArgumentParser(description='Train AI detection model on verified data')
    parser.add_argument('--min-examples', type=int, default=100,
                      help='Minimum number of training examples required (default: 100)')
    parser.add_argument('--epochs', type=int, default=3,
                      help='Number of training epochs (default: 3)')
    parser.add_argument('--batch-size', type=int, default=16,
                      help='Training batch size (default: 16)')
    parser.add_argument('--learning-rate', type=float, default=2e-5,
                      help='Learning rate (default: 2e-5)')
    parser.add_argument('--export-only', action='store_true',
                      help='Only export data, do not train')
    parser.add_argument('--stats', action='store_true',
                      help='Show training data statistics only')

    args = parser.parse_args()

    print("="*80)
    print("VERIFILY AI DETECTION MODEL TRAINER")
    print("="*80)
    print()

    # Show stats
    print("📊 Collecting training data statistics...")
    stats = await training_collector.get_stats()

    print(f"\nTraining Data Statistics:")
    print(f"  Total Examples: {stats['total_examples']}")
    print(f"  By Label:")
    for label, count in stats['by_label'].items():
        print(f"    - {label}: {count}")
    print(f"  Confirmed by Users: {stats['confirmed']}")
    print(f"  Already Used for Training: {stats['used_for_training']}")
    print(f"  Available for Training: {stats['available_for_training']}")
    print()

    if args.stats:
        return

    # Export data if requested
    if args.export_only:
        print("📤 Exporting training data...")
        count = await training_collector.export_for_training()
        print(f"✅ Exported {count} examples to training_data.jsonl")
        return

    # Check if we have enough data
    if stats['available_for_training'] < args.min_examples:
        print(f"❌ Not enough training data!")
        print(f"   Need: {args.min_examples}")
        print(f"   Have: {stats['available_for_training']}")
        print()
        print("💡 Collect more verifications from users before training.")
        return

    # Start training
    print(f"🚀 Starting model training...")
    print(f"   Epochs: {args.epochs}")
    print(f"   Batch Size: {args.batch_size}")
    print(f"   Learning Rate: {args.learning_rate}")
    print()

    result = await model_trainer.fine_tune(
        num_epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.learning_rate,
        min_examples=args.min_examples
    )

    if result is None:
        print("❌ Training failed!")
        return

    print()
    print("="*80)
    print("✅ TRAINING COMPLETE!")
    print("="*80)
    print()
    print(f"Model Version: {result['model_version']}")
    print(f"Model Path: {result['model_path']}")
    print()
    print("Metrics:")
    metrics = result['metrics']
    print(f"  Test Accuracy: {metrics['test_accuracy']:.4f}")
    print(f"  Test F1 Score: {metrics['test_f1']:.4f}")
    print(f"  Test Precision: {metrics['test_precision']:.4f}")
    print(f"  Test Recall: {metrics['test_recall']:.4f}")
    print()
    print("Training Examples:")
    print(f"  Total: {metrics['training_examples']}")
    print(f"  Train: {metrics['train_examples']}")
    print(f"  Val: {metrics['val_examples']}")
    print(f"  Test: {metrics['test_examples']}")
    print()
    print("🎯 To use this model, update your detector to load from:")
    print(f"   {result['model_path']}")


if __name__ == "__main__":
    asyncio.run(main())
