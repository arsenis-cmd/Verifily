#!/usr/bin/env python3
"""
Download and prepare AI detection training datasets from public sources
"""

import pandas as pd
import requests
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def download_hc3_dataset():
    """
    Download HC3 dataset (Human ChatGPT Comparison Corpus)
    This is a well-known dataset for AI detection

    Contains ~24,000 human-written and ChatGPT-generated Q&A pairs
    """
    logger.info("Downloading HC3 dataset...")

    # This is a simplified version - in production you'd use the full dataset
    # Full dataset: https://huggingface.co/datasets/Hello-SimpleAI/HC3

    logger.info("Note: For full dataset, run:")
    logger.info("  pip install datasets")
    logger.info("  Then use: datasets.load_dataset('Hello-SimpleAI/HC3')")

    return None

def create_sample_dataset(output_path: str = "training_data.csv"):
    """
    Create a sample dataset for demonstration
    In production, replace this with real data
    """
    logger.info("Creating sample training dataset...")

    # Sample AI-generated texts (from various AI models)
    ai_texts = [
        # ChatGPT style
        "In conclusion, leveraging modern cloud infrastructure can facilitate robust and comprehensive solutions. It is important to note that utilizing best practices will delve into the core aspects of scalability. Furthermore, implementing these methodologies ensures optimal performance.",

        "The integration of artificial intelligence in healthcare represents a significant advancement. It is worth noting that machine learning algorithms can process vast amounts of medical data efficiently. Moreover, this technology facilitates early disease detection and personalized treatment plans.",

        "To summarize, blockchain technology offers a decentralized approach to data management. It is crucial to understand that this innovation provides enhanced security and transparency. Additionally, smart contracts enable automated execution of agreements without intermediaries.",

        # More AI patterns
        "It is essential to recognize that sustainable development requires a multifaceted approach. Furthermore, implementing renewable energy solutions can significantly reduce carbon emissions. Moreover, these initiatives contribute to long-term environmental preservation.",

        "The evolution of remote work has fundamentally transformed corporate culture. It is important to acknowledge that digital collaboration tools have facilitated seamless communication. Additionally, this shift has enabled organizations to access global talent pools.",

        "Artificial intelligence continues to revolutionize various industries through automation and optimization. It is worth mentioning that machine learning algorithms can identify patterns in complex datasets. Furthermore, this technology enables predictive analytics and informed decision-making.",

        "To effectively address climate change, it is crucial to implement comprehensive policy frameworks. Moreover, international cooperation plays a vital role in achieving sustainability goals. Additionally, innovative technologies can facilitate the transition to clean energy.",

        "The digital transformation of education has created unprecedented opportunities for learners worldwide. It is important to note that online platforms provide accessible and flexible learning experiences. Furthermore, adaptive learning technologies can personalize educational content.",

        "In the realm of cybersecurity, it is essential to adopt a proactive approach to threat detection. Moreover, implementing multi-layered security protocols can significantly enhance data protection. Additionally, regular security audits ensure compliance with industry standards.",

        "The advancement of quantum computing represents a paradigm shift in computational capabilities. It is worth noting that quantum algorithms can solve complex problems exponentially faster. Furthermore, this technology has potential applications in cryptography and drug discovery.",

        # Add more variations
        "It is imperative to understand that effective communication is fundamental to organizational success. Moreover, transparent leadership fosters trust and employee engagement. Additionally, open dialogue encourages innovation and collaborative problem-solving.",

        "The integration of Internet of Things devices has revolutionized smart home technology. It is crucial to recognize that connected devices provide enhanced convenience and energy efficiency. Furthermore, automated systems can optimize resource consumption.",

        "To achieve sustainable economic growth, it is important to balance innovation with social responsibility. Moreover, inclusive policies can ensure equitable distribution of resources. Additionally, long-term planning facilitates resilience against market fluctuations.",

        "The emergence of personalized medicine represents a significant breakthrough in healthcare delivery. It is worth mentioning that genetic profiling enables targeted therapeutic interventions. Furthermore, precision medicine approaches can improve treatment outcomes.",

        "In the context of urban planning, it is essential to prioritize sustainable infrastructure development. Moreover, green spaces contribute to improved quality of life for residents. Additionally, efficient public transportation systems can reduce environmental impact.",
    ]

    # Sample human-written texts (casual, natural, with imperfections)
    human_texts = [
        "lol honestly i can't believe how much time i spent debugging this. turns out it was just a typo in the config file smh 🤦 gonna take a break and grab some coffee",

        "anyone else think the new update is kinda weird? like they changed the UI for no reason and now everything takes longer to find. not a fan tbh",

        "just finished this project and i'm pretty proud of it! had some rough moments where nothing worked but we got there in the end. shoutout to my team for putting up with my stress lol",

        "so i've been learning react hooks and honestly it's pretty cool. useState makes way more sense than class components ever did. still figuring out useEffect tho, that one's tricky",

        "does anyone know how to fix this weird bug where the api randomly returns null?? been stuck on this for hours and google isn't helping. might just cry and start over 😭",

        "ok so hear me out - what if we just rewrote the entire thing in rust? yeah i know it sounds crazy but the performance gains would be insane. plus i wanna learn rust anyway lol",

        "this meeting could've been an email tbh. spent 2 hours discussing something we could've decided in 5 minutes via slack. corporate life is wild sometimes",

        "protip: always read the error message carefully before panicking. just wasted 30 mins only to realize i forgot to npm install. rookie mistake but we've all been there right?",

        "why is documentation always either way too detailed or completely useless?? like give me the middle ground pls. just tell me how to use the damn function",

        "finally got the tests passing after 3 days of hell. feels good man. now i'm gonna push to prod and hope nothing breaks lmao wish me luck",

        # More natural human writing
        "idk why everyone hates on php so much. yeah it's got issues but it gets the job done and there's tons of resources. probably just trendy to hate on it at this point",

        "watching tutorial videos at 2x speed is a game changer ngl. saves so much time and you still catch everything important. highly recommend",

        "my code works and i have no idea why. changed one line randomly and suddenly everything compiled. not gonna question it, just gonna move on before it breaks again",

        "hot take: commenting your code is overrated if you write clean code. like if you need comments to explain what it does, maybe the code isn't clean enough? idk just my opinion",

        "spent all morning trying to fix a bug that turned out to be caused by caching. cleared the cache and boom, working perfectly. why is it always the simple stuff lol",
    ]

    # Create balanced dataset
    data = []

    # Add AI samples (label = 1)
    for text in ai_texts:
        data.append({
            'text': text,
            'label': 1,  # AI
            'source': 'synthetic_ai'
        })

    # Add human samples (label = 0)
    for text in human_texts:
        data.append({
            'text': text,
            'label': 0,  # Human
            'source': 'synthetic_human'
        })

    # Create DataFrame
    df = pd.DataFrame(data)

    # Shuffle
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)

    # Save
    df.to_csv(output_path, index=False)

    logger.info(f"✓ Sample dataset created: {output_path}")
    logger.info(f"  Total samples: {len(df)}")
    logger.info(f"  AI samples: {len(df[df['label'] == 1])}")
    logger.info(f"  Human samples: {len(df[df['label'] == 0])}")
    logger.info(f"\nNote: This is a SMALL sample dataset for testing only!")
    logger.info(f"For production, you need 5,000-10,000+ samples.")

    return output_path

def validate_dataset(csv_path: str):
    """Validate dataset format and quality"""
    logger.info(f"\nValidating dataset: {csv_path}")

    df = pd.read_csv(csv_path)

    # Check columns
    required_cols = ['text', 'label']
    missing = [col for col in required_cols if col not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    # Check labels
    unique_labels = df['label'].unique()
    if not set(unique_labels).issubset({0, 1}):
        raise ValueError(f"Labels must be 0 (human) or 1 (AI). Found: {unique_labels}")

    # Check for empty texts
    empty_count = df['text'].isna().sum()
    if empty_count > 0:
        logger.warning(f"Found {empty_count} empty text entries")

    # Check class balance
    label_counts = df['label'].value_counts()
    balance_ratio = label_counts.min() / label_counts.max()

    logger.info("\n✓ Dataset validation passed:")
    logger.info(f"  Total samples: {len(df)}")
    logger.info(f"  Human (0): {label_counts.get(0, 0)} samples")
    logger.info(f"  AI (1): {label_counts.get(1, 0)} samples")
    logger.info(f"  Balance ratio: {balance_ratio:.2f} (1.0 = perfectly balanced)")

    if balance_ratio < 0.5:
        logger.warning("  ⚠ Dataset is imbalanced! Consider adding more samples to minority class")

    # Show sample
    logger.info("\nSample entries:")
    for i, row in df.head(3).iterrows():
        label_name = "AI" if row['label'] == 1 else "HUMAN"
        logger.info(f"  [{label_name}] {row['text'][:80]}...")

    return True

def download_real_datasets_guide():
    """Print guide for downloading real production datasets"""

    guide = """
╔══════════════════════════════════════════════════════════════════════════════╗
║                    REAL DATASET SOURCES FOR PRODUCTION                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

For production-quality AI detection, you need large, diverse datasets.
Here are the best sources:

1. HC3 Dataset (Human-ChatGPT Comparison Corpus)
   ├─ Size: ~24,000 Q&A pairs
   ├─ Source: https://huggingface.co/datasets/Hello-SimpleAI/HC3
   └─ Install: pip install datasets
              from datasets import load_dataset
              dataset = load_dataset("Hello-SimpleAI/HC3")

2. TruthfulQA Dataset
   ├─ Size: ~800 questions with human answers
   ├─ Source: https://huggingface.co/datasets/truthful_qa
   └─ Good for testing model honesty

3. Custom Data Collection:
   ├─ Collect real tweets/posts from your platform
   ├─ Generate AI versions using ChatGPT/Claude
   ├─ Manually label samples
   └─ Aim for 10,000+ samples

4. Data Augmentation:
   ├─ Use GPT-4 to generate more AI samples
   ├─ Scrape Reddit/Twitter for human samples
   ├─ Paraphrase existing samples
   └─ Mix different writing styles

5. Hybrid Approach:
   ├─ Start with HC3 (24k samples)
   ├─ Add your own domain-specific data
   ├─ Fine-tune iteratively
   └─ Test on real user data

╔══════════════════════════════════════════════════════════════════════════════╗
║                         RECOMMENDED DATASET SIZE                             ║
╚══════════════════════════════════════════════════════════════════════════════╝

Minimum for testing:      1,000 samples (500 AI + 500 Human)
Recommended for MVP:      5,000 samples (2,500 + 2,500)
Production-ready:        10,000+ samples (5,000 + 5,000)
Best performance:        50,000+ samples (25,000 + 25,000)

Balance is crucial! Keep AI/Human ratio close to 50/50.
"""

    print(guide)

def main():
    """Main entry point"""
    print("\n" + "="*80)
    print("AI DETECTION DATASET PREPARATION")
    print("="*80 + "\n")

    # Create sample dataset
    output_file = "training_data_sample.csv"
    create_sample_dataset(output_file)

    # Validate it
    validate_dataset(output_file)

    # Show guide for real datasets
    download_real_datasets_guide()

    print("\n" + "="*80)
    print("NEXT STEPS:")
    print("="*80)
    print("\n1. Use this sample to test training:")
    print(f"   python3 train.py --dataset {output_file} --epochs 1")
    print("\n2. For production, download a real dataset:")
    print("   pip install datasets")
    print('   python3 -c "from datasets import load_dataset; load_dataset(\'Hello-SimpleAI/HC3\').save_to_disk(\'hc3_dataset\')"')
    print("\n3. Or collect your own data specific to your use case")
    print("="*80 + "\n")

if __name__ == "__main__":
    main()
