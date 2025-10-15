# Railway Deployment - Quick Start Checklist

**Time Required**: ~1 hour total

Use this checklist for a smooth deployment to Railway. For detailed instructions, see [RAILWAY_SETUP.md](./RAILWAY_SETUP.md).

---

## Pre-Deployment Checklist

- [ ] Have GitHub account with repository access
- [ ] Have Railway account (sign up: https://railway.app)
- [ ] Have payment method ready for Railway
- [ ] Have API keys ready:
  - [ ] Claude API key
  - [ ] OpenAI API key
  - [ ] Foreplay API key

---

## Phase 1: Railway Account Setup (5 min)

- [ ] Sign up at https://railway.app with GitHub
- [ ] Add payment method
- [ ] Select **Developer Plan** ($5/month)

---

## Phase 2: Deploy Backend (15 min)

### Create Project
- [ ] Click **"New Project"** in Railway
- [ ] Select **"Deploy from GitHub repo"**
- [ ] Choose `edwinlov3tt/branding` repository
- [ ] Click **"Deploy Now"**

### Configure Service
- [ ] Verify service detects Node.js
- [ ] Set start command to `npm start` (should be automatic)

### Add Environment Variables
- [ ] Click **"Variables"** tab
- [ ] Add these variables:

```bash
PORT=3001
NODE_ENV=production
CLAUDE_API_KEY=<your_key>
OPENAI_API_KEY=<your_key>
FOREPLAY_API_KEY=<your_key>
FOREPLAY_API_URL=https://public.api.foreplay.co
```

### Get Backend URL
- [ ] Go to **Settings** → **Networking**
- [ ] Click **"Generate Domain"**
- [ ] Copy your Railway URL (save for later)
- [ ] Test: Open `https://your-url.railway.app/health` in browser
- [ ] Should see: `{"status":"ok","message":"API server is running"}`

---

## Phase 3: Add Database (10 min)

### Option A: New Railway PostgreSQL (Recommended)

- [ ] Click **"New"** → **"Database"** → **"Add PostgreSQL"**
- [ ] Verify `DATABASE_URL` auto-added to your service variables
- [ ] Railway service auto-restarts with database connection

### Option B: Use Existing Database

- [ ] Add these variables to your service:
  ```bash
  DATABASE_HOST=34.174.127.137
  DATABASE_PORT=5432
  DATABASE_NAME=dba88ghxbxbvfg
  DATABASE_USER=udt2m8zip6bij
  DATABASE_PASSWORD=9uwxe9juzdvo
  ```
- [ ] **Security**: Plan to rotate password after deployment

---

## Phase 4: Migrate Database (30 min)

### If Using New Railway PostgreSQL

- [ ] Export data from current database:
  ```bash
  PGPASSWORD=9uwxe9juzdvo pg_dump \
    -h 34.174.127.137 \
    -U udt2m8zip6bij \
    -d dba88ghxbxbvfg \
    -f backup.sql
  ```

- [ ] Get Railway `DATABASE_URL` from Variables tab

- [ ] Import to Railway:
  ```bash
  psql "your-railway-database-url" < backup.sql
  ```

- [ ] Verify data migration:
  ```bash
  psql "your-railway-database-url"
  \dt
  SELECT COUNT(*) FROM brands;
  \q
  ```

### If Using Existing Database

- [ ] Verify Google Cloud SQL allows Railway IPs
- [ ] Test connection from Railway logs
- [ ] Consider migrating to Railway PostgreSQL later for better security

---

## Phase 5: Update Frontend (10 min)

### Update Vercel Environment Variables

- [ ] Go to Vercel dashboard → Your project
- [ ] Click **Settings** → **Environment Variables**
- [ ] Update `VITE_API_BASE_URL`:
  ```
  VITE_API_BASE_URL=https://your-railway-url.railway.app
  ```
- [ ] Save changes
- [ ] Go to **Deployments** tab
- [ ] Redeploy latest deployment

---

## Phase 6: Testing (10 min)

### Test Backend Endpoints

- [ ] Health check:
  ```bash
  curl https://your-railway-url.railway.app/health
  ```
  Expected: `{"status":"ok","message":"API server is running"}`

- [ ] Brands endpoint:
  ```bash
  curl https://your-railway-url.railway.app/api/brands
  ```
  Expected: JSON array of brands

- [ ] Brand extraction:
  ```bash
  curl -X POST https://your-railway-url.railway.app/api/extract-brand \
    -H "Content-Type: application/json" \
    -d '{"url":"https://stripe.com"}'
  ```
  Expected: Brand data JSON

### Test Frontend

- [ ] Open your Vercel frontend URL
- [ ] Try creating a new brand
- [ ] Test brand extraction
- [ ] Check products/services page
- [ ] Test target audience generation
- [ ] Verify competitor analysis works
- [ ] Check campaigns page

### Check Railway Logs

- [ ] Go to Railway service → **Logs** tab
- [ ] Verify no critical errors
- [ ] See successful API requests

---

## Phase 7: Monitoring Setup (5 min)

- [ ] Go to Railway **Account** → **Billing**
- [ ] Set up **Usage Alerts**:
  - [ ] Set threshold to $10/month
  - [ ] Add your email
- [ ] Review current usage graph
- [ ] Expected cost: ~$8-15/month

---

## Post-Deployment Checklist

- [ ] Backend deployed and healthy
- [ ] Database connected and data migrated
- [ ] All environment variables set
- [ ] Frontend updated with new API URL
- [ ] All features tested and working
- [ ] No critical errors in logs
- [ ] Usage monitoring configured
- [ ] Cost alerts set up

---

## Common Issues & Quick Fixes

### Backend won't start
- **Check**: Railway logs for error messages
- **Fix**: Verify all required env vars are set
- **Fix**: Check `package.json` has `"start": "node server.js"`

### Database connection fails
- **Check**: `DATABASE_URL` is set in variables
- **Fix**: Verify Railway PostgreSQL is running
- **Fix**: Check if using external DB, verify IP allowlist

### Frontend can't connect
- **Check**: `VITE_API_BASE_URL` is correct in Vercel
- **Fix**: Verify Railway backend is deployed and healthy
- **Fix**: Check CORS settings in `server.js`

### 500 errors on API
- **Check**: Railway logs for detailed error
- **Fix**: Verify API keys are correct
- **Fix**: Check database connection

---

## Success Criteria

✅ **Backend Status**: Railway URL returns health check
✅ **Database Status**: Can query `/api/brands` successfully
✅ **Frontend Status**: Vercel app loads and connects to Railway
✅ **Features**: All core features work (brand extraction, AI, etc.)
✅ **Logs**: No critical errors in Railway logs
✅ **Monitoring**: Usage alerts configured
✅ **Cost**: Estimated ~$8-15/month

---

## Next Steps

1. **Monitor for 24 hours**: Watch Railway logs and usage
2. **Test thoroughly**: Use all features to ensure nothing breaks
3. **Keep Vercel backend**: Don't delete until Railway is stable (1-2 weeks)
4. **Backup database**: Railway auto-backups PostgreSQL
5. **Consider custom domain**: Add your own domain in Railway settings

---

## Cost Breakdown

| Item | Cost |
|------|------|
| Railway Developer Plan | $5/month |
| Backend Service | ~$3-5/month |
| PostgreSQL Database | ~$3-5/month |
| Bandwidth | ~$0-2/month |
| **Total Estimated** | **$8-15/month** |

**Compare to Vercel Pro**: Would cost $20-40/month

**Savings**: ~$5-25/month 💰

---

## Need Help?

- **Detailed Guide**: [RAILWAY_SETUP.md](./RAILWAY_SETUP.md)
- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Railway Status**: https://status.railway.app

---

## Rollback Plan

If something goes wrong:

1. **Keep Vercel running** - Don't delete until Railway is stable
2. **Switch frontend URL back** - Change `VITE_API_BASE_URL` in Vercel
3. **Database stays on Google Cloud** - No data loss
4. **Try again** - Railway keeps your project even if you delete services

---

**Ready to start?** Head to https://railway.app and begin Phase 1! 🚀
