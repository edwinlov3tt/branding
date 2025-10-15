const { Pool } = require('pg');
const slugify = require('slugify');
const { nanoid } = require('nanoid');

// Configure database connection
const pool = new Pool({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  ssl: false, // Disable SSL for database connection
});

// Utility functions for slug and short ID generation
function generateSlug(name) {
  return slugify(name, {
    lower: true,
    strict: true,
    trim: true
  });
}

function generateShortId() {
  return nanoid(5);
}

// Helper function to set CORS headers
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async (req, res) => {
  // Set CORS headers
  setCorsHeaders(res);

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // GET - Fetch all brands
    if (req.method === 'GET') {
      const result = await pool.query(`
        SELECT
          b.*,
          (SELECT COUNT(*) FROM target_audiences WHERE brand_id = b.id) as audience_count,
          (SELECT COUNT(*) FROM products_services WHERE brand_id = b.id) as product_count,
          (SELECT COUNT(*) FROM campaigns WHERE brand_id = b.id) as campaign_count,
          (SELECT COUNT(*) FROM competitors WHERE brand_id = b.id) as competitor_count,
          (SELECT COUNT(*) FROM templates WHERE brand_id = b.id) as template_count,
          (SELECT COUNT(*) FROM generations WHERE brand_id = b.id) as generation_count
        FROM brands b
        ORDER BY b.created_at DESC
      `);

      res.status(200).json({
        success: true,
        data: result.rows
      });
    }

    // POST - Create new brand
    else if (req.method === 'POST') {
      const { name, website, logo_url, primary_color, industry, favicon_url } = req.body;

      if (!name) {
        res.status(400).json({
          success: false,
          error: 'Brand name is required'
        });
        return;
      }

      // Generate slug and short ID
      let slug = generateSlug(name);
      let shortId = generateShortId();

      // Check for slug uniqueness and regenerate if needed
      const existingSlugs = await pool.query('SELECT slug FROM brands WHERE slug = $1', [slug]);
      if (existingSlugs.rows.length > 0) {
        let counter = 1;
        let uniqueSlug = slug;
        while (true) {
          uniqueSlug = `${slug}-${counter}`;
          const check = await pool.query('SELECT slug FROM brands WHERE slug = $1', [uniqueSlug]);
          if (check.rows.length === 0) {
            slug = uniqueSlug;
            break;
          }
          counter++;
        }
      }

      // Check for short ID uniqueness (very unlikely collision but just in case)
      const existingIds = await pool.query('SELECT short_id FROM brands WHERE short_id = $1', [shortId]);
      if (existingIds.rows.length > 0) {
        shortId = generateShortId(); // Generate a new one
      }

      const result = await pool.query(
        `INSERT INTO brands (name, website, logo_url, primary_color, slug, short_id, industry, favicon_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [name, website, logo_url, primary_color, slug, shortId, industry, favicon_url]
      );

      res.status(201).json({
        success: true,
        data: result.rows[0]
      });
    }

    // PUT - Update brand
    else if (req.method === 'PUT') {
      const { id, name, website, logo_url, primary_color } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Brand ID is required'
        });
        return;
      }

      const result = await pool.query(
        `UPDATE brands
         SET name = COALESCE($2, name),
             website = COALESCE($3, website),
             logo_url = COALESCE($4, logo_url),
             primary_color = COALESCE($5, primary_color),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [id, name, website, logo_url, primary_color]
      );

      if (result.rowCount === 0) {
        res.status(404).json({
          success: false,
          error: 'Brand not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.rows[0]
      });
    }

    // DELETE - Delete brand
    else if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Brand ID is required'
        });
        return;
      }

      const result = await pool.query(
        'DELETE FROM brands WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rowCount === 0) {
        res.status(404).json({
          success: false,
          error: 'Brand not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Brand deleted successfully'
      });
    }

    else {
      res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};
