import { config } from 'dotenv';

// Load environment variables FIRST before any other imports
config({ path: '.env.local' });

import { readFileSync } from 'fs';
import { join } from 'path';
import { query, testConnection, closePool } from './db';

async function runMigration() {
  console.log('🔄 Starting database migration...');

  // Test connection first
  const isConnected = await testConnection();
  if (!isConnected) {
    console.error('❌ Database connection failed. Please check your credentials.');
    console.error('Note: If using "localhost", make sure PostgreSQL is running locally.');
    console.error('For Vercel deployment, you need the actual SiteGround remote host.');
    process.exit(1);
  }

  try {
    // Read schema file
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    // Execute schema
    console.log('📝 Executing schema...');
    await query(schema);

    console.log('✅ Database migration completed successfully!');
    console.log('\nCreated tables:');
    console.log('  - brands');
    console.log('  - brand_data');
    console.log('  - target_audiences');
    console.log('  - products_services');
    console.log('  - campaigns');
    console.log('  - competitors');
    console.log('  - templates');
    console.log('  - generations');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

// Run if called directly
if (require.main === module) {
  runMigration();
}

export { runMigration };
