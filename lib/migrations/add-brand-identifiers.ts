import { config } from 'dotenv';

// Load environment variables FIRST before any other imports
config({ path: '.env.local' });

import { query, testConnection, closePool } from '../db';
import slugify from 'slugify';
import { nanoid } from 'nanoid';

function generateSlug(name: string): string {
  return slugify(name, {
    lower: true,
    strict: true,
    trim: true
  });
}

function generateShortId(): string {
  return nanoid(5);
}

async function runMigration() {
  console.log('🔄 Starting brand identifiers migration...');

  // Test connection first
  const isConnected = await testConnection();
  if (!isConnected) {
    console.error('❌ Database connection failed. Please check your credentials.');
    process.exit(1);
  }

  try {
    console.log('📝 Adding new columns to brands table...');

    // Add new columns (if they don't exist)
    await query(`
      ALTER TABLE brands
      ADD COLUMN IF NOT EXISTS slug VARCHAR(255),
      ADD COLUMN IF NOT EXISTS short_id VARCHAR(6),
      ADD COLUMN IF NOT EXISTS industry VARCHAR(100),
      ADD COLUMN IF NOT EXISTS favicon_url TEXT;
    `);

    console.log('✅ Columns added successfully');

    // Get all existing brands without slug/short_id
    console.log('🔍 Fetching existing brands...');
    const result = await query(`
      SELECT id, name
      FROM brands
      WHERE slug IS NULL OR short_id IS NULL
    `);

    if (result.rows.length > 0) {
      console.log(`📝 Generating identifiers for ${result.rows.length} brands...`);

      for (const brand of result.rows) {
        let slug = generateSlug(brand.name);
        let shortId = generateShortId();

        // Check for slug uniqueness
        const existingSlugs = await query('SELECT slug FROM brands WHERE slug = $1', [slug]);
        if (existingSlugs.rows.length > 0) {
          let counter = 1;
          while (true) {
            const uniqueSlug = `${slug}-${counter}`;
            const check = await query('SELECT slug FROM brands WHERE slug = $1', [uniqueSlug]);
            if (check.rows.length === 0) {
              slug = uniqueSlug;
              break;
            }
            counter++;
          }
        }

        // Check for short ID uniqueness
        const existingIds = await query('SELECT short_id FROM brands WHERE short_id = $1', [shortId]);
        if (existingIds.rows.length > 0) {
          shortId = generateShortId();
        }

        // Update the brand
        await query(
          'UPDATE brands SET slug = $1, short_id = $2 WHERE id = $3',
          [slug, shortId, brand.id]
        );

        console.log(`  ✓ ${brand.name} → /${slug}/${shortId}`);
      }
    } else {
      console.log('✅ No brands need identifiers');
    }

    // Add unique constraints and indexes
    console.log('📝 Adding constraints and indexes...');

    // Add unique constraints (PostgreSQL doesn't support IF NOT EXISTS for ADD CONSTRAINT)
    try {
      await query('ALTER TABLE brands ADD CONSTRAINT brands_slug_key UNIQUE (slug);');
    } catch (error: any) {
      if (error.code !== '42P07') { // 42P07 = duplicate_object
        throw error;
      }
    }

    try {
      await query('ALTER TABLE brands ADD CONSTRAINT brands_short_id_key UNIQUE (short_id);');
    } catch (error: any) {
      if (error.code !== '42P07') {
        throw error;
      }
    }

    await query(`
      CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);
      CREATE INDEX IF NOT EXISTS idx_brands_short_id ON brands(short_id);
    `);

    console.log('✅ Brand identifiers migration completed successfully!');

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
