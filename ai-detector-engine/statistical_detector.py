"""Statistical analysis for AI detection"""

import re
import math
from typing import Dict, List
import numpy as np
from collections import Counter

class StatisticalDetector:
    def __init__(self):
        # Common English words for perplexity estimation
        self.common_words = set([
            'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
            'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
            'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
            'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what'
        ])

    def detect(self, text: str) -> Dict:
        """
        Perform statistical analysis on text

        Returns:
            Dict with statistical_score (0-1) and analysis details
        """
        # Extract metrics
        burstiness = self._calculate_burstiness(text)
        perplexity = self._estimate_perplexity(text)
        vocabulary_diversity = self._calculate_vocabulary_diversity(text)
        readability = self._calculate_readability(text)
        uniformity = self._calculate_uniformity(text)

        # Combine metrics into AI probability
        # AI text tends to have:
        # - Low burstiness (uniform sentence lengths)
        # - Low perplexity (predictable word choices)
        # - Lower vocabulary diversity (repetitive)
        # - Consistent readability
        # - High uniformity

        # Normalize and weight metrics
        ai_score = 0.0

        # Burstiness: Low = AI-like (40% weight)
        ai_score += (1 - burstiness) * 0.40

        # Perplexity: Low = AI-like (25% weight)
        ai_score += (1 - perplexity) * 0.25

        # Uniformity: High = AI-like (20% weight)
        ai_score += uniformity * 0.20

        # Vocabulary diversity: Low = AI-like (15% weight)
        ai_score += (1 - vocabulary_diversity) * 0.15

        ai_score = max(0, min(1, ai_score))

        return {
            'statistical_score': round(ai_score, 4),
            'metrics': {
                'burstiness': round(burstiness, 4),
                'perplexity': round(perplexity, 4),
                'vocabulary_diversity': round(vocabulary_diversity, 4),
                'readability': round(readability, 4),
                'uniformity': round(uniformity, 4)
            },
            'interpretation': self._interpret_metrics(burstiness, perplexity, vocabulary_diversity, uniformity)
        }

    def _calculate_burstiness(self, text: str) -> float:
        """
        Calculate burstiness (sentence length variance)
        High variance = more human-like (bursty)
        Low variance = more AI-like (uniform)

        Returns: 0-1 where 1 = high burstiness (human)
        """
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if len(s.strip()) > 5]

        if len(sentences) < 3:
            return 0.5  # Not enough data

        lengths = [len(s.split()) for s in sentences]
        mean_length = np.mean(lengths)
        std_length = np.std(lengths)

        if mean_length == 0:
            return 0.5

        # Coefficient of variation
        cv = std_length / mean_length

        # Normalize: typical human CV is 0.4-0.8, AI is 0.1-0.3
        burstiness = min(cv / 0.8, 1.0)

        return burstiness

    def _estimate_perplexity(self, text: str) -> float:
        """
        Estimate perplexity using word frequency
        High perplexity = more surprising/human
        Low perplexity = more predictable/AI

        Returns: 0-1 where 1 = high perplexity (human)
        """
        words = re.findall(r'\b\w+\b', text.lower())

        if len(words) < 10:
            return 0.5

        # Calculate word frequencies
        word_counts = Counter(words)
        total_words = len(words)

        # Entropy-based perplexity estimation
        entropy = 0.0
        for count in word_counts.values():
            prob = count / total_words
            entropy += -prob * math.log2(prob)

        # Normalize: typical entropy range is 3-10 bits
        normalized_entropy = min(entropy / 10, 1.0)

        # Check for rare words (less common = higher perplexity)
        rare_word_ratio = sum(1 for w in words if w not in self.common_words) / len(words)

        # Combine entropy and rare words
        perplexity_score = (normalized_entropy * 0.7) + (rare_word_ratio * 0.30)

        return min(perplexity_score, 1.0)

    def _calculate_vocabulary_diversity(self, text: str) -> float:
        """
        Calculate vocabulary diversity (Type-Token Ratio)
        High diversity = more human
        Low diversity = more AI (repetitive)

        Returns: 0-1 where 1 = high diversity (human)
        """
        words = re.findall(r'\b\w+\b', text.lower())

        if len(words) < 10:
            return 0.5

        unique_words = len(set(words))
        total_words = len(words)

        # Type-Token Ratio (TTR)
        ttr = unique_words / total_words

        # Adjust for text length (longer texts naturally have lower TTR)
        adjusted_ttr = ttr * math.log(total_words + 1)

        # Normalize: typical range is 0.3-0.8
        diversity = min(adjusted_ttr / 0.8, 1.0)

        return diversity

    def _calculate_readability(self, text: str) -> float:
        """
        Calculate readability score (simplified Flesch)
        Returns: 0-1 where higher = more readable
        """
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if len(s.strip()) > 0]
        words = re.findall(r'\b\w+\b', text)

        if len(sentences) == 0 or len(words) == 0:
            return 0.5

        avg_sentence_length = len(words) / len(sentences)

        # Simplified readability: ideal is 15-20 words per sentence
        if avg_sentence_length < 10:
            readability = avg_sentence_length / 10
        elif avg_sentence_length <= 20:
            readability = 1.0
        else:
            readability = max(0, 1 - (avg_sentence_length - 20) / 30)

        return readability

    def _calculate_uniformity(self, text: str) -> float:
        """
        Calculate text uniformity (how consistent it is)
        High uniformity = more AI-like
        Low uniformity = more human-like

        Returns: 0-1 where 1 = highly uniform (AI-like)
        """
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if len(s.strip()) > 5]

        if len(sentences) < 3:
            return 0.5

        # Measure consistency in sentence structure
        lengths = [len(s.split()) for s in sentences]

        # Calculate how closely lengths cluster around the mean
        mean_length = np.mean(lengths)
        deviations = [abs(l - mean_length) for l in lengths]
        avg_deviation = np.mean(deviations)

        # Lower deviation = higher uniformity
        if mean_length == 0:
            return 0.5

        uniformity = 1 - min(avg_deviation / mean_length, 1.0)

        return uniformity

    def _interpret_metrics(self, burstiness: float, perplexity: float,
                          diversity: float, uniformity: float) -> str:
        """Generate human-readable interpretation"""

        if uniformity > 0.7 and burstiness < 0.3:
            return "Highly uniform structure suggests AI generation"
        elif perplexity < 0.3 and diversity < 0.4:
            return "Predictable word choices indicate possible AI content"
        elif burstiness > 0.6 and diversity > 0.6:
            return "Varied structure and vocabulary suggest human writing"
        elif perplexity > 0.6:
            return "Unpredictable language patterns indicate human authorship"
        else:
            return "Mixed signals - could be human or AI"
