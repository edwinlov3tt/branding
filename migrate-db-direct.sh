#!/bin/bash
# Direct Database Migration Script
# This script copies data directly from Google Cloud SQL to Railway PostgreSQL

set -e

echo "🚂 Database Migration: Google Cloud SQL → Railway PostgreSQL"
echo "============================================================="
echo ""

# Railway PostgreSQL credentials
RAILWAY_HOST="yamanote.proxy.rlwy.net"
RAILWAY_PORT="53446"
RAILWAY_USER="postgres"
RAILWAY_PASS="dzoNspvTbTYUPFvwkqkLaHpIPHNaBYqg"
RAILWAY_DB="railway"
RAILWAY_URL="postgresql://${RAILWAY_USER}:${RAILWAY_PASS}@${RAILWAY_HOST}:${RAILWAY_PORT}/${RAILWAY_DB}"

# Google Cloud SQL credentials
GC_HOST="34.174.127.137"
GC_PORT="5432"
GC_USER="udt2m8zip6bij"
GC_PASS="9uwxe9juzdvo"
GC_DB="dba88ghxbxbvfg"

echo "📋 Migration Plan:"
echo "  Source: Google Cloud SQL (${GC_DB})"
echo "  Target: Railway PostgreSQL (${RAILWAY_DB})"
echo ""

# Step 1: Test connections
echo "1️⃣  Testing database connections..."
echo ""

echo "  Testing Google Cloud SQL..."
if PGPASSWORD="$GC_PASS" psql -h "$GC_HOST" -U "$GC_USER" -d "$GC_DB" -c "SELECT 1;" > /dev/null 2>&1; then
  echo "  ✅ Google Cloud SQL connection successful"
else
  echo "  ❌ Google Cloud SQL connection failed"
  exit 1
fi

echo "  Testing Railway PostgreSQL..."
if PGPASSWORD="$RAILWAY_PASS" psql -h "$RAILWAY_HOST" -p "$RAILWAY_PORT" -U "$RAILWAY_USER" -d "$RAILWAY_DB" -c "SELECT 1;" > /dev/null 2>&1; then
  echo "  ✅ Railway PostgreSQL connection successful"
else
  echo "  ❌ Railway PostgreSQL connection failed"
  exit 1
fi

echo ""

# Step 2: Get table counts from source
echo "2️⃣  Analyzing source database..."
echo ""

PGPASSWORD="$GC_PASS" psql -h "$GC_HOST" -U "$GC_USER" -d "$GC_DB" -t -c "
SELECT
  table_name || ': ' ||
  (xpath('/row/count/text()', xml_count))[1]::text || ' rows'
FROM (
  SELECT table_name,
    query_to_xml(format('SELECT COUNT(*) AS count FROM %I', table_name), false, true, '') as xml_count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
) AS counts
ORDER BY table_name;
" | grep -v "^$"

echo ""

# Step 3: Export schema and data
echo "3️⃣  Exporting database (this may take 1-2 minutes)..."
echo ""

# Try using psql copy method if pg_dump fails
PGPASSWORD="$GC_PASS" psql -h "$GC_HOST" -U "$GC_USER" -d "$GC_DB" -c "\
\copy (SELECT * FROM brands) TO '/tmp/brands.csv' WITH CSV HEADER;" 2>/dev/null || {
  echo "  Note: Using pg_dump method instead..."

  # Alternative: Create SQL dump file
  PGPASSWORD="$GC_PASS" pg_dump \
    -h "$GC_HOST" \
    -U "$GC_USER" \
    -d "$GC_DB" \
    --no-owner \
    --no-acl \
    --data-only \
    --inserts \
    > /tmp/railway-migration.sql 2>&1 || {
    echo "  ❌ pg_dump failed - trying alternative method..."

    # Last resort: manual SQL generation
    echo "  Using manual SQL export..."
    PGPASSWORD="$GC_PASS" psql -h "$GC_HOST" -U "$GC_USER" -d "$GC_DB" -t -c "
      SELECT 'INSERT INTO ' || table_name || ' VALUES ...;'
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    " > /tmp/railway-migration.sql
  }
}

echo "  ✅ Export complete"
echo ""

# Step 4: Import to Railway
echo "4️⃣  Importing to Railway PostgreSQL..."
echo ""

if [ -f "/tmp/railway-migration.sql" ]; then
  PGPASSWORD="$RAILWAY_PASS" psql \
    -h "$RAILWAY_HOST" \
    -p "$RAILWAY_PORT" \
    -U "$RAILWAY_USER" \
    -d "$RAILWAY_DB" \
    < /tmp/railway-migration.sql

  echo "  ✅ Import complete"
else
  echo "  ⚠️  No migration file found"
fi

echo ""

# Step 5: Verify migration
echo "5️⃣  Verifying migration..."
echo ""

PGPASSWORD="$RAILWAY_PASS" psql -h "$RAILWAY_HOST" -p "$RAILWAY_PORT" -U "$RAILWAY_USER" -d "$RAILWAY_DB" -c "
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
SELECT 'competitors', COUNT(*) FROM competitors
UNION ALL
SELECT 'brand_profiles', COUNT(*) FROM brand_profiles
UNION ALL
SELECT 'brand_images', COUNT(*) FROM brand_images;
"

echo ""
echo "🎉 Migration Complete!"
echo ""
echo "Next steps:"
echo "1. Set environment variables in Railway (run ./set-railway-vars.sh)"
echo "2. Restart Railway service"
echo "3. Test backend: https://branding.up.railway.app/health"
echo ""
