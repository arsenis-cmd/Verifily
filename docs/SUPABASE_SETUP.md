# Supabase Setup for Verifily

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up / Log in
3. Click "New Project"
4. Name it "verifily"
5. Set a strong database password
6. Choose a region close to you
7. Wait 2 minutes for setup

## Step 2: Run Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase/schema.sql`
4. Paste and click **RUN**
5. You should see: "Success. No rows returned"

## Step 3: Get Your API Keys

1. Go to **Settings** → **API**
2. Copy these values:

```
Project URL: https://xxxxx.supabase.co
anon public key: eyJxxx...
service_role key: eyJxxx... (keep this secret!)
```

## Step 4: Configure Environment Variables

Create `.env.local` in the `docs/` directory:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_KEY=eyJxxx...

# Railway API (already configured)
NEXT_PUBLIC_AI_API_URL=https://verifily-production.up.railway.app/api/v1
```

## Step 5: Verify Setup

Run this in your terminal:

```bash
cd docs
npm run dev
```

Visit `http://localhost:3000/api/verify/human` in your browser. You should see a 405 error (Method Not Allowed), which means the API is working but needs a POST request.

## Step 6: Test with curl

```bash
curl -X POST http://localhost:3000/api/verify/human \
  -H "Content-Type: application/json" \
  -d '{
    "content": "This is a test tweet to verify",
    "username": "testuser",
    "platform": "twitter",
    "consent_training_data": true
  }'
```

You should get back a JSON response with a verification ID.

## Step 7: Check Your Database

1. Go to Supabase → **Table Editor**
2. Click on `verifications` table
3. You should see your test verification!

## Done!

Your database is now set up and ready to store real verification data with AI detection.

## Database Tables Created

- **users** - User accounts and consent tracking
- **verifications** - The gold mine (all verified content with AI scores)
- **waitlist** - Email captures
- **ai_detections** - AI detection logs for analytics

## What Gets Stored for Each Verification

- Full content text (for Synthetica training data)
- AI detection score at time of verification
- User consent for training data use
- Classification (human/AI/mixed)
- Confidence score
- Platform metadata
- Shareable URLs

## Free Tier Limits

- 50,000 rows
- 500MB database
- Enough for your first 50K verifications

---

**You're now ready to build your $100B dataset!** 🚀
