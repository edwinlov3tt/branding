#!/bin/bash
# Railway Migration Script
# Run this after getting your DATABASE_URL from Railway

set -e  # Exit on error

echo "🚂 Railway Migration Script"
echo "=========================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Get DATABASE_URL from user
echo -e "${YELLOW}Step 1: Get your Railway DATABASE_URL${NC}"
echo "Go to Railway Dashboard → PostgreSQL → Variables → Copy DATABASE_URL"
echo ""
read -p "Paste your Railway DATABASE_URL here: " RAILWAY_DATABASE_URL

if [ -z "$RAILWAY_DATABASE_URL" ]; then
  echo -e "${RED}ERROR: DATABASE_URL is required${NC}"
  exit 1
fi

echo -e "${GREEN}✓ DATABASE_URL received${NC}"
echo ""

# Step 2: Export current database
echo -e "${YELLOW}Step 2: Exporting current database from Google Cloud SQL${NC}"
echo "This may take 1-2 minutes..."
echo ""

PGPASSWORD=9uwxe9juzdvo pg_dump \
  -h 34.174.127.137 \
  -U udt2m8zip6bij \
  -d dba88ghxbxbvfg \
  --no-owner \
  --no-acl \
  -f railway-migration-backup.sql

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Database exported successfully${NC}"
  echo "File: railway-migration-backup.sql"
  ls -lh railway-migration-backup.sql
  echo ""
else
  echo -e "${RED}ERROR: Database export failed${NC}"
  exit 1
fi

# Step 3: Import to Railway PostgreSQL
echo -e "${YELLOW}Step 3: Importing to Railway PostgreSQL${NC}"
echo "This may take 1-2 minutes..."
echo ""

psql "$RAILWAY_DATABASE_URL" < railway-migration-backup.sql

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Database imported successfully${NC}"
  echo ""
else
  echo -e "${RED}ERROR: Database import failed${NC}"
  echo "Check the error messages above"
  exit 1
fi

# Step 4: Verify migration
echo -e "${YELLOW}Step 4: Verifying migration${NC}"
echo ""

psql "$RAILWAY_DATABASE_URL" -c "
SELECT
  'brands' as table_name, COUNT(*) as row_count FROM brands
UNION ALL
SELECT 'products_services', COUNT(*) FROM products_services
UNION ALL
SELECT 'target_audiences', COUNT(*) FROM target_audiences
UNION ALL
SELECT 'campaigns', COUNT(*) FROM campaigns
UNION ALL
SELECT 'ad_inspirations', COUNT(*) FROM ad_inspirations
UNION ALL
SELECT 'competitors', COUNT(*) FROM competitors;
"

echo ""
echo -e "${GREEN}✓ Migration verification complete${NC}"
echo ""

# Step 5: Clean up
echo -e "${YELLOW}Step 5: Cleanup${NC}"
read -p "Delete backup file? (y/n): " DELETE_BACKUP

if [ "$DELETE_BACKUP" = "y" ]; then
  rm railway-migration-backup.sql
  echo -e "${GREEN}✓ Backup file deleted${NC}"
else
  echo -e "${YELLOW}Backup file kept: railway-migration-backup.sql${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Migration Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Go to Railway Dashboard → branding service → Variables"
echo "2. Verify DATABASE_URL is set (should be automatic)"
echo "3. Add other environment variables (CLAUDE_API_KEY, etc.)"
echo "4. Test your backend: https://branding.up.railway.app/health"
echo "5. Update Vercel frontend VITE_API_BASE_URL to: https://branding.up.railway.app"
echo ""
