const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  ssl: false,
});

async function runMigrations() {
  const client = await pool.connect();

  try {
    console.log('🔄 Running database migrations...\n');

    // Read and execute migration file
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../lib/migrations/add_ad_inspirations.sql'),
      'utf8'
    );

    console.log('📝 Creating ad_inspirations table...');
    await client.query(migrationSQL);
    console.log('✅ Table created successfully\n');

    // Read and execute seed file
    const seedSQL = fs.readFileSync(
      path.join(__dirname, '../lib/seeds/seed_curated_ads.sql'),
      'utf8'
    );

    console.log('🌱 Seeding curated ads...');
    await client.query(seedSQL);
    console.log('✅ Seeded 20 curated ads successfully\n');

    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
