# PoC Certified - Shared Verification System

## Overview

PoC Certified is a **network effect verification system** that persists AI content detection results across ALL users of the extension. When one user verifies content as human or AI, that verification is shared with everyone else, creating a faster and more efficient system over time.

## How It Works

### 1. First-Time Verification

```
User A views Tweet X
  ↓
Extension hashes tweet content (SHA-256)
  ↓
Check: Is this hash already verified? → NO
  ↓
Run AI detection (pattern matching + models)
  ↓
Save result to shared database
  ↓
Show badge: "PoC Certified Human - Verified by 1 user"
```

### 2. Subsequent Views (Network Effect!)

```
User B views the same Tweet X
  ↓
Extension hashes tweet content
  ↓
Check: Is this hash already verified? → YES!
  ↓
Retrieve cached result (instant, no AI detection needed)
  ↓
Increment view count
  ↓
Show badge: "PoC Certified Human - Verified by 2 users"
```

## Key Features

### ✅ Network Effect
- **First scan**: Runs AI detection, saves result
- **Every other scan**: Uses cached result (instant!)
- **Growing faster**: More users = more pre-verified content

### 🔒 Content Hashing
- SHA-256 hash of normalized text
- Same content = same hash, regardless of platform
- Handles whitespace variations

### 📊 Social Proof
- Shows "Verified by X users" count
- Demonstrates consensus across the network
- Builds trust through verification count

### ⚡ Performance
- Cached verifications are instant
- No API calls for already-verified content
- Scales efficiently with user growth

## Visual Badges

### Human Content
```
┌─────────────────────────────────────┐
│ ✓ PoC Certified Human               │
│   Verified by 847 users              │
└─────────────────────────────────────┘
```
- Light green background (#ecfdf5)
- Green border (#10b981)
- Green checkmark icon

### AI Content
```
┌─────────────────────────────────────┐
│ ⚠ AI Detected (85%)                 │
│   Verified by 234 users              │
└─────────────────────────────────────┘
```
- Light red background (#fef2f2)
- Red border (#ef4444)
- Warning icon

## API Endpoints

### POST /api/v1/verify
**Verify content** - Either return cached result or run detection and cache

**Request:**
```json
{
  "content": "Tweet text here...",
  "platform": "twitter",
  "post_id": "1234567890",
  "post_url": "https://twitter.com/user/status/1234567890"
}
```

**Response (Cached):**
```json
{
  "content_hash": "3b765e8...",
  "verified": true,
  "classification": "human",
  "confidence": 0.85,
  "ai_probability": 0.15,
  "view_count": 847,
  "first_seen": "2026-01-07T00:00:00",
  "cached": true,
  "message": "PoC Certified - Verified by 847 users"
}
```

**Response (New):**
```json
{
  "content_hash": "3b765e8...",
  "verified": true,
  "classification": "human",
  "confidence": 0.85,
  "ai_probability": 0.15,
  "view_count": 1,
  "first_seen": "2026-01-07T00:00:00",
  "cached": false,
  "message": "PoC Certified - First verification"
}
```

### GET /api/v1/check/{content_hash}
**Quick lookup** - Check if content is already verified (for optimization)

**Response:**
```json
{
  "content_hash": "3b765e8...",
  "verified": true,
  "classification": "human",
  "confidence": 0.85,
  "ai_probability": 0.15,
  "view_count": 847,
  "first_seen": "2026-01-07T00:00:00"
}
```

**404 if not verified yet**

### GET /api/v1/stats/verifications
**Get network statistics**

**Response:**
```json
{
  "total_unique_content": 50000,
  "total_verifications": 500000,
  "network_effect_multiplier": 10.0,
  "breakdown": {
    "human": 35000,
    "ai": 12000,
    "mixed": 3000
  },
  "top_verified": [...]
}
```

## Database Schema

### verifications table

```sql
CREATE TABLE verifications (
    id UUID PRIMARY KEY,
    content_hash VARCHAR(64) UNIQUE NOT NULL,
    classification VARCHAR(20) NOT NULL,
    confidence FLOAT NOT NULL,
    ai_probability FLOAT NOT NULL,
    platform VARCHAR(50),
    post_id VARCHAR(100),
    post_url TEXT,
    content_preview TEXT,
    view_count INTEGER DEFAULT 1,
    first_seen TIMESTAMP DEFAULT NOW(),
    last_verified TIMESTAMP DEFAULT NOW(),
    scores TEXT  -- JSON
);

CREATE INDEX idx_verifications_content_hash ON verifications(content_hash);
CREATE INDEX idx_verifications_view_count ON verifications(view_count DESC);
```

## Extension Flow

### Twitter.js Implementation

```javascript
// 1. Hash the content
const contentHash = await hashText(tweetText);

// 2. Check if already verified
let verification = await checkVerification(contentHash);

if (verification) {
  // Cached! Show immediately
  showBadge(verification, cached=true);
  return;
}

// 3. Not cached, verify now
verification = await verifyContent(tweet);
showBadge(verification, cached=false);
```

### SHA-256 Hashing

```javascript
async function hashText(text) {
  // Normalize: lowercase, trim, collapse whitespace
  const normalized = text.toLowerCase().trim().replace(/\s+/g, ' ');

  // Hash with SHA-256
  const msgBuffer = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}
```

## Benefits

### For Users
- ✅ **Faster verification** - Cached results are instant
- ✅ **Social proof** - See how many others verified the content
- ✅ **Network trust** - Consensus across thousands of users

### For the System
- ✅ **Scales efficiently** - Less AI detection needed over time
- ✅ **Handles viral content** - Popular tweets verified once, used millions of times
- ✅ **Data insights** - Track what content is most shared/verified

### For Performance
- ✅ **10x faster** for cached content (no AI detection)
- ✅ **Reduced API costs** - Only detect unique content
- ✅ **Better UX** - Instant badges instead of loading

## Network Effect Example

**Day 1:** 1,000 users, 10,000 tweets
- All require AI detection
- Total detections: 10,000

**Day 30:** 10,000 users, 100,000 tweets
- 80% are duplicates/viral content (already verified)
- Only 20,000 new unique tweets
- Total detections: 20,000 (80% reduction!)

**Day 365:** 100,000 users, 10,000,000 tweets
- 95% are already verified
- Only 500,000 new unique tweets
- Total detections: 500,000 (95% reduction!)

## Statistics

Track the network effect with `/api/v1/stats/verifications`:

- **Total unique content**: How many unique pieces verified
- **Total verifications**: How many times content was checked
- **Network multiplier**: Average times each content was verified
- **Top verified**: Most-viewed content (viral tweets, etc.)

## Future Enhancements

1. **Confidence voting** - Multiple detections improve confidence
2. **User reputation** - Weight verifications by user history
3. **Cross-platform** - Same content on Twitter, Reddit, etc.
4. **Appeals system** - Allow challenges to incorrect classifications
5. **Public API** - Share verifications with other tools

---

**Built with ❤️ for transparency and efficiency**
