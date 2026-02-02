# Clerk Dashboard Configuration Checklist

## Critical: These settings MUST be configured for verifily.io to work

### 1. ✅ API Keys (Already Done)
- [x] Using production keys (pk_live_...)
- [x] Keys added to Vercel production environment
- [x] Keys match between local and production

### 2. ⚠️ DOMAINS (Check This!)

Go to: **Clerk Dashboard → Configure → Domains**

#### Production Domain Configuration:
1. Click "Add domain"
2. Enter: `verifily.io`
3. Verify DNS (if prompted)
4. Make sure status shows as "Active" or "Verified"

**IMPORTANT**: If you don't see `verifily.io` listed here, Clerk will reject authentication requests!

### 3. ⚠️ ALLOWED ORIGINS (Check This!)

Go to: **Clerk Dashboard → Configure → Security**

Under "Allowed origins" section, add:
- `https://verifily.io`
- `https://www.verifily.io` (if using www)
- `https://*.vercel.app` (for preview deployments)

**IMPORTANT**: Without these origins, you'll get CORS errors and client_id errors!

### 4. ⚠️ INSTANCE TYPE (Verify This!)

Go to: **Clerk Dashboard → Settings → General**

Verify:
- [ ] Instance Type is "Production" (not "Development")
- [ ] Instance is "Active" status

### 5. ✅ Paths (Already Configured)
- [x] Home URL: https://verifily.io
- [x] Sign-in URL: /sign-in
- [x] Sign-up URL: /sign-up
- [x] After sign-out URL: /

### 6. ⚠️ APPLICATION SELECTION (Important!)

Make sure you're looking at the CORRECT Clerk application:
- The application name should match your project
- The publishable key should be: `pk_live_Y2xlcmsudmVyaWZpbHkuaW8k`
- If you have multiple applications, make sure you're configuring the right one!

## Testing After Configuration

1. Wait 2-3 minutes after making changes
2. Clear browser cache (Cmd+Shift+Delete)
3. Visit: https://verifily.io/clerk-debug (to verify configuration)
4. Visit: https://verifily.io/dashboard
5. Try signing in

## Common Issues

### "Missing client_id" Error
- **Cause**: Domain not added to Clerk Dashboard
- **Fix**: Add verifily.io to Domains section

### "Development keys" Warning
- **Cause**: Using pk_test_ keys in production
- **Fix**: You're already using pk_live_ keys ✅

### Redirect Loop
- **Cause**: Missing redirect URLs
- **Fix**: Already configured ✅

### 401 Unauthorized
- **Cause**: CORS / Allowed origins not set
- **Fix**: Add origins to Security section

## If Still Not Working

1. Check Clerk Dashboard → Activity Log for detailed errors
2. Open browser DevTools → Network tab → Filter by "clerk"
3. Look for failed requests and check the error messages
4. Visit /clerk-debug page for diagnostic information
