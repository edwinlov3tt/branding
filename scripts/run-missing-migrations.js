#!/usr/bin/env node
// Run missing database migrations on Railway
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function runMigration(filePath, description) {
  console.log(`\n📋 Running migration: ${description}`);
  console.log(`   File: ${path.basename(filePath)}`);

  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    await pool.query(sql);
    console.log(`✅ Migration completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Migration failed:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Running missing database migrations on Railway\n');
  console.log('=' .repeat(60));

  const migrations = [
    {
      file: 'lib/migrations/add_search_query_to_ads.sql',
      description: 'Add search_query column to ad_inspirations table'
    }
  ];

  let successCount = 0;
  let failCount = 0;

  for (const migration of migrations) {
    const success = await runMigration(migration.file, migration.description);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Migration Summary:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📝 Total: ${migrations.length}`);

  await pool.end();

  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
