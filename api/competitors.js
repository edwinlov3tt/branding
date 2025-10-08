const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  ssl: false,
});

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      const { brand_id, id } = req.query;

      if (id) {
        const result = await pool.query(
          'SELECT * FROM competitors WHERE id = $1',
          [id]
        );
        res.status(200).json({
          success: true,
          data: result.rows[0] || null
        });
      } else if (brand_id) {
        const result = await pool.query(
          'SELECT * FROM competitors WHERE brand_id = $1 ORDER BY created_at DESC',
          [brand_id]
        );
        res.status(200).json({
          success: true,
          data: result.rows
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'brand_id or id is required'
        });
      }
    }
    else if (req.method === 'POST') {
      const {
        brand_id,
        name,
        website,
        description,
        strengths,
        weaknesses,
        market_position
      } = req.body;

      if (!brand_id || !name) {
        res.status(400).json({
          success: false,
          error: 'brand_id and name are required'
        });
        return;
      }

      const result = await pool.query(
        `INSERT INTO competitors (
          brand_id, name, website, description, strengths, weaknesses, market_position
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          brand_id,
          name,
          website,
          description,
          JSON.stringify(strengths || []),
          JSON.stringify(weaknesses || []),
          market_position
        ]
      );

      res.status(201).json({
        success: true,
        data: result.rows[0]
      });
    }
    else if (req.method === 'PUT') {
      const {
        id,
        name,
        website,
        description,
        strengths,
        weaknesses,
        market_position
      } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'id is required'
        });
        return;
      }

      const result = await pool.query(
        `UPDATE competitors
         SET name = COALESCE($2, name),
             website = COALESCE($3, website),
             description = COALESCE($4, description),
             strengths = COALESCE($5, strengths),
             weaknesses = COALESCE($6, weaknesses),
             market_position = COALESCE($7, market_position),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [
          id,
          name,
          website,
          description,
          strengths ? JSON.stringify(strengths) : null,
          weaknesses ? JSON.stringify(weaknesses) : null,
          market_position
        ]
      );

      if (result.rowCount === 0) {
        res.status(404).json({
          success: false,
          error: 'Competitor not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.rows[0]
      });
    }
    else if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'id is required'
        });
        return;
      }

      const result = await pool.query(
        'DELETE FROM competitors WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rowCount === 0) {
        res.status(404).json({
          success: false,
          error: 'Competitor not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Competitor deleted successfully'
      });
    }
    else {
      res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Competitors error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};
