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
          'SELECT * FROM target_audiences WHERE id = $1',
          [id]
        );
        res.status(200).json({
          success: true,
          data: result.rows[0] || null
        });
      } else if (brand_id) {
        const result = await pool.query(
          'SELECT * FROM target_audiences WHERE brand_id = $1 ORDER BY created_at DESC',
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
        persona_name,
        age_range,
        gender,
        location,
        income_level,
        occupation,
        interests,
        pain_points,
        goals,
        buying_behavior,
        preferred_channels,
        description
      } = req.body;

      if (!brand_id || !persona_name) {
        res.status(400).json({
          success: false,
          error: 'brand_id and persona_name are required'
        });
        return;
      }

      const result = await pool.query(
        `INSERT INTO target_audiences (
          brand_id, persona_name, age_range, gender, location, income_level,
          occupation, interests, pain_points, goals, buying_behavior,
          preferred_channels, description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          brand_id,
          persona_name,
          age_range,
          gender,
          location,
          income_level,
          occupation,
          JSON.stringify(interests || []),
          JSON.stringify(pain_points || []),
          JSON.stringify(goals || []),
          buying_behavior,
          JSON.stringify(preferred_channels || []),
          description
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
        persona_name,
        age_range,
        gender,
        location,
        income_level,
        occupation,
        interests,
        pain_points,
        goals,
        buying_behavior,
        preferred_channels,
        description
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
         SET persona_name = COALESCE($2, persona_name),
             age_range = COALESCE($3, age_range),
             gender = COALESCE($4, gender),
             location = COALESCE($5, location),
             income_level = COALESCE($6, income_level),
             occupation = COALESCE($7, occupation),
             interests = COALESCE($8, interests),
             pain_points = COALESCE($9, pain_points),
             goals = COALESCE($10, goals),
             buying_behavior = COALESCE($11, buying_behavior),
             preferred_channels = COALESCE($12, preferred_channels),
             description = COALESCE($13, description),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [
          id,
          persona_name,
          age_range,
          gender,
          location,
          income_level,
          occupation,
          interests ? JSON.stringify(interests) : null,
          pain_points ? JSON.stringify(pain_points) : null,
          goals ? JSON.stringify(goals) : null,
          buying_behavior,
          preferred_channels ? JSON.stringify(preferred_channels) : null,
          description
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
