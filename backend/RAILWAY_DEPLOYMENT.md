# Railway Deployment Guide

This guide will help you deploy the PoC MVP backend to Railway.app in under 10 minutes.

## Prerequisites

- GitHub account
- Railway account (sign up at https://railway.app)
- Your backend code pushed to a GitHub repository

## Why Railway?

- ✅ One-click PostgreSQL database
- ✅ Automatic HTTPS
- ✅ $5/month free credit
- ✅ Easy environment variables
- ✅ GitHub integration
- ✅ No timeout limits

## Step-by-Step Deployment

### 1. Push Code to GitHub

First, make sure your backend code is in a GitHub repository:

```bash
cd /Users/arsenispapachristos/Desktop/SDK_PoC/poc-mvp/backend

# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Prepare backend for Railway deployment"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/yourusername/poc-backend.git

# Push
git push -u origin main
```

### 2. Create Railway Project

1. Go to https://railway.app
2. Click "Start a New Project"
3. Select "Deploy from GitHub repo"
4. Connect your GitHub account (if not connected)
5. Select your backend repository
6. Railway will auto-detect it's a Python project

### 3. Add PostgreSQL Database

1. In your Railway project, click "+ New"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically create a PostgreSQL instance
4. Railway will automatically set the `DATABASE_URL` environment variable

### 4. Configure Environment Variables

In Railway dashboard, go to your service → "Variables" tab:

Add these variables:

```
ZEROGPT_API_KEY=9b80c826-37e5-4ee6-9b97-54e9a7e20908
CORS_ORIGINS=["https://yourdomain.vercel.app","chrome-extension://*"]
ANTHROPIC_API_KEY=your_anthropic_key_here
```

**Important Notes:**
- `DATABASE_URL` is automatically provided by Railway when you add PostgreSQL
- Replace `https://yourdomain.vercel.app` with your actual Vercel domain
- If you don't have ANTHROPIC_API_KEY, leave it empty or remove it

### 5. Deploy

Railway will automatically deploy when you:
- Push to GitHub (if auto-deploy is enabled)
- Click "Deploy" in the Railway dashboard

**Deployment takes 2-3 minutes.**

### 6. Get Your API URL

After deployment:
1. Go to "Settings" tab in Railway
2. Click "Generate Domain" under "Public Networking"
3. Your API will be available at: `https://your-project-name.up.railway.app`

### 7. Test Your Deployment

```bash
# Test health endpoint
curl https://your-project-name.up.railway.app/health

# Expected response:
# {"status":"healthy"}
```

### 8. Update Chrome Extension

Update your extension's API URL:

1. Open `/Users/arsenispapachristos/Desktop/SDK_PoC/poc-mvp/extension/content/detector.js`
2. Change line 5:
   ```javascript
   DEFAULT_API_URL: 'https://your-project-name.up.railway.app/api/v1'
   ```

3. Also update `/Users/arsenispapachristos/Desktop/SDK_PoC/poc-mvp/extension/content/verifily-modals.js` line 5 with the same URL

4. Reload your Chrome extension

### 9. Database Migration

After first deployment, run the migration to create tables:

**Option A: Railway CLI (Recommended)**

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migration
railway run python migrate_database.py
```

**Option B: Manual (if tables auto-create)**

Railway will automatically create tables on first API call because of the `init_db()` function in `app/main.py`.

If you have existing data from `poc.db`, you'll need to manually import it to PostgreSQL.

## Troubleshooting

### Deployment Failed

**Check logs:**
1. Go to Railway dashboard
2. Click on your service
3. Go to "Deployments" tab
4. Click on the failed deployment
5. Check logs for errors

**Common issues:**
- Missing dependencies in requirements.txt → We added all needed packages
- Wrong Python version → Add `runtime.txt` with `python-3.9`
- Port binding issues → Procfile handles this with `$PORT`

### Database Connection Error

**Error:** `asyncpg.exceptions.InvalidCatalogNameError`

**Solution:** Railway PostgreSQL is ready, but you need to ensure the database name matches. Railway's `DATABASE_URL` includes the database name, so no action needed.

### CORS Errors

**Error:** `Access to fetch blocked by CORS policy`

**Solution:**
1. Check your Railway environment variables
2. Ensure `CORS_ORIGINS` includes your extension and Vercel domain:
   ```
   CORS_ORIGINS=["https://yourdomain.vercel.app","chrome-extension://*"]
   ```

### API Timeout

**Error:** `Request timeout` or `504 Gateway Timeout`

**Solution:** Railway has no timeout limits (unlike Vercel). If you see this:
1. Check if your ZeroGPT API is responding
2. Check Railway logs for backend errors
3. Ensure your detection logic isn't stuck in a loop

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ | Auto-provided by Railway | `postgresql://...` |
| `ZEROGPT_API_KEY` | ✅ | ZeroGPT API key | `9b80c826-...` |
| `CORS_ORIGINS` | ✅ | Allowed origins (JSON array) | `["https://yourdomain.vercel.app"]` |
| `ANTHROPIC_API_KEY` | ⚠️ | Optional - for Claude AI | Your key or empty |
| `GPTZERO_API_KEY` | ⚠️ | Optional - alternative AI detection | Your key or empty |
| `AI_MODEL_SERVER_URL` | ⚠️ | Optional - custom ML server | `https://...` |

## Cost Estimation

**Railway Pricing:**
- Free tier: $5/month credit
- Usage-based after that
- Estimated cost for MVP: $5-10/month
  - Backend service: ~$5/month
  - PostgreSQL: ~$5/month (included in $10 total)

**Better than other platforms:**
- Vercel serverless: Can't run this backend properly
- Heroku: $7/month minimum + $9/month for PostgreSQL
- AWS/GCP: More complex setup, similar cost

## Next Steps

After successful deployment:

1. ✅ Update Chrome extension API URLs
2. ✅ Update Vercel website API endpoint (if applicable)
3. ✅ Test all features end-to-end
4. ✅ Monitor Railway logs for errors
5. ✅ Set up custom domain (optional)

## Updating Your Deployment

When you make code changes:

```bash
# Commit changes
git add .
git commit -m "Your changes"

# Push to GitHub
git push origin main
```

Railway will automatically detect the push and redeploy (if auto-deploy enabled).

## Rolling Back

If something goes wrong:

1. Go to Railway dashboard → "Deployments"
2. Find a previous working deployment
3. Click "..." → "Redeploy"

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Railway Status: https://status.railway.app

## Architecture After Deployment

```
Chrome Extension
      ↓
Railway Backend (FastAPI)
      ↓
Railway PostgreSQL
      ↓
ZeroGPT API
```

Your users' Chrome extension → Your Railway backend → ZeroGPT API for detection

## Security Notes

- ✅ Railway provides HTTPS automatically
- ✅ Environment variables are encrypted
- ✅ Database connection is secure
- ✅ Never commit `.env` file to GitHub
- ✅ CORS is configured to allow only your domains

## Success Checklist

After deployment, verify:

- [ ] Backend health endpoint responds: `https://your-app.up.railway.app/health`
- [ ] PostgreSQL database is connected (check Railway logs)
- [ ] Environment variables are set correctly
- [ ] CORS allows your extension and Vercel domain
- [ ] ZeroGPT API calls work from Railway
- [ ] Chrome extension connects to Railway backend
- [ ] Database tables are created
- [ ] Verifications are being saved to PostgreSQL

---

**Deployment Time: ~10 minutes**

**Your API will be live at:** `https://your-project-name.up.railway.app`

Good luck! 🚀
