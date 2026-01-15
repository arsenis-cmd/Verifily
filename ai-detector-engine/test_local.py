#!/usr/bin/env python3
"""Test the local AI detection engine"""

import asyncio
import time
from detector import EnsembleDetector

# Test cases
TEST_CASES = [
    {
        "name": "100% AI Generated (ChatGPT)",
        "text": "I'm driven by the act of creating—turning ideas into systems that actually work. There's a specific moment I chase: when code compiles, when logic clicks, when something that didn't exist an hour ago suddenly does. I build fast, obsessively, and with intent. Not because I'm told to, but because I'm hungry to see how far an idea can go once it's pushed hard enough. I don't see projects as assignments or milestones; I see them as experiments—each one teaching me how to think better, design sharper, and aim higher.",
        "expected": "AI",
        "expected_min_prob": 0.70
    },
    {
        "name": "100% Human (Casual tweet)",
        "text": "lol just spent 3hrs debugging and the issue was a missing semicolon... gonna take a break, grab some coffee. why do i do this to myself 😭",
        "expected": "HUMAN",
        "expected_max_prob": 0.35
    },
    {
        "name": "Human (Technical but casual)",
        "text": "honestly the new React hooks api is pretty dope. useState makes so much more sense than class components ever did. anyone else think the old way was kinda overcomplicated? idk maybe i'm just lazy lol",
        "expected": "HUMAN/LIKELY_HUMAN",
        "expected_max_prob": 0.40
    },
    {
        "name": "AI Generated (Formal)",
        "text": "In conclusion, leveraging modern cloud infrastructure can facilitate robust and comprehensive solutions. It is important to note that utilizing best practices will delve into the core aspects of scalability. Furthermore, implementing these methodologies ensures optimal performance across distributed systems.",
        "expected": "AI/LIKELY_AI",
        "expected_min_prob": 0.60
    },
    {
        "name": "Mixed (Human with AI phrases)",
        "text": "So I've been working on this new feature and honestly it's pretty complex. We need to utilize a robust approach to facilitate the integration. But yeah, the implementation is kinda tricky ngl. Gonna need more coffee for this lol",
        "expected": "MIXED",
        "expected_min_prob": 0.40,
        "expected_max_prob": 0.70
    }
]

def main():
    print("=" * 80)
    print("LOCAL AI DETECTION ENGINE TEST")
    print("=" * 80)
    print()

    # Initialize detector
    print("Initializing detector...")
    detector = EnsembleDetector()
    print()

    # Get stats
    stats = detector.get_stats()
    print("Detector Configuration:")
    print(f"  ML Model Available: {stats['ml_available']}")
    print(f"  Model: {stats['model_name']}")
    print(f"  Device: {stats['device']}")
    print(f"  Weights: Pattern={stats['weights']['pattern']}, Statistical={stats['weights']['statistical']}, ML={stats['weights']['ml']}")
    print()
    print("=" * 80)
    print()

    results = []
    total_time = 0

    for i, test_case in enumerate(TEST_CASES, 1):
        print(f"Test {i}/{len(TEST_CASES)}: {test_case['name']}")
        print("-" * 80)
        print(f"Text: {test_case['text'][:100]}...")
        print()

        # Run detection
        result = detector.detect(test_case['text'])

        classification = result['classification']
        ai_prob = result['ai_probability']
        confidence = result['confidence']
        inference_time = result['inference_time_ms']
        scores = result['scores']

        print(f"✓ Classification: {classification}")
        print(f"✓ AI Probability: {ai_prob * 100:.1f}%")
        print(f"✓ Confidence: {confidence * 100:.1f}%")
        print(f"✓ Inference Time: {inference_time:.1f}ms")
        print(f"✓ Scores:")
        print(f"    - Pattern: {scores['pattern'] * 100:.1f}%")
        print(f"    - Statistical: {scores['statistical'] * 100:.1f}%")
        if scores['ml'] is not None:
            print(f"    - ML Model: {scores['ml'] * 100:.1f}%")
        else:
            print(f"    - ML Model: Not available")
        print()
        print(f"Expected: {test_case['expected']}")

        # Check if result matches expectation
        is_correct = False
        expected_classes = test_case['expected'].split('/')

        if 'expected_min_prob' in test_case and 'expected_max_prob' in test_case:
            is_correct = (
                test_case['expected_min_prob'] <= ai_prob <= test_case['expected_max_prob'] and
                classification in expected_classes
            )
        elif 'expected_min_prob' in test_case:
            is_correct = ai_prob >= test_case['expected_min_prob'] and classification in expected_classes
        elif 'expected_max_prob' in test_case:
            is_correct = ai_prob <= test_case['expected_max_prob'] and classification in expected_classes

        result_emoji = "✅ PASS" if is_correct else "❌ FAIL"
        print(f"\nResult: {result_emoji}")

        results.append({
            'name': test_case['name'],
            'passed': is_correct,
            'classification': classification,
            'ai_probability': ai_prob,
            'inference_time': inference_time
        })

        total_time += inference_time

        print()
        print("=" * 80)
        print()

    # Summary
    passed = sum(1 for r in results if r['passed'])
    total = len(results)
    accuracy = (passed / total) * 100 if total > 0 else 0
    avg_time = total_time / total if total > 0 else 0

    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Tests Passed: {passed}/{total} ({accuracy:.1f}%)")
    print(f"Average Inference Time: {avg_time:.1f}ms")
    print()

    if stats['ml_available']:
        print("✓ ML model is loaded and active")
    else:
        print("⚠ ML model not available - using pattern + statistical only")
        print("  To improve accuracy, download models with: python3 download_models.py")

    print("=" * 80)

if __name__ == "__main__":
    main()
