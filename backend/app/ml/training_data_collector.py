"""
Training Data Collector
Collects verified human/AI content for model fine-tuning
Network effect: More users = better model
"""

import json
import asyncio
from datetime import datetime
from typing import Dict, List, Optional
from pathlib import Path
import aiosqlite
from dataclasses import dataclass, asdict


@dataclass
class TrainingExample:
    """Single training example"""
    content: str
    label: str  # 'human', 'ai', 'mixed'
    platform: str
    verified_at: str
    user_handle: Optional[str]
    confidence_at_detection: float
    ai_probability_at_detection: float
    user_confirmed: bool  # Did user confirm the label?
    metadata: Dict


class TrainingDataCollector:
    """
    Collects and manages training data from verifications
    """

    def __init__(self, db_path: str = "training_data.db"):
        self.db_path = db_path
        self._initialized = False

    async def initialize(self):
        """Initialize the training data database"""
        if self._initialized:
            return

        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                CREATE TABLE IF NOT EXISTS training_examples (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    content TEXT NOT NULL,
                    label TEXT NOT NULL,
                    platform TEXT,
                    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    user_handle TEXT,
                    confidence_at_detection REAL,
                    ai_probability_at_detection REAL,
                    user_confirmed BOOLEAN DEFAULT FALSE,
                    metadata TEXT,
                    used_for_training BOOLEAN DEFAULT FALSE,
                    model_version TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Index for efficient queries
            await db.execute("""
                CREATE INDEX IF NOT EXISTS idx_label ON training_examples(label)
            """)
            await db.execute("""
                CREATE INDEX IF NOT EXISTS idx_used_for_training
                ON training_examples(used_for_training)
            """)
            await db.execute("""
                CREATE INDEX IF NOT EXISTS idx_user_confirmed
                ON training_examples(user_confirmed)
            """)

            await db.commit()

        self._initialized = True
        print("[Training Data Collector] Initialized")

    async def add_example(
        self,
        content: str,
        label: str,
        platform: str = None,
        user_handle: str = None,
        confidence: float = 0.0,
        ai_probability: float = 0.0,
        user_confirmed: bool = True,
        metadata: Dict = None
    ) -> int:
        """
        Add a training example to the database
        Returns the example ID
        """
        await self.initialize()

        metadata_json = json.dumps(metadata or {})

        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute("""
                INSERT INTO training_examples (
                    content, label, platform, user_handle,
                    confidence_at_detection, ai_probability_at_detection,
                    user_confirmed, metadata
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                content, label, platform, user_handle,
                confidence, ai_probability, user_confirmed, metadata_json
            ))
            await db.commit()
            example_id = cursor.lastrowid

        print(f"[Training Data] Added example {example_id}: {label} ({len(content)} chars)")
        return example_id

    async def get_training_dataset(
        self,
        min_examples: int = 100,
        only_confirmed: bool = True,
        balance_classes: bool = True
    ) -> List[Dict]:
        """
        Get training dataset for model fine-tuning
        """
        await self.initialize()

        query = """
            SELECT content, label, platform, confidence_at_detection,
                   ai_probability_at_detection, metadata
            FROM training_examples
            WHERE used_for_training = FALSE
        """

        if only_confirmed:
            query += " AND user_confirmed = TRUE"

        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute(query)
            rows = await cursor.fetchall()

        examples = []
        for row in rows:
            examples.append({
                'content': row[0],
                'label': row[1],
                'platform': row[2],
                'confidence': row[3],
                'ai_probability': row[4],
                'metadata': json.loads(row[5] or '{}')
            })

        # Balance classes if requested
        if balance_classes:
            examples = self._balance_classes(examples)

        print(f"[Training Data] Retrieved {len(examples)} examples")
        return examples

    def _balance_classes(self, examples: List[Dict]) -> List[Dict]:
        """Balance the dataset across classes"""
        from collections import defaultdict
        import random

        # Group by label
        by_label = defaultdict(list)
        for ex in examples:
            by_label[ex['label']].append(ex)

        # Find minimum class size
        min_size = min(len(v) for v in by_label.values()) if by_label else 0

        # Sample equally from each class
        balanced = []
        for label, label_examples in by_label.items():
            balanced.extend(random.sample(label_examples, min(min_size, len(label_examples))))

        random.shuffle(balanced)
        return balanced

    async def mark_as_used(self, example_ids: List[int], model_version: str):
        """Mark examples as used for training"""
        await self.initialize()

        async with aiosqlite.connect(self.db_path) as db:
            placeholders = ','.join('?' * len(example_ids))
            await db.execute(f"""
                UPDATE training_examples
                SET used_for_training = TRUE, model_version = ?
                WHERE id IN ({placeholders})
            """, [model_version] + example_ids)
            await db.commit()

        print(f"[Training Data] Marked {len(example_ids)} examples as used")

    async def get_stats(self) -> Dict:
        """Get training data statistics"""
        await self.initialize()

        async with aiosqlite.connect(self.db_path) as db:
            # Total examples
            cursor = await db.execute("SELECT COUNT(*) FROM training_examples")
            total = (await cursor.fetchone())[0]

            # By label
            cursor = await db.execute("""
                SELECT label, COUNT(*)
                FROM training_examples
                GROUP BY label
            """)
            by_label = dict(await cursor.fetchall())

            # Confirmed vs unconfirmed
            cursor = await db.execute("""
                SELECT user_confirmed, COUNT(*)
                FROM training_examples
                GROUP BY user_confirmed
            """)
            by_confirmation = dict(await cursor.fetchall())

            # Used for training
            cursor = await db.execute("""
                SELECT COUNT(*)
                FROM training_examples
                WHERE used_for_training = TRUE
            """)
            used = (await cursor.fetchone())[0]

        return {
            'total_examples': total,
            'by_label': by_label,
            'confirmed': by_confirmation.get(1, 0),
            'unconfirmed': by_confirmation.get(0, 0),
            'used_for_training': used,
            'available_for_training': total - used
        }

    async def export_for_training(self, output_path: str = "training_data.jsonl"):
        """Export training data in JSONL format for model fine-tuning"""
        await self.initialize()

        examples = await self.get_training_dataset(only_confirmed=True)

        with open(output_path, 'w') as f:
            for ex in examples:
                # Format for transformer training
                json_line = json.dumps({
                    'text': ex['content'],
                    'label': ex['label'],
                    'metadata': ex['metadata']
                })
                f.write(json_line + '\n')

        print(f"[Training Data] Exported {len(examples)} examples to {output_path}")
        return len(examples)


# Global instance
training_collector = TrainingDataCollector()
