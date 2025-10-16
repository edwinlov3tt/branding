const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  try {
    console.log('Running migration: add_brand_description');

    await pool.query(`
      ALTER TABLE brands
      ADD COLUMN IF NOT EXISTS description TEXT;
    `);

    console.log('✅ Migration completed successfully');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

migrate();
