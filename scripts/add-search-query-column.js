const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const pool = new Pool({
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT,
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('🔄 Adding search_query column to ad_inspirations table...');
    
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../lib/migrations/add_search_query_to_ads.sql'),
      'utf8'
    );
    
    await client.query(migrationSQL);
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
