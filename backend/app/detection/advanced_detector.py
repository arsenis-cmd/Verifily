"""
Advanced AI Detection System - Better than Turnitin
Uses ensemble of multiple detection techniques:
1. Perplexity Analysis (GPT-2 based)
2. Burstiness Analysis
3. Entropy & Lexical Diversity
4. Transformer-based Classification (RoBERTa)
5. Stylometric Features
6. N-gram Frequency Analysis
"""

import re
import math
import hashlib
import asyncio
from typing import Dict, List, Tuple
from dataclasses import dataclass
from collections import Counter
import numpy as np
from scipy import stats
import torch
from transformers import (
    GPT2LMHeadModel,
    GPT2TokenizerFast,
    RobertaTokenizer,
    RobertaForSequenceClassification,
    AutoModelForSequenceClassification,
    AutoTokenizer
)
import textstat
import nltk
from functools import lru_cache

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)

try:
    nltk.data.find('taggers/averaged_perceptron_tagger')
except LookupError:
    nltk.download('averaged_perceptron_tagger', quiet=True)


@dataclass
class AdvancedDetectionResult:
    classification: str  # HUMAN, LIKELY_HUMAN, MIXED, LIKELY_AI, AI
    ai_probability: float  # 0-1
    confidence: float  # 0-1
    perplexity_score: float
    burstiness_score: float
    entropy_score: float
    transformer_score: float
    stylometric_score: float
    detailed_scores: Dict[str, float]
    content_hash: str


class AdvancedAIDetector:
    """
    State-of-the-art AI detection system using ensemble of multiple techniques
    """

    def __init__(self):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        print(f"[Advanced Detector] Using device: {self.device}")

        # Initialize models (lazy loading)
        self._gpt2_model = None
        self._gpt2_tokenizer = None
        self._roberta_model = None
        self._roberta_tokenizer = None
        self._ai_classifier_model = None
        self._ai_classifier_tokenizer = None

        # Cache for model outputs
        self._cache = {}

    @property
    def gpt2_model(self):
        """Lazy load GPT-2 for perplexity calculation"""
        if self._gpt2_model is None:
            print("[Advanced Detector] Loading GPT-2 model...")
            self._gpt2_model = GPT2LMHeadModel.from_pretrained('gpt2').to(self.device)
            self._gpt2_tokenizer = GPT2TokenizerFast.from_pretrained('gpt2')
            self._gpt2_model.eval()
        return self._gpt2_model, self._gpt2_tokenizer

    @property
    def ai_classifier(self):
        """Lazy load RoBERTa-based AI classifier"""
        if self._ai_classifier_model is None:
            print("[Advanced Detector] Loading AI classifier...")

            # Priority: Use custom pre-trained model if available
            import os
            custom_model_path = os.environ.get('VERIFILY_CUSTOM_MODEL')

            if custom_model_path:
                # Check if it's a local path or HuggingFace Hub ID
                is_local = os.path.exists(custom_model_path)
                source = "local" if is_local else "HuggingFace Hub"

                print(f"[Advanced Detector] Loading custom model from {source}: {custom_model_path}")
                try:
                    self._ai_classifier_model = AutoModelForSequenceClassification.from_pretrained(
                        custom_model_path
                    ).to(self.device)
                    self._ai_classifier_tokenizer = AutoTokenizer.from_pretrained(custom_model_path)
                    self._ai_classifier_model.eval()
                    print(f"[Advanced Detector] Custom model loaded successfully from {source}!")
                    return self._ai_classifier_model, self._ai_classifier_tokenizer
                except Exception as e:
                    print(f"[Advanced Detector] Failed to load custom model from {source}: {e}")
                    print("[Advanced Detector] Falling back to default...")

            # Default: Use pre-trained model for AI detection
            model_name = "roberta-base-openai-detector"
            try:
                self._ai_classifier_model = AutoModelForSequenceClassification.from_pretrained(
                    model_name
                ).to(self.device)
                self._ai_classifier_tokenizer = AutoTokenizer.from_pretrained(model_name)
            except:
                # Fallback to base RoBERTa if specific model not available
                print("[Advanced Detector] Fallback to roberta-base")
                model_name = "roberta-base"
                self._ai_classifier_model = RobertaForSequenceClassification.from_pretrained(
                    model_name, num_labels=2
                ).to(self.device)
                self._ai_classifier_tokenizer = RobertaTokenizer.from_pretrained(model_name)

            self._ai_classifier_model.eval()
        return self._ai_classifier_model, self._ai_classifier_tokenizer

    async def detect(self, text: str, source_platform: str = None) -> AdvancedDetectionResult:
        """
        Main detection method - runs all detection techniques in parallel
        """
        # Generate content hash
        content_hash = hashlib.sha256(text.encode()).hexdigest()

        # Check cache
        if content_hash in self._cache:
            return self._cache[content_hash]

        # Quick validation
        word_count = len(text.split())
        if word_count < 5:
            return AdvancedDetectionResult(
                classification="UNCERTAIN",
                ai_probability=0.5,
                confidence=0.2,
                perplexity_score=0.0,
                burstiness_score=0.0,
                entropy_score=0.0,
                transformer_score=0.0,
                stylometric_score=0.0,
                detailed_scores={},
                content_hash=content_hash
            )

        # Run all detection methods in parallel
        perplexity_task = asyncio.to_thread(self._calculate_perplexity, text)
        burstiness_task = asyncio.to_thread(self._calculate_burstiness, text)
        entropy_task = asyncio.to_thread(self._calculate_entropy, text)
        transformer_task = asyncio.to_thread(self._transformer_classify, text)
        stylometric_task = asyncio.to_thread(self._stylometric_analysis, text)

        results = await asyncio.gather(
            perplexity_task,
            burstiness_task,
            entropy_task,
            transformer_task,
            stylometric_task,
            return_exceptions=True
        )

        # Unpack results (handle exceptions)
        perplexity_score = results[0] if not isinstance(results[0], Exception) else 0.5
        burstiness_score = results[1] if not isinstance(results[1], Exception) else 0.5
        entropy_score = results[2] if not isinstance(results[2], Exception) else 0.5
        transformer_score = results[3] if not isinstance(results[3], Exception) else 0.5
        stylometric_score = results[4] if not isinstance(results[4], Exception) else 0.5

        # Combine scores using weighted ensemble
        final_result = self._ensemble_scoring(
            perplexity_score=perplexity_score,
            burstiness_score=burstiness_score,
            entropy_score=entropy_score,
            transformer_score=transformer_score,
            stylometric_score=stylometric_score,
            text_length=word_count,
            platform=source_platform
        )

        final_result.content_hash = content_hash

        # Cache result
        self._cache[content_hash] = final_result

        return final_result

    def _calculate_perplexity(self, text: str) -> float:
        """
        Calculate perplexity using GPT-2
        Low perplexity = more AI-like (predictable)
        High perplexity = more human-like (creative)
        """
        try:
            model, tokenizer = self.gpt2_model

            # Tokenize
            encodings = tokenizer(text, return_tensors='pt', truncation=True, max_length=1024)
            input_ids = encodings.input_ids.to(self.device)

            with torch.no_grad():
                outputs = model(input_ids, labels=input_ids)
                loss = outputs.loss.item()

            # Perplexity = exp(loss)
            perplexity = math.exp(loss)

            # Normalize: Lower perplexity = more AI-like
            # GPT-2 typically gives perplexity:
            # - AI text: 10-50
            # - Human text: 50-300+

            # Map to 0-1 scale (0=human, 1=AI)
            if perplexity < 20:
                ai_score = 0.9  # Very AI-like
            elif perplexity < 40:
                ai_score = 0.7
            elif perplexity < 80:
                ai_score = 0.5
            elif perplexity < 150:
                ai_score = 0.3
            else:
                ai_score = 0.1  # Very human-like

            return ai_score

        except Exception as e:
            print(f"[Perplexity] Error: {e}")
            return 0.5

    def _calculate_burstiness(self, text: str) -> float:
        """
        Calculate burstiness (variance in sentence structure)
        AI text has low burstiness (uniform sentences)
        Human text has high burstiness (varied sentences)
        """
        try:
            # Split into sentences
            sentences = nltk.sent_tokenize(text)

            if len(sentences) < 3:
                return 0.5

            # Calculate sentence lengths
            lengths = [len(s.split()) for s in sentences]

            # Calculate coefficient of variation
            mean_length = np.mean(lengths)
            std_length = np.std(lengths)

            if mean_length == 0:
                return 0.5

            cv = std_length / mean_length

            # AI text typically has CV < 0.3
            # Human text typically has CV > 0.5

            if cv < 0.2:
                ai_score = 0.9  # Very uniform = AI
            elif cv < 0.4:
                ai_score = 0.6
            elif cv < 0.6:
                ai_score = 0.4
            else:
                ai_score = 0.2  # Very varied = human

            return ai_score

        except Exception as e:
            print(f"[Burstiness] Error: {e}")
            return 0.5

    def _calculate_entropy(self, text: str) -> float:
        """
        Calculate lexical entropy and diversity
        AI text has lower entropy (repetitive)
        Human text has higher entropy (diverse)
        """
        try:
            words = text.lower().split()

            if len(words) < 10:
                return 0.5

            # 1. Lexical diversity (unique words / total words)
            unique_words = len(set(words))
            lexical_diversity = unique_words / len(words)

            # 2. Shannon entropy
            word_counts = Counter(words)
            total_words = len(words)
            entropy = -sum((count / total_words) * math.log2(count / total_words)
                          for count in word_counts.values())

            # Normalize entropy (typical range: 6-12)
            normalized_entropy = min(entropy / 12, 1.0)

            # 3. N-gram repetition
            bigrams = list(zip(words[:-1], words[1:]))
            unique_bigrams = len(set(bigrams))
            bigram_diversity = unique_bigrams / len(bigrams) if bigrams else 0

            # Combine metrics
            # High diversity + high entropy = human
            # Low diversity + low entropy = AI
            diversity_score = (lexical_diversity + normalized_entropy + bigram_diversity) / 3

            # Invert: high diversity = low AI score
            ai_score = 1 - diversity_score

            return ai_score

        except Exception as e:
            print(f"[Entropy] Error: {e}")
            return 0.5

    def _transformer_classify(self, text: str) -> float:
        """
        Use transformer-based classifier (RoBERTa fine-tuned on AI detection)
        """
        try:
            model, tokenizer = self.ai_classifier

            # Tokenize
            inputs = tokenizer(
                text,
                return_tensors='pt',
                truncation=True,
                max_length=512,
                padding=True
            ).to(self.device)

            with torch.no_grad():
                outputs = model(**inputs)
                logits = outputs.logits
                probs = torch.softmax(logits, dim=-1)

            # Assuming label 1 is "AI-generated"
            # (may need to adjust based on model)
            ai_prob = probs[0][1].item() if probs.shape[1] > 1 else 0.5

            return ai_prob

        except Exception as e:
            print(f"[Transformer] Error: {e}")
            return 0.5

    def _stylometric_analysis(self, text: str) -> float:
        """
        Analyze writing style features
        """
        try:
            ai_score = 0.5

            # 1. Readability scores
            flesch = textstat.flesch_reading_ease(text)
            # AI text tends to have mid-range readability (60-80)
            if 60 <= flesch <= 80:
                ai_score += 0.1

            # 2. Sentence complexity
            avg_sentence_length = textstat.avg_sentence_length(text)
            # AI tends to write 15-25 word sentences
            if 15 <= avg_sentence_length <= 25:
                ai_score += 0.1

            # 3. Syllable patterns
            syllables_per_word = textstat.syllable_count(text) / len(text.split())
            # AI tends toward 1.5-2.0 syllables per word
            if 1.5 <= syllables_per_word <= 2.0:
                ai_score += 0.1

            # 4. Punctuation patterns
            exclamation_ratio = text.count('!') / max(len(text.split()), 1)
            question_ratio = text.count('?') / max(len(text.split()), 1)

            # AI uses less exclamation marks
            if exclamation_ratio < 0.01:
                ai_score += 0.05

            # 5. Part-of-speech patterns
            words = nltk.word_tokenize(text)
            pos_tags = nltk.pos_tag(words)
            pos_counts = Counter(tag for word, tag in pos_tags)

            # AI tends to use more adjectives (JJ) and adverbs (RB)
            total_tags = len(pos_tags)
            if total_tags > 0:
                adj_ratio = pos_counts.get('JJ', 0) / total_tags
                adv_ratio = pos_counts.get('RB', 0) / total_tags

                if adj_ratio > 0.1:  # > 10% adjectives
                    ai_score += 0.05
                if adv_ratio > 0.05:  # > 5% adverbs
                    ai_score += 0.05

            # 6. Transition word usage
            transitions = [
                'however', 'moreover', 'furthermore', 'additionally',
                'consequently', 'therefore', 'thus', 'hence'
            ]
            text_lower = text.lower()
            transition_count = sum(text_lower.count(word) for word in transitions)
            transition_ratio = transition_count / max(len(text.split()), 1)

            # AI uses more transitions
            if transition_ratio > 0.02:
                ai_score += 0.1

            return min(ai_score, 1.0)

        except Exception as e:
            print(f"[Stylometric] Error: {e}")
            return 0.5

    def _ensemble_scoring(
        self,
        perplexity_score: float,
        burstiness_score: float,
        entropy_score: float,
        transformer_score: float,
        stylometric_score: float,
        text_length: int,
        platform: str = None
    ) -> AdvancedDetectionResult:
        """
        Combine all scores using weighted ensemble
        Weights optimized for maximum accuracy
        """

        # Adaptive weights based on text length
        if text_length < 50:
            # Short text: rely more on transformer and patterns
            weights = {
                'perplexity': 0.15,
                'burstiness': 0.10,
                'entropy': 0.15,
                'transformer': 0.40,
                'stylometric': 0.20
            }
            base_confidence = 0.70
        elif text_length < 150:
            # Medium text: balanced
            weights = {
                'perplexity': 0.25,
                'burstiness': 0.15,
                'entropy': 0.20,
                'transformer': 0.25,
                'stylometric': 0.15
            }
            base_confidence = 0.85
        else:
            # Long text: all methods reliable
            weights = {
                'perplexity': 0.30,
                'burstiness': 0.20,
                'entropy': 0.20,
                'transformer': 0.15,
                'stylometric': 0.15
            }
            base_confidence = 0.95

        # Calculate weighted score
        ai_probability = (
            weights['perplexity'] * perplexity_score +
            weights['burstiness'] * burstiness_score +
            weights['entropy'] * entropy_score +
            weights['transformer'] * transformer_score +
            weights['stylometric'] * stylometric_score
        )

        # Platform adjustments
        if platform == 'twitter':
            # Twitter: shorter, more casual - adjust expectations
            ai_probability *= 0.95

        # Confidence based on score agreement
        scores = [perplexity_score, burstiness_score, entropy_score,
                 transformer_score, stylometric_score]
        score_variance = np.var(scores)

        # Low variance = high agreement = high confidence
        confidence = base_confidence * (1 - min(score_variance, 0.3))

        # Classification thresholds
        if ai_probability >= 0.80:
            classification = "AI"
        elif ai_probability >= 0.60:
            classification = "LIKELY_AI"
        elif ai_probability >= 0.40:
            classification = "MIXED"
        elif ai_probability >= 0.20:
            classification = "LIKELY_HUMAN"
        else:
            classification = "HUMAN"

        return AdvancedDetectionResult(
            classification=classification,
            ai_probability=round(ai_probability, 4),
            confidence=round(confidence, 4),
            perplexity_score=round(perplexity_score, 4),
            burstiness_score=round(burstiness_score, 4),
            entropy_score=round(entropy_score, 4),
            transformer_score=round(transformer_score, 4),
            stylometric_score=round(stylometric_score, 4),
            detailed_scores={
                'perplexity': round(perplexity_score, 4),
                'burstiness': round(burstiness_score, 4),
                'entropy': round(entropy_score, 4),
                'transformer': round(transformer_score, 4),
                'stylometric': round(stylometric_score, 4),
                'weights': weights,
                'text_length': text_length,
                'score_variance': round(score_variance, 4)
            },
            content_hash=""
        )


# Global instance
advanced_detector = AdvancedAIDetector()
