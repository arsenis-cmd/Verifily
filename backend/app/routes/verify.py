"""
PoC Certified Verification System
Shared verification across all users with network effect
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import hashlib
import json

from app.database import get_db
from app.models import Verification, Classification, ContentScan, ContentType
from app.detection.text import text_detector

router = APIRouter(prefix="/api/v1", tags=["verification"])

class VerifyRequest(BaseModel):
    content: str
    platform: Optional[str] = None
    post_id: Optional[str] = None
    post_url: Optional[str] = None

class VerifyResponse(BaseModel):
    content_hash: str
    verified: bool
    classification: str
    confidence: float
    ai_probability: float
    view_count: int
    first_seen: datetime
    cached: bool  # True if this was already in database
    message: str

class CheckResponse(BaseModel):
    content_hash: str
    verified: bool
    classification: str
    confidence: float
    ai_probability: float
    view_count: int
    first_seen: datetime

def normalize_text(text: str) -> str:
    """Normalize text for consistent hashing"""
    # Remove extra whitespace, lowercase, strip
    normalized = ' '.join(text.lower().strip().split())
    return normalized

def hash_content(text: str) -> str:
    """Generate SHA-256 hash of normalized text"""
    normalized = normalize_text(text)
    return hashlib.sha256(normalized.encode()).hexdigest()

@router.get("/check/{content_hash}")
async def check_verification(
    content_hash: str,
    db: AsyncSession = Depends(get_db)
) -> CheckResponse:
    """
    Quick lookup: check if content is already verified
    Returns cached verification or 404 if not found
    """
    result = await db.execute(
        select(Verification).where(Verification.content_hash == content_hash)
    )
    verification = result.scalar_one_or_none()

    if not verification:
        raise HTTPException(status_code=404, detail="Content not verified yet")

    # Increment view count
    await db.execute(
        update(Verification)
        .where(Verification.content_hash == content_hash)
        .values(
            view_count=Verification.view_count + 1,
            last_verified=datetime.utcnow()
        )
    )
    await db.commit()

    return CheckResponse(
        content_hash=verification.content_hash,
        verified=True,
        classification=verification.classification.value,
        confidence=verification.confidence,
        ai_probability=verification.ai_probability,
        view_count=verification.view_count + 1,  # Include the increment
        first_seen=verification.first_seen
    )

@router.post("/verify")
async def verify_content(
    request: VerifyRequest,
    db: AsyncSession = Depends(get_db)
) -> VerifyResponse:
    """
    Verify content - either return cached result or run detection and cache

    Flow:
    1. Hash the content
    2. Check if hash exists in verifications table
    3. If exists: increment view_count, return cached result
    4. If not: run AI detection, save result, return new verification
    """
    # Generate content hash
    content_hash = hash_content(request.content)

    # Check if already verified
    result = await db.execute(
        select(Verification).where(Verification.content_hash == content_hash)
    )
    existing = result.scalar_one_or_none()

    if existing:
        # Already verified - increment view count and return
        await db.execute(
            update(Verification)
            .where(Verification.content_hash == content_hash)
            .values(
                view_count=Verification.view_count + 1,
                last_verified=datetime.utcnow()
            )
        )
        await db.commit()

        return VerifyResponse(
            content_hash=content_hash,
            verified=True,
            classification=existing.classification.value,
            confidence=existing.confidence,
            ai_probability=existing.ai_probability,
            view_count=existing.view_count + 1,
            first_seen=existing.first_seen,
            cached=True,
            message=f"PoC Certified - Verified by {existing.view_count + 1} users"
        )

    # Not verified yet - run detection
    detection_result = await text_detector.detect(
        request.content,
        source_platform=request.platform
    )

    # Determine classification enum
    classification_map = {
        "AI": Classification.AI,
        "LIKELY_AI": Classification.AI,
        "MIXED": Classification.MIXED,
        "LIKELY_HUMAN": Classification.HUMAN,
        "HUMAN": Classification.HUMAN,
        "UNCERTAIN": Classification.UNCERTAIN
    }
    classification = classification_map.get(
        detection_result.classification,
        Classification.UNCERTAIN
    )

    # Create new verification record
    verification = Verification(
        content_hash=content_hash,
        classification=classification,
        confidence=detection_result.confidence,
        ai_probability=detection_result.ai_probability,
        platform=request.platform,
        post_id=request.post_id,
        post_url=request.post_url,
        content_preview=request.content[:200] if request.content else None,
        view_count=1,
        scores=json.dumps(detection_result.scores) if detection_result.scores else None
    )

    db.add(verification)

    # Also save to content_scans for tracking
    content_scan = ContentScan(
        content_hash=content_hash,
        content_type=ContentType.TEXT,
        content_preview=request.content[:200] if request.content else None,
        classification=classification,
        ai_probability=detection_result.ai_probability,
        confidence=detection_result.confidence,
        source_url=request.post_url,
        source_platform=request.platform,
        twitter_tweet_id=request.post_id if request.platform == "twitter" else None,
        scores=json.dumps(detection_result.scores) if detection_result.scores else None
    )
    db.add(content_scan)

    await db.commit()

    return VerifyResponse(
        content_hash=content_hash,
        verified=True,
        classification=classification.value,
        confidence=detection_result.confidence,
        ai_probability=detection_result.ai_probability,
        view_count=1,
        first_seen=verification.first_seen,
        cached=False,
        message="PoC Certified - First verification"
    )

@router.get("/stats/verifications")
async def get_verification_stats(db: AsyncSession = Depends(get_db)):
    """Get overall verification statistics"""
    from sqlalchemy import func

    # Total verifications
    total_result = await db.execute(select(func.count(Verification.id)))
    total_verifications = total_result.scalar() or 0

    # Total views across all verifications
    views_result = await db.execute(select(func.sum(Verification.view_count)))
    total_views = views_result.scalar() or 0

    # Human vs AI breakdown
    human_result = await db.execute(
        select(func.count(Verification.id))
        .where(Verification.classification == Classification.HUMAN)
    )
    human_count = human_result.scalar() or 0

    ai_result = await db.execute(
        select(func.count(Verification.id))
        .where(Verification.classification == Classification.AI)
    )
    ai_count = ai_result.scalar() or 0

    # Most verified content (top 10)
    top_verified = await db.execute(
        select(Verification)
        .order_by(Verification.view_count.desc())
        .limit(10)
    )
    top_content = top_verified.scalars().all()

    return {
        "total_unique_content": total_verifications,
        "total_verifications": total_views,
        "network_effect_multiplier": round(total_views / total_verifications, 2) if total_verifications > 0 else 0,
        "breakdown": {
            "human": human_count,
            "ai": ai_count,
            "mixed": total_verifications - human_count - ai_count
        },
        "top_verified": [
            {
                "content_preview": v.content_preview,
                "classification": v.classification.value,
                "view_count": v.view_count,
                "platform": v.platform,
                "first_seen": v.first_seen.isoformat()
            }
            for v in top_content
        ]
    }
