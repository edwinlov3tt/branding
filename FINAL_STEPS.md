# Final Steps to Complete Railway Migration

## ✅ What's Done

- ✅ Railway account set up
- ✅ Backend deployed to Railway
- ✅ PostgreSQL database created
- ✅ Database schema created (all 17 tables)
- ✅ 6 brands migrated successfully
- ✅ Basic environment variables set
- ✅ Railway URL: `https://branding.up.railway.app`

---

## 🎯 What You Need to Do Now (5 minutes)

### Step 1: Add Your API Keys to Railway

1. Go to https://railway.app/dashboard
2. Open your project **"gallant-learning"**
3. Click on the **"branding"** service (web service, not PostgreSQL)
4. Click on **"Variables"** tab
5. Click **"New Variable"** and add these:

```bash
CLAUDE_API_KEY=<your_claude_api_key>
OPENAI_API_KEY=<your_openai_api_key>
```

6. Click **"Save"** - Railway will automatically redeploy

---

### Step 2: Wait for Deployment (2-3 minutes)

1. Go to **"Deployments"** tab
2. Watch the latest deployment
3. Wait for it to show **"Success"** (green checkmark)

---

### Step 3: Test Your Backend

Open these URLs in your browser:

1. **Health Check**: https://branding.up.railway.app/health
   - Should see: `{"status":"ok","message":"API server is running"}`

2. **Brands API**: https://branding.up.railway.app/api/brands
   - Should see: JSON array with your 6 brands

3. **Brand Extraction** (test in terminal):
   ```bash
   curl -X POST https://branding.up.railway.app/api/extract-brand \
     -H "Content-Type: application/json" \
     -d '{"url":"https://stripe.com"}'
   ```
   - Should see: Brand data extracted from Stripe

---

### Step 4: Update Vercel Frontend

1. Go to https://vercel.com/dashboard
2. Select your branding project
3. Go to **Settings** → **Environment Variables**
4. Find `VITE_API_BASE_URL` and update it to:
   ```
   https://branding.up.railway.app
   ```
5. Click **"Save"**
6. Go to **"Deployments"** tab
7. Click **"..."** on the latest deployment → **"Redeploy"**
8. Wait 1-2 minutes for redeployment

---

### Step 5: Test Your Full App

1. Open your Vercel app URL
2. Try these features:
   - ✅ View your 6 migrated brands
   - ✅ Create a new brand
   - ✅ Extract brand from a website
   - ✅ Add products/services (start fresh)
   - ✅ Generate target audiences
   - ✅ Create campaigns
   - ✅ Analyze competitors

---

## 🔧 Troubleshooting

### If Backend Returns 502 Error

1. Check Railway logs:
   - Railway Dashboard → branding service → **"Logs"** tab
   - Look for error messages

2. Verify all environment variables are set:
   - Variables tab should have:
     - `NODE_ENV=production`
     - `DATABASE_URL=postgresql://postgres:...`
     - `CLAUDE_API_KEY=sk-...`
     - `OPENAI_API_KEY=sk-...`
     - `FOREPLAY_API_KEY=...`
     - `FOREPLAY_API_URL=https://public.api.foreplay.co`

3. Try redeploying:
   - Deployments tab → **"..."** menu → **"Redeploy"**

---

### If Frontend Can't Connect

1. Verify `VITE_API_BASE_URL` in Vercel is correct:
   - Should be: `https://branding.up.railway.app`
   - NOT: `http://...` (must be https)
   - NOT: ending with `/` (no trailing slash)

2. Redeploy frontend in Vercel

3. Clear browser cache and reload

---

### If Database Connection Fails

1. Check Railway PostgreSQL is running:
   - Dashboard → PostgreSQL service → should be green

2. Verify DATABASE_URL in variables:
   - Should start with `postgresql://postgres:...`

3. Check if using internal URL:
   - Internal (faster): `postgresql://postgres:...@postgres.railway.internal:5432/railway`
   - External: `postgresql://postgres:...@yamanote.proxy.rlwy.net:53446/railway`

---

## 📊 What Data Was Migrated

| Table | Rows | Status |
|-------|------|--------|
| brands | 6 | ✅ Migrated |
| brand_profiles | 0 | Start fresh |
| brand_images | 0 | Start fresh |
| products_services | 0 | Start fresh |
| target_audiences | 0 | Start fresh |
| campaigns | 0 | Start fresh |
| ad_inspirations | 0 | Start fresh |
| competitor_analyses | 0 | Start fresh |
| generated_creatives | 0 | Start fresh |

**You can recreate all the related data as you use the app!**

---

## 💰 Cost Monitoring

1. Go to Railway Dashboard → **Account** → **Billing**
2. View **"Current Usage"** graph
3. Set up **Usage Alerts**:
   - Settings → Usage Alerts
   - Set threshold: $10/month
   - Add your email

**Expected cost**: $8-15/month

---

## 🎉 Success Checklist

- [ ] API keys added to Railway
- [ ] Deployment shows "Success" in Railway
- [ ] `https://branding.up.railway.app/health` returns 200 OK
- [ ] `https://branding.up.railway.app/api/brands` shows your brands
- [ ] Vercel `VITE_API_BASE_URL` updated
- [ ] Frontend redeployed in Vercel
- [ ] Can log into frontend and see brands
- [ ] Can create new brand successfully
- [ ] Usage monitoring configured

---

## 🚀 You're Done!

Once all checklist items are complete, you've successfully migrated to Railway!

### What You Gained:
- ✅ **No function limits** (was 12/12 on Vercel)
- ✅ **PostgreSQL included** with automatic backups
- ✅ **Predictable costs** (~$8-15/month vs $20-40 on Vercel Pro)
- ✅ **No cold starts** (always-on server)
- ✅ **Room to grow** (unlimited API endpoints)

### Next Steps:
1. Use your app and recreate products/audiences/campaigns
2. Monitor Railway usage for first week
3. Keep Vercel backend around for 1-2 weeks as backup
4. Once stable, you can decommission Vercel backend

---

## Need Help?

If you run into issues:

1. **Check Railway Logs**: Dashboard → branding → Logs
2. **Check Vercel Logs**: Vercel Dashboard → Deployments → View Function Logs
3. **Test Backend Directly**: Use the curl commands above
4. **Verify Environment Variables**: Make sure all required vars are set

Let me know if you need help with any step!
