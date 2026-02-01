import re
import hashlib
import asyncio
from typing import Dict, Tuple
from dataclasses import dataclass
import httpx
import numpy as np
from app.config import settings

# Try to import advanced detector
try:
    from app.detection.advanced_detector import advanced_detector, AdvancedDetectionResult
    ADVANCED_AVAILABLE = True
except ImportError as e:
    print(f"[WARNING] Advanced detector not available: {e}")
    print("[WARNING] Falling back to basic detection")
    ADVANCED_AVAILABLE = False

@dataclass
class TextDetectionResult:
    classification: str
    ai_probability: float
    confidence: float
    scores: Dict[str, float]
    content_hash: str

class TextDetector:
    def __init__(self):
        self.api_key = settings.GPTZERO_API_KEY
        
        # AI writing patterns with weights
        self.ai_patterns = {
            # High confidence AI indicators
            'as_an_ai': (r'\b(as an ai|as an artificial intelligence)\b', 0.9),
            'i_cannot': (r"\bi (?:cannot|can't|am unable to) (?:provide|assist|help with)\b", 0.7),
            'i_dont_have': (r"\bi (?:don't|do not) have (?:access|the ability)\b", 0.6),

            # AI formatting trademarks
            'em_dash': (r'—', 0.35),  # Em dashes are heavily used by AI
            'excessive_emojis': (r'[\U0001F300-\U0001F9FF]{3,}', 0.4),  # 3+ emojis in a row
            'emoji_spam': (r'([\U0001F300-\U0001F9FF].*?[\U0001F300-\U0001F9FF].*?[\U0001F300-\U0001F9FF])', 0.25),  # Multiple emojis scattered

            # Medium confidence indicators
            'delve': (r'\bdelve(?:s|d)?\b', 0.4),
            'utilize': (r'\butilize(?:s|d)?\b', 0.3),
            'facilitate': (r'\bfacilitate(?:s|d)?\b', 0.3),
            'leverage': (r'\bleverage(?:s|d)?\b', 0.25),
            'robust': (r'\brobust\b', 0.2),
            'comprehensive': (r'\bcomprehensive\b', 0.2),
            'furthermore': (r'\bfurthermore\b', 0.2),
            'moreover': (r'\bmoreover\b', 0.2),
            'additionally': (r'\badditionally\b', 0.15),
            'certainly': (r'\bcertainly\b', 0.15),
            'absolutely': (r'\babsolutely\b', 0.1),

            # Structural patterns
            'in_conclusion': (r'\bin conclusion\b', 0.2),
            'it_is_important': (r"\bit(?:'s| is) (?:important|worth noting|crucial)\b", 0.25),
            'lets_explore': (r"\blet(?:'s| us) (?:explore|dive|delve)\b", 0.3),

            # List starters (AI loves lists)
            'numbered_list': (r'^\s*\d+[\.\)]\s', 0.1),
            'bullet_list': (r'^\s*[\-\*•]\s', 0.1),
        }
        
        # Human indicators (reduce AI score)
        self.human_patterns = {
            'typos': (r'\b(teh|recieve|occured|seperate|definately)\b', -0.3),
            'slang': (r'\b(gonna|wanna|gotta|kinda|sorta|ya|yep|nope|lol|lmao|omg)\b', -0.25),
            'contractions': (r"\b(i'm|you're|we're|they're|isn't|aren't|won't|can't|couldn't|wouldn't)\b", -0.1),
            'fillers': (r'\b(um|uh|hmm|well|like|you know|i mean)\b', -0.2),
            'personal': (r'\b(i think|i feel|i believe|in my opinion|personally)\b', -0.15),
            'exclamations': (r'[!]{2,}', -0.1),
            'ellipsis': (r'\.{3,}', -0.1),
            'informal_caps': (r'\b[A-Z]{2,}\b', -0.05),
        }
    
    async def detect(self, text: str, source_platform: str = None) -> TextDetectionResult:
        """Main detection method"""

        # PRIORITY 1: Use Advanced Detector (best accuracy)
        if ADVANCED_AVAILABLE:
            try:
                print("[Detection] Using ADVANCED multi-model detector")
                advanced_result = await advanced_detector.detect(text, source_platform)

                # Convert to TextDetectionResult format
                return TextDetectionResult(
                    classification=advanced_result.classification.lower(),
                    ai_probability=advanced_result.ai_probability,
                    confidence=advanced_result.confidence,
                    scores={
                        'advanced_detector': True,
                        'perplexity': advanced_result.perplexity_score,
                        'burstiness': advanced_result.burstiness_score,
                        'entropy': advanced_result.entropy_score,
                        'transformer': advanced_result.transformer_score,
                        'stylometric': advanced_result.stylometric_score,
                        **advanced_result.detailed_scores
                    },
                    content_hash=advanced_result.content_hash
                )
            except Exception as e:
                print(f"[Detection] Advanced detector failed: {e}")
                print("[Detection] Falling back to basic detection")

        # FALLBACK: Basic detection if advanced not available
        print("[Detection] Using basic detection (fallback)")

        # Generate content hash
        content_hash = hashlib.sha256(text.encode()).hexdigest()

        # Quick validation
        word_count = len(text.split())
        if word_count < 5:
            return TextDetectionResult(
                classification="UNCERTAIN",
                ai_probability=0.5,
                confidence=0.2,
                scores={},
                content_hash=content_hash
            )

        # Run detection methods in parallel
        # Priority: ZeroGPT/GPTZero (paid, best) > External Model Server > Pattern matching
        api_task = self._zerogpt_detect(text)  # Try ZeroGPT first (best accuracy)
        pattern_task = asyncio.to_thread(self._pattern_analysis, text)

        api_result, pattern_result = await asyncio.gather(
            api_task, pattern_task
        )

        # Combine scores
        final_result = self._combine_scores(
            api_result,
            pattern_result,
            word_count,
            source_platform
        )
        final_result.content_hash = content_hash

        return final_result

    async def _external_model_detect(self, text: str) -> Dict:
        """Call external AI model server (if configured)"""
        if not settings.AI_MODEL_SERVER_URL:
            # No external server configured, try Hugging Face
            return await self._huggingface_detect(text)

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{settings.AI_MODEL_SERVER_URL}/detect",
                    headers={"Content-Type": "application/json"},
                    json={"text": text},
                    timeout=10.0
                )

                if response.status_code == 200:
                    data = response.json()
                    return {
                        'ai_probability': data.get('ai_probability', 0.5),
                        'available': True,
                        'source': f'external_model:{data.get("model_name", "unknown")}'
                    }
                else:
                    print(f"External model server error: {response.status_code}")
                    # Fall back to Hugging Face
                    return await self._huggingface_detect(text)

        except Exception as e:
            print(f"External model server connection failed: {e}")
            # Fall back to Hugging Face
            return await self._huggingface_detect(text)

    async def _zerogpt_detect(self, text: str) -> Dict:
        """Call ZeroGPT API"""
        if not settings.ZEROGPT_API_KEY:
            # No ZeroGPT key, try GPTZero
            return await self._gptzero_detect(text)

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.zerogpt.com/api/detect/detectText",
                    headers={
                        "ApiKey": settings.ZEROGPT_API_KEY,
                        "Content-Type": "application/json"
                    },
                    json={"input_text": text},
                    timeout=15.0
                )

                if response.status_code == 200:
                    data = response.json()
                    print(f"[DEBUG] ZeroGPT response: {data}")
                    # ZeroGPT returns: {"success": true, "data": {"fakePercentage": 85.5, "isHuman": 100}}
                    if data.get('success') and 'data' in data:
                        result_data = data['data']
                        # fakePercentage is AI probability (0-100)
                        fake_percentage = float(result_data.get('fakePercentage', 50.0))
                        ai_prob = fake_percentage / 100.0  # Convert to 0-1

                        print(f"[DEBUG] ZeroGPT AI probability: {ai_prob * 100:.1f}%")

                        return {
                            'ai_probability': float(ai_prob),
                            'available': True,
                            'source': 'zerogpt'
                        }
                    else:
                        print(f"ZeroGPT unexpected response format: {data}")
                        return await self._gptzero_detect(text)
                else:
                    print(f"ZeroGPT API error: {response.status_code} - {response.text}")
                    return await self._gptzero_detect(text)

        except Exception as e:
            print(f"ZeroGPT API error: {e}")
            return await self._gptzero_detect(text)

    async def _huggingface_detect(self, text: str) -> Dict:
        """Call Hugging Face Inference API (FREE!)"""

        # Try multiple models in order of preference
        models_to_try = [
            "roberta-large-openai-detector",  # Larger OpenAI detector
            "andreas122001/roberta-large-finetuned-ai-detection",  # Community model
            "distilbert-base-uncased",  # Generic model as last resort
        ]

        for model in models_to_try:
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        f"https://api-inference.huggingface.co/models/{model}",
                        headers={
                            "Content-Type": "application/json"
                        },
                        json={"inputs": text[:512]},  # Limit to 512 chars for speed
                        timeout=15.0
                    )

                    if response.status_code == 200:
                        data = response.json()

                        # Handle different response formats
                        if isinstance(data, list) and len(data) > 0:
                            # Classification model response
                            if isinstance(data[0], list):
                                # Format: [[{"label": "LABEL_0", "score": 0.99}]]
                                for item in data[0]:
                                    if item.get('label') in ['Fake', 'LABEL_1', 'AI', 'Generated']:
                                        return {
                                            'ai_probability': item.get('score', 0.5),
                                            'available': True,
                                            'source': f'huggingface:{model}'
                                        }
                                    elif item.get('label') in ['Real', 'LABEL_0', 'Human', 'Original']:
                                        return {
                                            'ai_probability': 1 - item.get('score', 0.5),
                                            'available': True,
                                            'source': f'huggingface:{model}'
                                        }

                        # If response looks like it's still loading
                        if isinstance(data, dict) and 'error' in data:
                            if 'loading' in data['error'].lower():
                                continue  # Try next model

                    # Model failed, try next one
                    continue

            except Exception as e:
                print(f"Hugging Face model {model} error: {e}")
                continue

        # All models failed, use pattern matching only
        print("All Hugging Face models failed, using pattern matching only")
        return {'ai_probability': None, 'available': False}

    async def _gptzero_detect(self, text: str) -> Dict:
        """Call GPTZero API (PAID - Fallback only)"""
        if not self.api_key:
            return {'ai_probability': None, 'available': False}

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.gptzero.me/v2/predict/text",
                    headers={
                        "x-api-key": self.api_key,
                        "Content-Type": "application/json"
                    },
                    json={"document": text},
                    timeout=15.0
                )

                if response.status_code == 200:
                    data = response.json()
                    doc = data.get('documents', [{}])[0]
                    return {
                        'ai_probability': doc.get('completely_generated_prob', 0.5),
                        'mixed_probability': doc.get('average_generated_prob', 0.5),
                        'available': True,
                        'source': 'gptzero'
                    }
                else:
                    return {'ai_probability': None, 'available': False}

        except Exception as e:
            print(f"GPTZero API error: {e}")
            return {'ai_probability': None, 'available': False}
    
    def _pattern_analysis(self, text: str) -> Dict:
        """Analyze text for AI/human patterns"""
        text_lower = text.lower()
        word_count = len(text.split())
        
        ai_score = 0
        matches = []
        
        # Check AI patterns
        for name, (pattern, weight) in self.ai_patterns.items():
            found = re.findall(pattern, text_lower, re.MULTILINE | re.IGNORECASE)
            if found:
                count = len(found)
                score = min(count * weight, weight * 3)  # Cap at 3x
                ai_score += score
                matches.append({'pattern': name, 'count': count, 'score': score})
        
        # Check human patterns (reduce score)
        for name, (pattern, weight) in self.human_patterns.items():
            found = re.findall(pattern, text_lower, re.MULTILINE | re.IGNORECASE)
            if found:
                count = len(found)
                score = count * weight  # Negative weight
                ai_score += score
                matches.append({'pattern': name, 'count': count, 'score': score})
        
        # Normalize by word count
        normalized_score = ai_score / (word_count / 50)  # Per 50 words
        
        # Calculate sentence variance (burstiness)
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if len(s.strip()) > 10]
        
        if len(sentences) >= 3:
            lengths = [len(s.split()) for s in sentences]
            variance = np.std(lengths) / (np.mean(lengths) + 1)
            # Low variance = more AI-like
            variance_score = 1 - min(variance / 0.8, 1)
        else:
            variance_score = 0.5
        
        return {
            'pattern_score': min(max(normalized_score, 0), 1),
            'variance_score': variance_score,
            'matches': matches
        }
    
    def _combine_scores(
        self,
        api_result: Dict,
        patterns: Dict,
        word_count: int,
        platform: str = None
    ) -> TextDetectionResult:
        """Combine all signals into final classification"""

        scores = {}

        # Weight distribution
        if api_result.get('available') and api_result.get('ai_probability') is not None:
            api_score = api_result['ai_probability']
            pattern_score = patterns['pattern_score']
            variance_score = patterns['variance_score']

            # ZeroGPT/GPTZero are more accurate, give them more weight
            if api_result.get('source') in ['zerogpt', 'gptzero']:
                # ZeroGPT/GPTZero (92%+ accuracy): 85% API, 10% patterns, 5% variance
                combined = (
                    0.85 * api_score +
                    0.10 * pattern_score +
                    0.05 * variance_score
                )
                base_confidence = 0.92  # ZeroGPT/GPTZero are very reliable
            else:
                # Other APIs: 65% API, 25% patterns, 10% variance
                combined = (
                    0.65 * api_score +
                    0.25 * pattern_score +
                    0.10 * variance_score
                )
                base_confidence = 0.85

            scores['api'] = api_score
            scores['api_source'] = api_result.get('source', 'unknown')
            scores['patterns'] = pattern_score
            scores['variance'] = variance_score
        else:
            # Fallback: 70% patterns, 30% variance
            pattern_score = patterns['pattern_score']
            variance_score = patterns['variance_score']
            
            combined = (
                0.70 * pattern_score +
                0.30 * variance_score
            )
            
            scores['patterns'] = pattern_score
            scores['variance'] = variance_score
            
            # Lower confidence without GPTZero
            base_confidence = 0.60
        
        # Adjust confidence based on text length
        length_factor = min(word_count / 100, 1)  # Full confidence at 100+ words
        confidence = base_confidence * (0.5 + 0.5 * length_factor)
        
        # Platform adjustments
        if platform == 'twitter':
            # Twitter has more bots, slightly increase AI probability
            combined = combined * 1.1
            combined = min(combined, 0.99)
        
        # Classification thresholds
        if combined >= 0.85:
            classification = "AI"
        elif combined >= 0.65:
            classification = "LIKELY_AI"
        elif combined >= 0.45:
            classification = "MIXED"
        elif combined >= 0.25:
            classification = "LIKELY_HUMAN"
        else:
            classification = "HUMAN"
        
        return TextDetectionResult(
            classification=classification,
            ai_probability=round(combined, 4),
            confidence=round(confidence, 4),
            scores={k: round(v, 4) if isinstance(v, (int, float)) else v for k, v in scores.items()},
            content_hash=""
        )
    
    async def detect_batch(self, texts: list) -> list:
        """Detect multiple texts in parallel"""
        tasks = [self.detect(t['content'], t.get('source_platform')) for t in texts]
        return await asyncio.gather(*tasks)
    
    def is_likely_bot(self, result: TextDetectionResult, tweet_metadata: Dict = None) -> bool:
        """Determine if content is likely from a bot account"""
        
        # High AI probability is a strong signal
        if result.ai_probability >= 0.8:
            return True
        
        if tweet_metadata:
            # Check for bot indicators in metadata
            username = tweet_metadata.get('username', '')
            
            # Random-looking usernames
            if re.match(r'^[a-z]+\d{5,}$', username.lower()):
                return True
            
            # Default profile indicators
            if tweet_metadata.get('default_profile', False):
                return True
            
            # Very new account with high activity
            # (would need account age data)
        
        return result.ai_probability >= 0.7

text_detector = TextDetector()
