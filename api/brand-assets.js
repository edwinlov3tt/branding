const { Pool } = require('pg');

// Configure database connection
const pool = new Pool({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  ssl: false, // Disable SSL for database connection
});

// Helper function to set CORS headers
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
    // POST - Save brand assets
    if (req.method === 'POST') {
      const { brand_id, assets } = req.body;

      if (!brand_id || !assets) {
        res.status(400).json({
          success: false,
          error: 'Brand ID and assets are required'
        });
        return;
      }

      // Check if table exists, create if not
      await pool.query(`
        CREATE TABLE IF NOT EXISTS brand_assets (
          id SERIAL PRIMARY KEY,
          brand_id UUID UNIQUE REFERENCES brands(id) ON DELETE CASCADE,
          assets JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Insert or update brand assets
      const result = await pool.query(
        `INSERT INTO brand_assets (brand_id, assets)
         VALUES ($1, $2)
         ON CONFLICT (brand_id)
         DO UPDATE SET assets = $2, updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [brand_id, assets]
      );

      res.status(201).json({
        success: true,
        data: result.rows[0]
      });
    }

    // GET - Fetch brand assets by brand_id
    else if (req.method === 'GET') {
      const { brand_id } = req.query;

      if (!brand_id) {
        res.status(400).json({
          success: false,
          error: 'Brand ID is required'
        });
        return;
      }

      // Check if table exists first
      await pool.query(`
        CREATE TABLE IF NOT EXISTS brand_assets (
          id SERIAL PRIMARY KEY,
          brand_id UUID UNIQUE REFERENCES brands(id) ON DELETE CASCADE,
          assets JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const result = await pool.query(
        'SELECT * FROM brand_assets WHERE brand_id = $1',
        [brand_id]
      );

      if (result.rowCount === 0) {
        res.status(404).json({
          success: false,
          error: 'Brand assets not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.rows[0]
      });
    }

    else {
      res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }
  } catch (error) {
    console.error('Brand Assets API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};
