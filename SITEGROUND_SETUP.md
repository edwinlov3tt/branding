# SiteGround Database Configuration for Vercel

## Problem
SiteGround blocks direct PostgreSQL connections from Vercel's serverless functions.

## Solutions

### Option 1: Whitelist Vercel IPs in SiteGround
1. Log into SiteGround Site Tools
2. Go to PostgreSQL → Remote PostgreSQL
3. Add these IP ranges:
   - 18.0.0.0/8
   - 52.0.0.0/8
   - 54.0.0.0/8
4. Enable "Allow external connections"

### Option 2: Migrate to Vercel Postgres (Recommended)
Vercel Postgres is optimized for serverless and has no connection limits.

```bash
# Install Vercel Postgres
npm install @vercel/postgres

# Link to Vercel Postgres
vercel link
vercel storage create postgres
```

### Option 3: Use Supabase (Free Tier Available)
1. Create account at https://supabase.com
2. Create new project
3. Get connection string
4. Update Vercel env vars

### Option 4: Keep SiteGround, Add Connection Pooler
Use PgBouncer or Supabase connection pooler as middleware.

## Current Status
- Database: SiteGround PostgreSQL at 34.174.127.137
- Issue: Firewall blocking Vercel IPs (18.204.2.222, etc.)
- Local development: ✅ Working
- Vercel production: ❌ Blocked

## Recommended Next Steps
1. Try whitelisting Vercel IPs in SiteGround
2. If SiteGround blocks wildcards, migrate to Vercel Postgres or Supabase
