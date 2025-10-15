#!/bin/bash
# Copy data from Google Cloud SQL to Railway PostgreSQL

set -e

echo "📦 Copying Data: Google Cloud SQL → Railway PostgreSQL"
echo "======================================================"
echo ""

# Source and destination
SRC_HOST="34.174.127.137"
SRC_PORT="5432"
SRC_USER="udt2m8zip6bij"
SRC_PASS="9uwxe9juzdvo"
SRC_DB="dba88ghxbxbvfg"

DST_HOST="yamanote.proxy.rlwy.net"
DST_PORT="53446"
DST_USER="postgres"
DST_PASS="dzoNspvTbTYUPFvwkqkLaHpIPHNaBYqg"
DST_DB="railway"

# Tables to copy (in dependency order - parents before children)
TABLES=(
  "brands"
  "brand_data"
  "brand_profiles"
  "brand_images"
  "brand_settings"
  "brand_intelligence"
  "products_services"
  "target_audiences"
  "campaigns"
  "competitors"
  "competitor_analyses"
  "ad_inspirations"
  "ai_jobs"
  "generated_creatives"
  "ad_copy_variants"
  "templates"
  "generations"
)

total=0

for table in "${TABLES[@]}"; do
  echo "📋 Table: $table"

  # Get row count
  count=$(PGPASSWORD="$SRC_PASS" psql -h "$SRC_HOST" -U "$SRC_USER" -d "$SRC_DB" -t -c "SELECT COUNT(*) FROM $table" 2>/dev/null | tr -d ' ')

  if [ -z "$count" ]; then
    echo "  ⚠️  Table doesn't exist in source, skipping..."
    echo ""
    continue
  fi

  echo "  Source rows: $count"

  if [ "$count" -eq 0 ]; then
    echo "  ✓ Empty table, skipping..."
    echo ""
    continue
  fi

  # Copy data using COPY command (faster than INSERT)
  echo "  Copying data..."

  # Export to temp file
  PGPASSWORD="$SRC_PASS" psql -h "$SRC_HOST" -U "$SRC_USER" -d "$SRC_DB" -c "\COPY $table TO '/tmp/${table}.csv' WITH CSV HEADER" 2>/dev/null || {
    # If COPY fails, try generating INSERT statements
    echo "  Using INSERT method..."
    PGPASSWORD="$SRC_PASS" pg_dump \
      -h "$SRC_HOST" \
      -U "$SRC_USER" \
      -d "$SRC_DB" \
      -t "$table" \
      --data-only \
      --column-inserts \
      --no-owner 2>&1 | \
    PGPASSWORD="$DST_PASS" psql \
      -h "$DST_HOST" \
      -p "$DST_PORT" \
      -U "$DST_USER" \
      -d "$DST_DB" \
      -q 2>&1 | grep -c INSERT || echo "0"

    # Verify
    new_count=$(PGPASSWORD="$DST_PASS" psql -h "$DST_HOST" -p "$DST_PORT" -U "$DST_USER" -d "$DST_DB" -t -c "SELECT COUNT(*) FROM $table" | tr -d ' ')
    echo "  ✓ Copied $new_count rows"
    total=$((total + new_count))
    echo ""
    continue
  }

  # Import from temp file
  if [ -f "/tmp/${table}.csv" ]; then
    PGPASSWORD="$DST_PASS" psql -h "$DST_HOST" -p "$DST_PORT" -U "$DST_USER" -d "$DST_DB" -c "\COPY $table FROM '/tmp/${table}.csv' WITH CSV HEADER" 2>/dev/null && {
      rm "/tmp/${table}.csv"
      echo "  ✓ Copied $count rows"
      total=$((total + count))
    } || {
      echo "  ❌ Import failed"
    }
  fi

  echo ""
done

echo "======================================================"
echo "🎉 Migration complete! Total rows copied: $total"
echo ""
