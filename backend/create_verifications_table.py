"""
Create verifications table for PoC Certified system
Run this once to add the shared verification table
"""
import asyncio
from sqlalchemy import text
from app.database import engine

async def create_verifications_table():

    create_table_sql = """
    CREATE TABLE IF NOT EXISTS verifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content_hash VARCHAR(64) UNIQUE NOT NULL,
        classification VARCHAR(20) NOT NULL,
        confidence FLOAT NOT NULL,
        ai_probability FLOAT NOT NULL,
        platform VARCHAR(50),
        post_id VARCHAR(100),
        post_url TEXT,
        content_preview TEXT,
        view_count INTEGER NOT NULL DEFAULT 1,
        first_seen TIMESTAMP NOT NULL DEFAULT NOW(),
        last_verified TIMESTAMP NOT NULL DEFAULT NOW(),
        scores TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_verifications_content_hash ON verifications(content_hash);
    CREATE INDEX IF NOT EXISTS idx_verifications_first_seen ON verifications(first_seen);
    CREATE INDEX IF NOT EXISTS idx_verifications_classification ON verifications(classification);
    CREATE INDEX IF NOT EXISTS idx_verifications_view_count ON verifications(view_count DESC);
    """

    async with engine.begin() as conn:
        await conn.execute(text(create_table_sql))

    print("✅ Verifications table created successfully!")
    print("   - content_hash index created")
    print("   - first_seen index created")
    print("   - classification index created")
    print("   - view_count index created")
    print("\nPoC Certified system is ready! 🎉")

if __name__ == "__main__":
    asyncio.run(create_verifications_table())
