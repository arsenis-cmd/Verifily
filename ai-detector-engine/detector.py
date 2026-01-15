"""Ensemble AI detector combining multiple methods"""

import time
from typing import Dict
import logging

from pattern_detector import PatternDetector
from statistical_detector import StatisticalDetector
from ml_detector import MLDetector
from config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EnsembleDetector:
    def __init__(self):
        """Initialize ensemble detector with all detection methods"""
        logger.info("Initializing Ensemble AI Detector...")

        self.pattern_detector = PatternDetector()
        self.statistical_detector = StatisticalDetector()
        self.ml_detector = MLDetector(
            model_name=settings.MODEL_NAME,
            cache_dir=settings.MODEL_CACHE_DIR,
            device=settings.DEVICE
        )

        logger.info("Ensemble detector initialized")

    def detect(self, text: str) -> Dict:
        """
        Detect AI content using ensemble of methods

        Args:
            text: Text to analyze

        Returns:
            Dict with detection results including:
            - ai_probability: 0-1 score
            - classification: AI, LIKELY_AI, MIXED, LIKELY_HUMAN, HUMAN
            - confidence: 0-1 confidence score
            - scores: individual method scores
            - inference_time_ms: time taken
        """
        start_time = time.time()

        # Validate input
        if not text or len(text.strip()) < settings.MIN_TEXT_LENGTH:
            return {
                'ai_probability': 0.5,
                'classification': 'UNCERTAIN',
                'confidence': 0.1,
                'scores': {},
                'inference_time_ms': 0,
                'error': f'Text too short (minimum {settings.MIN_TEXT_LENGTH} characters)'
            }

        if len(text) > settings.MAX_TEXT_LENGTH:
            text = text[:settings.MAX_TEXT_LENGTH]

        # Run all detectors
        pattern_result = self.pattern_detector.detect(text)
        statistical_result = self.statistical_detector.detect(text)
        ml_result = self.ml_detector.detect(text)

        # Extract scores
        pattern_score = pattern_result['pattern_score']
        statistical_score = statistical_result['statistical_score']
        ml_score = ml_result['ml_score']

        # Ensemble weighting
        if ml_result.get('available', False):
            # All three methods available
            combined_score = (
                settings.PATTERN_WEIGHT * pattern_score +
                settings.STATISTICAL_WEIGHT * statistical_score +
                settings.ML_WEIGHT * ml_score
            )
            base_confidence = 0.85  # High confidence with all methods
        else:
            # ML not available, re-weight pattern and statistical
            pattern_weight = 0.55
            statistical_weight = 0.45
            combined_score = (
                pattern_weight * pattern_score +
                statistical_weight * statistical_score
            )
            base_confidence = 0.70  # Lower confidence without ML

        # Adjust confidence based on agreement between methods
        scores = [pattern_score, statistical_score, ml_score if ml_result.get('available') else None]
        scores = [s for s in scores if s is not None]

        if len(scores) >= 2:
            # Calculate variance - low variance means methods agree
            variance = sum((s - combined_score) ** 2 for s in scores) / len(scores)
            agreement_factor = 1 - min(variance, 0.3) / 0.3
            confidence = base_confidence * (0.7 + 0.3 * agreement_factor)
        else:
            confidence = base_confidence * 0.6

        # Classification
        if combined_score >= settings.AI_THRESHOLD:
            classification = "AI"
        elif combined_score >= settings.LIKELY_AI_THRESHOLD:
            classification = "LIKELY_AI"
        elif combined_score >= settings.MIXED_THRESHOLD:
            classification = "MIXED"
        elif combined_score >= settings.LIKELY_HUMAN_THRESHOLD:
            classification = "LIKELY_HUMAN"
        else:
            classification = "HUMAN"

        # Calculate inference time
        inference_time = (time.time() - start_time) * 1000  # ms

        return {
            'ai_probability': round(combined_score, 4),
            'classification': classification,
            'confidence': round(confidence, 4),
            'scores': {
                'pattern': round(pattern_score, 4),
                'statistical': round(statistical_score, 4),
                'ml': round(ml_score, 4) if ml_result.get('available') else None,
                'ml_available': ml_result.get('available', False)
            },
            'details': {
                'pattern': {
                    'ai_indicators': pattern_result.get('ai_indicators', 0),
                    'human_indicators': pattern_result.get('human_indicators', 0),
                    'word_count': pattern_result.get('word_count', 0)
                },
                'statistical': {
                    'metrics': statistical_result.get('metrics', {}),
                    'interpretation': statistical_result.get('interpretation', '')
                }
            },
            'inference_time_ms': round(inference_time, 2),
            'weights_used': {
                'pattern': settings.PATTERN_WEIGHT if ml_result.get('available') else 0.55,
                'statistical': settings.STATISTICAL_WEIGHT if ml_result.get('available') else 0.45,
                'ml': settings.ML_WEIGHT if ml_result.get('available') else 0
            }
        }

    def get_stats(self) -> Dict:
        """Get detector statistics"""
        return {
            'status': 'ready',
            'ml_available': self.ml_detector.loaded,
            'model_name': settings.MODEL_NAME,
            'device': settings.DEVICE,
            'thresholds': {
                'ai': settings.AI_THRESHOLD,
                'likely_ai': settings.LIKELY_AI_THRESHOLD,
                'mixed': settings.MIXED_THRESHOLD,
                'likely_human': settings.LIKELY_HUMAN_THRESHOLD
            },
            'weights': {
                'pattern': settings.PATTERN_WEIGHT,
                'statistical': settings.STATISTICAL_WEIGHT,
                'ml': settings.ML_WEIGHT
            }
        }
