"""
Test script to verify custom pre-trained model loads correctly
"""

import os
import sys

# Set environment variable to use our custom model
os.environ['VERIFILY_CUSTOM_MODEL'] = './models/verifily-pretrained-20260202_104609'

# Import detector after setting env variable
from app.detection.advanced_detector import advanced_detector
import asyncio

async def test_model():
    """Test the custom model with sample texts"""

    # Test 1: Human-written text
    human_text = """
    I think the biggest challenge with AI detection is that it's constantly evolving.
    Like, yesterday I was reading this article about how GPT-4 can now mimic human
    writing styles pretty well. It's crazy! But you know what's even crazier? Some of
    my friends are using AI to write their essays and getting away with it. Not that
    I condone it... just saying it's happening.
    """

    # Test 2: AI-generated text (typical ChatGPT style)
    ai_text = """
    Artificial intelligence has revolutionized numerous industries. Furthermore,
    it continues to advance at an unprecedented rate. Moreover, machine learning
    algorithms are becoming increasingly sophisticated. Consequently, businesses
    are leveraging these technologies to enhance efficiency. Additionally, the
    integration of AI systems has proven beneficial across various sectors.
    """

    print("=" * 60)
    print("Testing Custom Pre-trained Model")
    print("=" * 60)
    print(f"\nModel Path: {os.environ.get('VERIFILY_CUSTOM_MODEL')}")
    print()

    # Test human text
    print("Test 1: Human-written text")
    print("-" * 60)
    result1 = await advanced_detector.detect(human_text)
    print(f"Classification: {result1.classification}")
    print(f"AI Probability: {result1.ai_probability:.2%}")
    print(f"Confidence: {result1.confidence:.2%}")
    print(f"Transformer Score: {result1.transformer_score:.4f}")
    print()

    # Test AI text
    print("Test 2: AI-generated text")
    print("-" * 60)
    result2 = await advanced_detector.detect(ai_text)
    print(f"Classification: {result2.classification}")
    print(f"AI Probability: {result2.ai_probability:.2%}")
    print(f"Confidence: {result2.confidence:.2%}")
    print(f"Transformer Score: {result2.transformer_score:.4f}")
    print()

    print("=" * 60)
    print("✅ Custom model test completed!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_model())
