"""
PoC Certified Verification System
Shared verification across all users with network effect
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
import hashlib
import json

from app.database import get_db
from app.models import Verification, Classification, ContentScan, ContentType, Waitlist
from app.detection.text import text_detector

# ML Training Data Collection
try:
    from app.ml.training_data_collector import training_collector
    ML_ENABLED = True
except ImportError:
    ML_ENABLED = False
    print("[Warning] ML training data collection not available")

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

# ===== NEW VERIFILY FEATURES =====

class HumanVerifyRequest(BaseModel):
    """Request to verify own content as human-created"""
    content: str
    platform: Optional[str] = None
    post_id: Optional[str] = None
    post_url: Optional[str] = None
    username: str  # Author's username

class WaitlistRequest(BaseModel):
    """Email waitlist signup"""
    email: EmailStr
    source: Optional[str] = "extension"

@router.post("/verify/human")
async def verify_as_human(
    request: HumanVerifyRequest,
    db: AsyncSession = Depends(get_db)
) -> VerifyResponse:
    """
    Author self-verification - allows content creator to verify their own content as human-written
    This creates a verification record marked as author-verified
    """
    # Generate content hash
    content_hash = hash_content(request.content)

    # Check if already verified
    result = await db.execute(
        select(Verification).where(Verification.content_hash == content_hash)
    )
    existing = result.scalar_one_or_none()

    if existing:
        # Update existing verification to mark as author-verified
        await db.execute(
            update(Verification)
            .where(Verification.content_hash == content_hash)
            .values(
                verified_by_author=True,
                author_username=request.username,
                verification_type='manual',
                classification=Classification.HUMAN,  # Override to HUMAN
                confidence=1.0,  # Max confidence for self-verification
                ai_probability=0.0,
                view_count=Verification.view_count + 1,
                last_verified=datetime.utcnow()
            )
        )
        await db.commit()

        # Refresh to get updated values
        result = await db.execute(
            select(Verification).where(Verification.content_hash == content_hash)
        )
        updated = result.scalar_one()

        return VerifyResponse(
            content_hash=content_hash,
            verified=True,
            classification='human',
            confidence=1.0,
            ai_probability=0.0,
            view_count=updated.view_count,
            first_seen=updated.first_seen,
            cached=True,
            message=f"✓ Verified as human by @{request.username}"
        )

    # Create new author-verified record
    verification = Verification(
        content_hash=content_hash,
        classification=Classification.HUMAN,
        confidence=1.0,
        ai_probability=0.0,
        platform=request.platform,
        post_id=request.post_id,
        post_url=request.post_url,
        content_preview=request.content[:200] if request.content else None,
        verified_by_author=True,
        author_username=request.username,
        verification_type='manual',
        view_count=1
    )

    db.add(verification)

    # Also save to content_scans
    content_scan = ContentScan(
        content_hash=content_hash,
        content_type=ContentType.TEXT,
        content_preview=request.content[:200] if request.content else None,
        classification=Classification.HUMAN,
        ai_probability=0.0,
        confidence=1.0,
        source_url=request.post_url,
        source_platform=request.platform,
        twitter_tweet_id=request.post_id if request.platform == "twitter" else None,
        twitter_username=request.username
    )
    db.add(content_scan)

    await db.commit()

    # 🎯 COLLECT TRAINING DATA - Network Effect!
    if ML_ENABLED:
        try:
            await training_collector.add_example(
                content=request.content,
                label='human',  # User confirmed this is human-written
                platform=request.platform,
                user_handle=request.username,
                confidence=1.0,
                ai_probability=0.0,
                user_confirmed=True,  # Explicitly verified by author
                metadata={
                    'verification_type': 'author_self_verification',
                    'post_id': request.post_id,
                    'post_url': request.post_url
                }
            )
            print(f"[ML] Collected training example from @{request.username}")
        except Exception as e:
            print(f"[ML] Failed to collect training data: {e}")
            # Don't fail the request if training collection fails

    return VerifyResponse(
        content_hash=content_hash,
        verified=True,
        classification='human',
        confidence=1.0,
        ai_probability=0.0,
        view_count=1,
        first_seen=verification.first_seen,
        cached=False,
        message=f"✓ Verified as human by @{request.username}"
    )

@router.get("/verify/{content_hash}")
async def get_verification_public(
    content_hash: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Public verification page data - for shareable badges
    Returns verification details for verifily.io/verify/{hash}
    """
    result = await db.execute(
        select(Verification).where(Verification.content_hash == content_hash)
    )
    verification = result.scalar_one_or_none()

    if not verification:
        raise HTTPException(status_code=404, detail="Verification not found")

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

    return {
        "content_hash": verification.content_hash,
        "classification": verification.classification.value,
        "confidence": verification.confidence,
        "ai_probability": verification.ai_probability,
        "verified_by_author": verification.verified_by_author,
        "author_username": verification.author_username,
        "verification_type": verification.verification_type,
        "platform": verification.platform,
        "post_id": verification.post_id,
        "post_url": verification.post_url,
        "content_preview": verification.content_preview,
        "view_count": verification.view_count + 1,
        "first_seen": verification.first_seen.isoformat(),
        "last_verified": verification.last_verified.isoformat(),
        "shareable_url": f"https://verifily.io/verify/{content_hash}"
    }

@router.post("/waitlist")
async def join_waitlist(
    request: WaitlistRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Add email to waitlist
    """
    # Check if already exists
    result = await db.execute(
        select(Waitlist).where(Waitlist.email == request.email)
    )
    existing = result.scalar_one_or_none()

    if existing:
        return {
            "success": True,
            "message": "You're already on the waitlist!",
            "email": request.email
        }

    # Add to waitlist
    waitlist_entry = Waitlist(
        email=request.email,
        source=request.source
    )
    db.add(waitlist_entry)
    await db.commit()

    return {
        "success": True,
        "message": "Successfully added to waitlist!",
        "email": request.email
    }
