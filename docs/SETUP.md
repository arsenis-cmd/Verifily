# Verifily Dashboard Setup

## Authentication & Database Setup

### 1. Clerk Authentication

1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Go to **API Keys** in your Clerk dashboard
4. Copy your keys and add them to `.env.local`:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key
   CLERK_SECRET_KEY=sk_test_your_key
   ```

### 2. Supabase Database

Your Supabase database is already configured. To set up the verifications table:

1. Go to your Supabase dashboard: [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**
4. Run the SQL from `supabase/schema.sql`

This will create:
- `verifications` table with user data
- Indexes for performance
- Row Level Security (RLS) policies

### 3. Deploy

Once you've added your Clerk keys:

```bash
npm run build
git add -A
git commit -m "Add Clerk authentication"
git push
vercel --prod
```

Add the Clerk keys to Vercel:
```bash
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production
vercel env add CLERK_SECRET_KEY production
```

## Features

- **Dashboard**: View all your AI detections in one place
- **New Detection**: Analyze content directly from the dashboard
- **User Accounts**: Each user has their own saved verifications
- **Authentication**: Secure sign-in with Clerk
- **Database**: Persistent storage with Supabase

## Usage

1. **Sign up** at `/sign-in`
2. **Go to dashboard** at `/dashboard`
3. **Click "New Detection"** to analyze content
4. **View history** of all your detections

Each verification includes:
- Content analyzed
- Classification (HUMAN/AI/MIXED)
- AI probability percentage
- Confidence score
- Timestamp
- Platform (if applicable)
