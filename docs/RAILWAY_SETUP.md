# Railway Deployment Guide

Complete step-by-step guide to deploy your branding platform to Railway.

---

## Prerequisites

- [x] GitHub account with this repository
- [ ] Railway account (sign up at https://railway.app)
- [ ] Your API keys ready (Claude, OpenAI, Foreplay)
- [ ] Access to your current PostgreSQL database

---

## Quick Start Timeline

- **Account Setup**: 5 minutes
- **Backend Deployment**: 15 minutes
- **Database Migration**: 30 minutes
- **Frontend Update**: 10 minutes
- **Total**: ~1 hour

---

## Part 1: Railway Account Setup (5 minutes)

### Step 1: Create Railway Account

1. Go to https://railway.app
2. Click **"Start a New Project"**
3. Sign up with GitHub (recommended for easy deployments)
4. Verify your account via email

### Step 2: Add Payment Method

Railway requires a payment method even for the free tier:

1. Go to **Account Settings** → **Billing**
2. Click **"Add Payment Method"**
3. Add your credit/debit card
4. Select **"Developer Plan"** ($5/month)

**Don't worry**: You'll only be charged $5/month + usage beyond that. Most small apps stay within $8-15/month total.

---

## Part 2: Deploy Backend to Railway (15 minutes)

### Step 1: Create New Project

1. From Railway dashboard, click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Authorize Railway to access your GitHub
4. Select your repository: `edwinlov3tt/branding`
5. Click **"Deploy Now"**

### Step 2: Configure Service

Railway will auto-detect your Node.js app. If it doesn't:

1. Click on your deployed service
2. Go to **Settings** → **Service Settings**
3. Set:
   - **Build Command**: (leave empty - Railway auto-detects)
   - **Start Command**: `npm start`
   - **Root Directory**: `/` (leave as root)

### Step 3: Add Environment Variables

1. In your service, click **"Variables"** tab
2. Click **"New Variable"** and add these one by one:

```bash
# Server Config
PORT=3001
NODE_ENV=production

# Database (we'll add this later when we create the database)
# DATABASE_URL will be automatically added by Railway's PostgreSQL plugin

# API Keys
CLAUDE_API_KEY=your_claude_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
FOREPLAY_API_KEY=your_foreplay_api_key_here
FOREPLAY_API_URL=https://public.api.foreplay.co
```

**Note**: Don't add DATABASE_* variables yet - Railway will auto-populate these when we add PostgreSQL.

### Step 4: Deploy

1. Click **"Deploy"** button (or it auto-deploys)
2. Watch the deployment logs in the **"Deployments"** tab
3. Wait for "Build successful" message (~2-3 minutes)

### Step 5: Get Your Backend URL

1. Go to **Settings** → **Networking**
2. Click **"Generate Domain"**
3. Copy your Railway URL (e.g., `branding-production-xxxx.up.railway.app`)
4. Save this URL - you'll need it later!

**Test it**: Open `https://your-railway-url.railway.app/health` in your browser. You should see:
```json
{"status":"ok","message":"API server is running"}
```

---

## Part 3: Add PostgreSQL Database (10 minutes)

### Option A: Create New Railway PostgreSQL (Recommended)

This is the easiest option - Railway manages everything for you.

#### Step 1: Add PostgreSQL Plugin

1. Go back to your Railway **Project Dashboard**
2. Click **"New"** → **"Database"** → **"Add PostgreSQL"**
3. Railway creates a new PostgreSQL instance automatically

#### Step 2: Link Database to Your Service

1. Click on your PostgreSQL database
2. Go to **"Variables"** tab
3. Copy the `DATABASE_URL` value
4. Go back to your **backend service**
5. The `DATABASE_URL` should be automatically added to your environment variables
6. If not, manually add it as a **"New Variable"**

#### Step 3: Verify Connection

Railway automatically injects these variables:
- `DATABASE_URL` - Full connection string
- `PGHOST` - Database host
- `PGPORT` - Database port (usually 5432)
- `PGUSER` - Database user
- `PGPASSWORD` - Database password
- `PGDATABASE` - Database name

Your `server.js` should work with both `DATABASE_URL` OR the individual variables.

#### Step 4: Migrate Your Database Schema

You have two options:

**Option 1: Use Railway's built-in PostgreSQL client**

1. Click on your PostgreSQL database
2. Go to **"Data"** tab
3. Click **"Query"**
4. Copy your migration SQL files from `lib/migrations/` and run them one by one

**Option 2: Connect from your local machine**

```bash
# Install PostgreSQL client (if not already installed)
# macOS:
brew install postgresql

# Get your Railway DATABASE_URL from the Variables tab
# Then connect:
psql "postgresql://user:password@host:port/database"

# Run migrations
\i lib/migrations/add_brand_profiles.sql
\i lib/migrations/add_brand_images.sql
# ... run all your migration files
```

---

### Option B: Use Your Existing Database (Current Google Cloud SQL)

If you want to keep using your current database:

#### Step 1: Update server.js to Support DATABASE_URL

Your current `server.js` uses individual env vars. Let's update it to support Railway's `DATABASE_URL`:

1. Open `server.js`
2. Find the PostgreSQL connection pool setup (around line 13)
3. Replace it with this:

```javascript
// PostgreSQL connection pool - supports both DATABASE_URL and individual vars
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      }
    : {
        host: process.env.DATABASE_HOST,
        port: parseInt(process.env.DATABASE_PORT || '5432'),
        database: process.env.DATABASE_NAME,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        ssl: false,
      }
);
```

#### Step 2: Add Your Database Credentials to Railway

1. Go to your Railway service → **Variables** tab
2. Add these variables:

```bash
DATABASE_HOST=34.174.127.137
DATABASE_PORT=5432
DATABASE_NAME=dba88ghxbxbvfg
DATABASE_USER=udt2m8zip6bij
DATABASE_PASSWORD=9uwxe9juzdvo
```

**Security Note**: These credentials are visible in this conversation. After deployment, consider:
- Rotating your database password
- Using Railway's PostgreSQL instead (more secure)
- Setting up IP allowlisting on Google Cloud SQL

#### Step 3: Configure Google Cloud SQL Firewall

1. Go to your Google Cloud Console
2. Navigate to **SQL** → Your instance
3. Go to **Connections** → **Networking**
4. Add Railway's IP ranges to allowed networks:
   - Railway uses dynamic IPs, so you may need to allow all IPs (0.0.0.0/0)
   - OR migrate to Railway PostgreSQL for better security

**Recommendation**: I highly suggest migrating to Railway's PostgreSQL for better security and management.

---

## Part 4: Update Frontend for Railway Backend (10 minutes)

Now that your backend is deployed, update your frontend to use the Railway URL.

### Step 1: Update Environment Variables for Vercel

1. Go to your Vercel dashboard (vercel.com)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Update `VITE_API_BASE_URL`:

```bash
VITE_API_BASE_URL=https://your-railway-url.railway.app
```

Replace `your-railway-url.railway.app` with your actual Railway domain.

5. Click **"Save"**

### Step 2: Redeploy Frontend

1. Go to **Deployments** tab in Vercel
2. Click the **"..."** menu on the latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete (~1-2 minutes)

### Alternative: Move Frontend to Railway Too

If you want to consolidate everything on Railway:

1. In your Railway project, click **"New"** → **"Empty Service"**
2. Name it "frontend"
3. Connect to the same GitHub repo
4. In Service Settings:
   - **Build Command**: `npm run build`
   - **Start Command**: `npx serve -s dist -l $PORT`
5. Add environment variables (all VITE_* variables)
6. Generate a domain for the frontend service
7. Access your app at the new Railway frontend URL

**Cost Note**: Running both frontend and backend on Railway will cost ~$10-20/month total. Keeping frontend on Vercel (free) is more cost-effective.

---

## Part 5: Database Migration (30 minutes)

### If You Created a New Railway PostgreSQL Database

Follow these steps to migrate your data from Google Cloud SQL to Railway:

#### Step 1: Export Data from Current Database

```bash
# Export schema and data
PGPASSWORD=9uwxe9juzdvo pg_dump \
  -h 34.174.127.137 \
  -U udt2m8zip6bij \
  -d dba88ghxbxbvfg \
  -f backup.sql

# This creates a backup.sql file with all your data
```

#### Step 2: Import to Railway PostgreSQL

```bash
# Get your Railway DATABASE_URL from Railway dashboard
# Then import:
psql "your-railway-database-url" < backup.sql
```

#### Step 3: Verify Migration

```bash
# Connect to Railway database
psql "your-railway-database-url"

# Check tables
\dt

# Check row counts
SELECT 'brands' as table_name, COUNT(*) FROM brands
UNION ALL
SELECT 'products_services', COUNT(*) FROM products_services
UNION ALL
SELECT 'target_audiences', COUNT(*) FROM target_audiences;

# Exit
\q
```

#### Step 4: Update Your Backend Service

1. Railway should have already injected `DATABASE_URL` into your service
2. Redeploy your service to pick up the new database connection
3. Test by visiting `https://your-railway-url.railway.app/api/brands`

---

## Part 6: Testing & Verification (10 minutes)

### Test Backend API

1. **Health Check**:
   ```bash
   curl https://your-railway-url.railway.app/health
   ```
   Expected: `{"status":"ok","message":"API server is running"}`

2. **Database Connection**:
   ```bash
   curl https://your-railway-url.railway.app/api/brands
   ```
   Expected: Your brands data in JSON format

3. **Brand Extraction**:
   ```bash
   curl -X POST https://your-railway-url.railway.app/api/extract-brand \
     -H "Content-Type: application/json" \
     -d '{"url":"https://stripe.com"}'
   ```
   Expected: Brand data extracted from Stripe

### Test Frontend

1. Open your Vercel app URL
2. Try creating a new brand
3. Test all features:
   - Brand profile extraction
   - Product/service management
   - Target audience generation
   - Competitor analysis
   - Campaign creation

### Check Logs

In Railway:
1. Click on your backend service
2. Go to **"Logs"** tab
3. Look for any errors or warnings
4. Verify API requests are coming through

---

## Part 7: Cost Monitoring & Optimization

### Monitor Your Usage

1. Go to Railway **Account Settings** → **Billing**
2. View your **Current Usage** graph
3. Set up **Usage Alerts**:
   - Go to **Settings** → **Usage Alerts**
   - Set threshold (e.g., $10/month)
   - Add your email

### Expected Costs

Based on your application:

| Resource | Estimated Cost |
|----------|---------------|
| **Base Plan** | $5/month |
| **Backend Service** (Node.js) | ~$3-5/month |
| **PostgreSQL Database** | ~$3-5/month |
| **Bandwidth** | ~$0-2/month |
| **TOTAL** | **~$8-15/month** |

### Optimization Tips

1. **Enable sleep mode for dev environments**:
   - Create a separate Railway project for development
   - Let it sleep when inactive (free)

2. **Reduce database size**:
   - Archive old data
   - Add indexes for faster queries

3. **Optimize API calls**:
   - Cache responses where possible
   - Reduce unnecessary database queries

4. **Monitor slow endpoints**:
   - Check Railway logs for slow requests
   - Optimize database queries

---

## Part 8: Post-Deployment Checklist

- [ ] Backend deployed and accessible
- [ ] Database connected and migrated
- [ ] All environment variables set
- [ ] Frontend updated with Railway URL
- [ ] Health check endpoint returns 200
- [ ] Can create/read/update/delete brands
- [ ] Brand extraction API works
- [ ] AI features work (Claude, OpenAI)
- [ ] Foreplay API integration works
- [ ] Logs show no critical errors
- [ ] Usage monitoring set up
- [ ] Cost alerts configured

---

## Common Issues & Solutions

### Issue 1: "Connection refused" errors

**Solution**:
- Check if `DATABASE_URL` is set in Railway variables
- Verify database is running (Railway PostgreSQL dashboard)
- Check if your IP is allowed (if using external database)

### Issue 2: "Module not found" errors

**Solution**:
- Make sure all dependencies are in `package.json`
- Redeploy the service
- Check build logs in Railway

### Issue 3: API returns 500 errors

**Solution**:
- Check Railway logs for error messages
- Verify all API keys are set correctly
- Test locally first with `npm start`

### Issue 4: Frontend can't connect to backend

**Solution**:
- Verify `VITE_API_BASE_URL` is set correctly in Vercel
- Check CORS settings in `server.js` (should allow all origins)
- Test backend URL directly in browser

### Issue 5: Database migration fails

**Solution**:
- Check if tables already exist (DROP them if needed)
- Run migrations one by one
- Check for syntax errors in SQL files
- Verify PostgreSQL version compatibility

---

## Rollback Plan

If something goes wrong and you need to rollback:

### Keep Vercel Backend Running (Temporarily)

1. Don't delete your Vercel deployment yet
2. Keep both running in parallel during migration
3. Switch frontend URL back to Vercel if Railway has issues

### Database Rollback

1. Keep your Google Cloud SQL database running
2. Only decommission it after confirming Railway works for 1-2 weeks
3. You can always reconnect to the old database if needed

---

## Next Steps After Deployment

1. **Set up automatic backups**:
   - Railway PostgreSQL has automatic backups
   - Configure retention period in database settings

2. **Add custom domain** (optional):
   - Go to Railway service → **Settings** → **Networking**
   - Click **"Custom Domain"**
   - Add your domain and configure DNS

3. **Set up monitoring**:
   - Consider adding error tracking (Sentry, LogRocket)
   - Set up uptime monitoring (UptimeRobot, Pingdom)

4. **Enable CI/CD**:
   - Railway auto-deploys on git push
   - Set up branch deployments for staging/production

5. **Scale as needed**:
   - Increase database resources if needed
   - Add more backend instances for high traffic
   - Railway auto-scales based on usage

---

## Support

If you run into issues:

1. **Railway Documentation**: https://docs.railway.app
2. **Railway Discord**: https://discord.gg/railway
3. **Railway Status**: https://status.railway.app

---

## Summary

Congratulations! You've successfully migrated from Vercel to Railway. Here's what you achieved:

✅ No more function limits (was 12, now unlimited)
✅ All API endpoints consolidated in one Express server
✅ PostgreSQL database managed by Railway
✅ Predictable costs (~$8-15/month)
✅ Room to grow and add more features
✅ Better performance (no cold starts)
✅ Simpler architecture (one backend service vs. 12 functions)

Your app is now production-ready and scalable! 🚀
