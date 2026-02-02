"""
Test script for advanced AI detection system
"""

import asyncio
import sys
sys.path.insert(0, '/Users/arsenispapachristos/Desktop/SDK_PoC/poc-mvp/backend')

from app.detection.advanced_detector import advanced_detector


# Test samples
HUMAN_TEXT = """
yo this is crazy lol. i was just thinking about this yesterday and now you're posting about it??
that's wild. anyway i think the whole situation is pretty messed up tbh. like why would anyone
even do that in the first place??? makes no sense to me but whatever
"""

AI_TEXT = """
Furthermore, it is important to note that the implementation of artificial intelligence technologies
has significantly transformed various industries. Additionally, these advancements have facilitated
unprecedented levels of efficiency and productivity. Moreover, the comprehensive analysis of data
enables organizations to leverage robust solutions for their operational challenges. Consequently,
stakeholders must delve into the strategic implications of these technological innovations.
"""

MIXED_TEXT = """
I think AI is pretty cool but sometimes it's overrated. Like yeah it can do some impressive stuff
but it's not magic. The technology has improved significantly in recent years, facilitating new
applications across various domains. However, I don't think we should be scared of it or anything.
"""


async def test_detection():
    """Test the advanced detector with different text samples"""

    print("\n" + "="*80)
    print("TESTING ADVANCED AI DETECTION SYSTEM")
    print("="*80 + "\n")

    # Test 1: Human text
    print("TEST 1: HUMAN-WRITTEN TEXT")
    print("-" * 80)
    print(f"Text: {HUMAN_TEXT[:100]}...")
    result = await advanced_detector.detect(HUMAN_TEXT, source_platform='twitter')
    print(f"\nClassification: {result.classification}")
    print(f"AI Probability: {result.ai_probability * 100:.1f}%")
    print(f"Confidence: {result.confidence * 100:.1f}%")
    print(f"\nDetailed Scores:")
    print(f"  - Perplexity:   {result.perplexity_score:.3f}")
    print(f"  - Burstiness:   {result.burstiness_score:.3f}")
    print(f"  - Entropy:      {result.entropy_score:.3f}")
    print(f"  - Transformer:  {result.transformer_score:.3f}")
    print(f"  - Stylometric:  {result.stylometric_score:.3f}")
    print("\n")

    # Test 2: AI text
    print("TEST 2: AI-GENERATED TEXT")
    print("-" * 80)
    print(f"Text: {AI_TEXT[:100]}...")
    result = await advanced_detector.detect(AI_TEXT, source_platform='blog')
    print(f"\nClassification: {result.classification}")
    print(f"AI Probability: {result.ai_probability * 100:.1f}%")
    print(f"Confidence: {result.confidence * 100:.1f}%")
    print(f"\nDetailed Scores:")
    print(f"  - Perplexity:   {result.perplexity_score:.3f}")
    print(f"  - Burstiness:   {result.burstiness_score:.3f}")
    print(f"  - Entropy:      {result.entropy_score:.3f}")
    print(f"  - Transformer:  {result.transformer_score:.3f}")
    print(f"  - Stylometric:  {result.stylometric_score:.3f}")
    print("\n")

    # Test 3: Mixed text
    print("TEST 3: MIXED TEXT")
    print("-" * 80)
    print(f"Text: {MIXED_TEXT[:100]}...")
    result = await advanced_detector.detect(MIXED_TEXT)
    print(f"\nClassification: {result.classification}")
    print(f"AI Probability: {result.ai_probability * 100:.1f}%")
    print(f"Confidence: {result.confidence * 100:.1f}%")
    print(f"\nDetailed Scores:")
    print(f"  - Perplexity:   {result.perplexity_score:.3f}")
    print(f"  - Burstiness:   {result.burstiness_score:.3f}")
    print(f"  - Entropy:      {result.entropy_score:.3f}")
    print(f"  - Transformer:  {result.transformer_score:.3f}")
    print(f"  - Stylometric:  {result.stylometric_score:.3f}")
    print("\n")

    print("="*80)
    print("TESTING COMPLETE")
    print("="*80)


if __name__ == "__main__":
    asyncio.run(test_detection())
