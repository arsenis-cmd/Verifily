#!/usr/bin/env python3
"""Test script to verify AI detection accuracy"""

import httpx
import asyncio

API_URL = "http://localhost:8000/api/v1"

# Test cases with expected results
TEST_CASES = [
    {
        "name": "100% AI Generated (ChatGPT)",
        "text": "I'm driven by the act of creating—turning ideas into systems that actually work. There's a specific moment I chase: when code compiles, when logic clicks, when something that didn't exist an hour ago suddenly does. I build fast, obsessively, and with intent. Not because I'm told to, but because I'm hungry to see how far an idea can go once it's pushed hard enough. I don't see projects as assignments or milestones; I see them as experiments—each one teaching me how to think better, design sharper, and aim higher.",
        "expected": "AI",
        "expected_probability": ">0.80"
    },
    {
        "name": "100% Human (Casual tweet)",
        "text": "lol just spent 3hrs debugging and the issue was a missing semicolon... gonna take a break, grab some coffee. why do i do this to myself 😭",
        "expected": "HUMAN",
        "expected_probability": "<0.30"
    },
    {
        "name": "Human (Technical but casual)",
        "text": "honestly the new React hooks api is pretty dope. useState makes so much more sense than class components ever did. anyone else think the old way was kinda overcomplicated?",
        "expected": "HUMAN/LIKELY_HUMAN",
        "expected_probability": "<0.40"
    },
    {
        "name": "AI Generated (Formal)",
        "text": "In conclusion, leveraging modern cloud infrastructure can facilitate robust and comprehensive solutions. It is important to note that utilizing best practices will delve into the core aspects of scalability. Furthermore, implementing these methodologies ensures optimal performance.",
        "expected": "AI/LIKELY_AI",
        "expected_probability": ">0.70"
    }
]

async def test_detection():
    """Test AI detection API"""

    print("=" * 80)
    print("AI DETECTION ACCURACY TEST")
    print("=" * 80)
    print()

    async with httpx.AsyncClient() as client:
        results = []

        for i, test_case in enumerate(TEST_CASES, 1):
            print(f"Test {i}/{len(TEST_CASES)}: {test_case['name']}")
            print("-" * 80)
            print(f"Text: {test_case['text'][:100]}...")
            print()

            try:
                response = await client.post(
                    f"{API_URL}/detect",
                    json={
                        "content": test_case['text'],
                        "content_type": "text"
                    },
                    timeout=30.0
                )

                if response.status_code == 200:
                    data = response.json()

                    classification = data.get('classification', 'UNKNOWN')
                    ai_prob = data.get('ai_probability', 0)
                    confidence = data.get('confidence', 0)
                    scores = data.get('scores', {})

                    print(f"✓ Classification: {classification}")
                    print(f"✓ AI Probability: {ai_prob * 100:.1f}%")
                    print(f"✓ Confidence: {confidence * 100:.1f}%")
                    print(f"✓ Detection Source: {scores.get('api_source', 'pattern_only')}")
                    print()
                    print(f"Expected: {test_case['expected']} ({test_case['expected_probability']})")

                    # Check if result matches expectation
                    is_correct = False
                    if test_case['expected'] == 'AI':
                        is_correct = ai_prob >= 0.80 and classification in ['AI', 'LIKELY_AI']
                    elif test_case['expected'] == 'HUMAN':
                        is_correct = ai_prob <= 0.30 and classification in ['HUMAN', 'LIKELY_HUMAN']
                    elif test_case['expected'] == 'HUMAN/LIKELY_HUMAN':
                        is_correct = ai_prob <= 0.40 and classification in ['HUMAN', 'LIKELY_HUMAN']
                    elif test_case['expected'] == 'AI/LIKELY_AI':
                        is_correct = ai_prob >= 0.70 and classification in ['AI', 'LIKELY_AI']

                    result_emoji = "✅ PASS" if is_correct else "❌ FAIL"
                    print(f"\nResult: {result_emoji}")

                    results.append({
                        'name': test_case['name'],
                        'passed': is_correct,
                        'classification': classification,
                        'ai_probability': ai_prob,
                        'source': scores.get('api_source', 'pattern_only')
                    })

                else:
                    print(f"❌ API Error: {response.status_code}")
                    print(f"Response: {response.text}")
                    results.append({
                        'name': test_case['name'],
                        'passed': False,
                        'error': response.status_code
                    })

            except Exception as e:
                print(f"❌ Error: {e}")
                results.append({
                    'name': test_case['name'],
                    'passed': False,
                    'error': str(e)
                })

            print()
            print("=" * 80)
            print()

        # Summary
        passed = sum(1 for r in results if r.get('passed', False))
        total = len(results)
        accuracy = (passed / total) * 100 if total > 0 else 0

        print("\n" + "=" * 80)
        print("SUMMARY")
        print("=" * 80)
        print(f"Tests Passed: {passed}/{total} ({accuracy:.1f}%)")
        print()

        # Check if using ZeroGPT
        using_zerogpt = any(r.get('source') == 'zerogpt' for r in results if 'source' in r)
        print(f"Detection Method: {'✓ ZeroGPT API (High Accuracy)' if using_zerogpt else '⚠ Pattern Matching Only (Lower Accuracy)'}")

        if not using_zerogpt:
            print("\n⚠ WARNING: ZeroGPT API is not being used!")
            print("This means accuracy will be limited to ~60-70%.")
            print("Check that ZEROGPT_API_KEY is set in .env file.")

        print("=" * 80)

        return results

if __name__ == "__main__":
    asyncio.run(test_detection())
