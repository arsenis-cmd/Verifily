"""Pattern-based AI detection using linguistic analysis"""

import re
from typing import Dict, List, Tuple

class PatternDetector:
    def __init__(self):
        # AI writing patterns with confidence weights
        self.ai_patterns = {
            # Explicit AI indicators
            'as_an_ai': (r'\b(as an ai|as an artificial intelligence|as a language model)\b', 0.95),
            'i_cannot': (r"\bi (?:cannot|can't|am unable to) (?:provide|assist|help with)\b", 0.80),
            'i_dont_have': (r"\bi (?:don't|do not) have (?:access|the ability|real-time|personal)\b", 0.75),
            'i_apologize': (r"\bi apologize,? (?:but|for)\b", 0.60),

            # Common AI vocabulary
            'delve': (r'\bdelve(?:s|d)?\b', 0.50),
            'utilize': (r'\butilize(?:s|d)?\b', 0.40),
            'facilitate': (r'\bfacilitate(?:s|d)?\b', 0.40),
            'leverage': (r'\bleverage(?:s|d)?\b', 0.35),
            'robust': (r'\brobust\b', 0.30),
            'comprehensive': (r'\bcomprehensive\b', 0.30),
            'furthermore': (r'\bfurthermore\b', 0.30),
            'moreover': (r'\bmoreover\b', 0.30),
            'additionally': (r'\badditionally\b', 0.25),
            'nonetheless': (r'\bnonetheless\b', 0.30),
            'hence': (r'\bhence\b', 0.25),
            'thus': (r'\bthus\b', 0.20),
            'therefore': (r'\btherefore\b', 0.20),
            'consequently': (r'\bconsequently\b', 0.25),

            # AI sentence starters
            'it_is_important': (r"\bit(?:'s| is) (?:important|worth noting|crucial|essential|vital)\b", 0.35),
            'it_is_worth': (r"\bit(?:'s| is) worth (?:noting|mentioning)\b", 0.35),
            'lets_explore': (r"\blet(?:'s| us) (?:explore|dive|delve|examine)\b", 0.40),
            'in_conclusion': (r'\bin conclusion\b', 0.30),
            'to_summarize': (r'\bto summarize\b', 0.30),
            'in_summary': (r'\bin summary\b', 0.30),

            # Overly formal transitions
            'in_order_to': (r'\bin order to\b', 0.20),
            'with_regard_to': (r'\bwith regard to\b', 0.25),
            'in_terms_of': (r'\bin terms of\b', 0.20),

            # Perfect grammar indicators (rare in human text)
            'oxford_comma': (r'\w+, \w+, and \w+', 0.10),
        }

        # Human writing indicators (negative weights)
        self.human_patterns = {
            # Typos and misspellings
            'common_typos': (r'\b(teh|recieve|occured|seperate|definately|wierd|untill|basicly)\b', -0.40),

            # Internet slang
            'slang': (r'\b(gonna|wanna|gotta|kinda|sorta|lol|lmao|omg|wtf|tbh|ngl|imo|imho)\b', -0.35),

            # Informal contractions
            'contractions': (r"\b(i'm|you're|we're|they're|isn't|aren't|won't|can't|couldn't|wouldn't|shouldn't)\b", -0.15),

            # Filler words
            'fillers': (r'\b(um|uh|hmm|well|like|you know|i mean|kinda|sorta)\b', -0.30),

            # Personal expressions
            'personal': (r'\b(i think|i feel|i believe|in my opinion|personally|imo)\b', -0.20),

            # Emphatic punctuation
            'exclamations': (r'[!]{2,}', -0.20),
            'question_emphasis': (r'[?]{2,}', -0.20),
            'ellipsis': (r'\.{3,}', -0.15),

            # All caps (shouting)
            'all_caps_words': (r'\b[A-Z]{3,}\b', -0.15),

            # Emojis (very human)
            'emojis': (r'[\U0001F300-\U0001F9FF]|[\U0001F600-\U0001F64F]|[\U0001F680-\U0001F6FF]', -0.40),

            # Conversational markers
            'yeah_nah': (r'\b(yeah|yep|nope|nah|yup)\b', -0.25),

            # Casual abbreviations
            'abbreviations': (r'\b(bc|rn|tho|prob|def|obv|thru|w/|btw|idk)\b', -0.30),

            # Numbers without context (informal)
            'bare_numbers': (r'\b\d+\b(?!\s*(?:percent|%|years|days))', -0.10),
        }

    def detect(self, text: str) -> Dict:
        """
        Analyze text for AI/human patterns

        Returns:
            Dict with pattern_score (0-1), matches, and details
        """
        text_lower = text.lower()
        word_count = len(text.split())

        if word_count < 5:
            return {
                'pattern_score': 0.5,
                'confidence': 0.2,
                'matches': [],
                'word_count': word_count
            }

        ai_score = 0.0
        matches = []

        # Check AI patterns
        for name, (pattern, weight) in self.ai_patterns.items():
            found = re.findall(pattern, text_lower, re.MULTILINE | re.IGNORECASE)
            if found:
                count = len(found)
                # Cap contribution at 3x for repeated patterns
                contribution = min(count * weight, weight * 3)
                ai_score += contribution
                matches.append({
                    'type': 'ai',
                    'pattern': name,
                    'count': count,
                    'weight': weight,
                    'contribution': contribution,
                    'examples': found[:3]  # First 3 examples
                })

        # Check human patterns
        for name, (pattern, weight) in self.human_patterns.items():
            found = re.findall(pattern, text_lower, re.MULTILINE | re.IGNORECASE)
            if found:
                count = len(found)
                contribution = count * weight  # Negative
                ai_score += contribution
                matches.append({
                    'type': 'human',
                    'pattern': name,
                    'count': count,
                    'weight': weight,
                    'contribution': contribution,
                    'examples': found[:3]
                })

        # Normalize by text length (per 100 words)
        normalized_score = ai_score / (word_count / 100)

        # Convert to 0-1 probability
        # Map: -2 to +2 range -> 0 to 1
        pattern_score = (normalized_score + 2) / 4
        pattern_score = max(0, min(1, pattern_score))  # Clamp

        # Calculate confidence based on number of matches
        confidence = min(len(matches) / 10, 1.0)  # More matches = higher confidence

        return {
            'pattern_score': round(pattern_score, 4),
            'confidence': round(confidence, 4),
            'raw_score': round(ai_score, 4),
            'normalized_score': round(normalized_score, 4),
            'matches': matches,
            'word_count': word_count,
            'ai_indicators': sum(1 for m in matches if m['type'] == 'ai'),
            'human_indicators': sum(1 for m in matches if m['type'] == 'human')
        }
