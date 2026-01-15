#!/usr/bin/env python3
"""
Download and prepare the HC3 dataset for training

HC3 = Human ChatGPT Comparison Corpus
Contains ~24,000 human and ChatGPT generated Q&A pairs
"""

import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def download_hc3_dataset(output_file: str = "training_data_hc3.csv", max_samples: int = None):
    """
    Download HC3 dataset and convert to training format

    Args:
        output_file: Output CSV filename
        max_samples: Limit number of samples (None = all)
    """
    try:
        from datasets import load_dataset
        import pandas as pd
    except ImportError:
        logger.error("❌ Required libraries not installed")
        logger.error("\nPlease run:")
        logger.error("  pip3 install datasets pandas")
        return False

    logger.info("="*80)
    logger.info("HC3 DATASET DOWNLOAD")
    logger.info("="*80)
    logger.info("\nDownloading HC3 dataset from Hugging Face...")
    logger.info("This may take 5-10 minutes depending on your internet speed.")
    logger.info("")

    try:
        # Load dataset
        dataset = load_dataset('Hello-SimpleAI/HC3', 'all', trust_remote_code=True)

        logger.info("✓ Dataset downloaded successfully!")
        logger.info(f"  Total entries: {len(dataset['train'])}")

        # Convert to our format
        logger.info("\nConverting to training format...")
        data = []

        for i, item in enumerate(dataset['train']):
            if max_samples and i >= max_samples // 2:
                break

            # Get human and ChatGPT answers
            human_answers = item.get('human_answers', [])
            chatgpt_answers = item.get('chatgpt_answers', [])

            # Add first human answer
            if human_answers and len(human_answers) > 0:
                text = human_answers[0]
                if text and len(text.strip()) > 20:  # Filter out very short texts
                    data.append({
                        'text': text.strip(),
                        'label': 0,  # Human
                        'source': 'hc3_human',
                        'question': item.get('question', '')[:100]  # First 100 chars
                    })

            # Add first ChatGPT answer
            if chatgpt_answers and len(chatgpt_answers) > 0:
                text = chatgpt_answers[0]
                if text and len(text.strip()) > 20:
                    data.append({
                        'text': text.strip(),
                        'label': 1,  # AI
                        'source': 'hc3_chatgpt',
                        'question': item.get('question', '')[:100]
                    })

        logger.info(f"✓ Converted {len(data)} samples")

        # Create DataFrame
        df = pd.DataFrame(data)

        # Shuffle
        df = df.sample(frac=1, random_state=42).reset_index(drop=True)

        # Balance classes if needed
        human_count = len(df[df['label'] == 0])
        ai_count = len(df[df['label'] == 1])

        if abs(human_count - ai_count) > 100:
            logger.info(f"\n⚠ Dataset imbalanced: {human_count} human, {ai_count} AI")
            logger.info("  Balancing...")

            # Keep equal numbers
            min_count = min(human_count, ai_count)
            df_human = df[df['label'] == 0].iloc[:min_count]
            df_ai = df[df['label'] == 1].iloc[:min_count]

            df = pd.concat([df_human, df_ai], ignore_index=True)
            df = df.sample(frac=1, random_state=42).reset_index(drop=True)

            logger.info(f"✓ Balanced to {len(df)} total samples")

        # Save
        df.to_csv(output_file, index=False)

        logger.info("\n" + "="*80)
        logger.info("SUCCESS!")
        logger.info("="*80)
        logger.info(f"✓ Dataset saved to: {output_file}")
        logger.info(f"✓ Total samples: {len(df)}")
        logger.info(f"✓ Human samples: {len(df[df['label'] == 0])}")
        logger.info(f"✓ AI samples: {len(df[df['label'] == 1])}")
        logger.info(f"✓ Balance ratio: {len(df[df['label'] == 0]) / len(df[df['label'] == 1]):.2f}")
        logger.info("\n" + "="*80)
        logger.info("NEXT STEPS")
        logger.info("="*80)
        logger.info(f"\n1. Preview the data:")
        logger.info(f"   python3 -c \"import pandas as pd; print(pd.read_csv('{output_file}').head(10))\"")
        logger.info(f"\n2. Start training:")
        logger.info(f"   python3 train.py --dataset {output_file} --epochs 3")
        logger.info(f"\n3. This will take ~30 minutes with {len(df)} samples")
        logger.info("="*80 + "\n")

        return True

    except Exception as e:
        logger.error(f"\n❌ Error downloading dataset: {e}")
        logger.error("\nTroubleshooting:")
        logger.error("1. Check internet connection")
        logger.error("2. Try: pip3 install --upgrade datasets")
        logger.error("3. Use sample data instead: python3 prepare_dataset.py")
        return False

def main():
    import argparse

    parser = argparse.ArgumentParser(description='Download HC3 dataset for AI detection training')
    parser.add_argument('--output', default='training_data_hc3.csv', help='Output CSV file')
    parser.add_argument('--max-samples', type=int, default=None,
                       help='Maximum number of samples (None = all, ~24k total)')

    args = parser.parse_args()

    success = download_hc3_dataset(args.output, args.max_samples)

    if not success:
        logger.error("\n❌ Download failed!")
        logger.info("\nAlternative: Use sample data to test the training process:")
        logger.info("  python3 prepare_dataset.py")
        exit(1)

if __name__ == "__main__":
    main()
