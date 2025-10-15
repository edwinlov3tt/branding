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
      console.log('📋 Target Audiences GET - Query params:', { brand_id, id });

      if (id) {
        console.log(`🔍 Fetching single audience with id: ${id}`);
        const result = await pool.query(
          'SELECT * FROM target_audiences WHERE id = $1',
          [id]
        );
        console.log(`✅ Found ${result.rows.length} audience(s)`);
        res.status(200).json({
          success: true,
          data: result.rows[0] || null
        });
      } else if (brand_id) {
        console.log(`🔍 Fetching all audiences for brand: ${brand_id}`);
        const result = await pool.query(
          'SELECT * FROM target_audiences WHERE brand_id = $1 ORDER BY created_at DESC',
          [brand_id]
        );
        console.log(`✅ Found ${result.rows.length} audience(s)`);
        res.status(200).json({
          success: true,
          data: result.rows
        });
      } else {
        console.log('❌ Missing required parameter: brand_id or id');
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
        description,
        demographics,
        interests,
        pain_points,
        goals,
        budget_range,
        channels
      } = req.body;

      if (!brand_id || !name) {
        res.status(400).json({
          success: false,
          error: 'brand_id and name are required'
        });
        return;
      }

      const result = await pool.query(
        `INSERT INTO target_audiences (
          brand_id, name, description, demographics, interests,
          pain_points, goals, budget_range, channels
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          brand_id,
          name,
          description,
          demographics,
          JSON.stringify(interests || []),
          JSON.stringify(pain_points || []),
          JSON.stringify(goals || []),
          budget_range,
          JSON.stringify(channels || [])
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
        description,
        demographics,
        interests,
        pain_points,
        goals,
        budget_range,
        channels
      } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'id is required'
        });
        return;
      }

      const result = await pool.query(
        `UPDATE target_audiences
         SET name = COALESCE($2, name),
             description = COALESCE($3, description),
             demographics = COALESCE($4, demographics),
             interests = COALESCE($5, interests),
             pain_points = COALESCE($6, pain_points),
             goals = COALESCE($7, goals),
             budget_range = COALESCE($8, budget_range),
             channels = COALESCE($9, channels),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [
          id,
          name,
          description,
          demographics,
          interests ? JSON.stringify(interests) : null,
          pain_points ? JSON.stringify(pain_points) : null,
          goals ? JSON.stringify(goals) : null,
          budget_range,
          channels ? JSON.stringify(channels) : null
        ]
      );

      if (result.rowCount === 0) {
        res.status(404).json({
          success: false,
          error: 'Target audience not found'
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
        'DELETE FROM target_audiences WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rowCount === 0) {
        res.status(404).json({
          success: false,
          error: 'Target audience not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Target audience deleted successfully'
      });
    }
    else {
      res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Target audiences error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};
