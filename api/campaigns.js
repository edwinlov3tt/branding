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
          'SELECT * FROM campaigns WHERE id = $1',
          [id]
        );
        res.status(200).json({
          success: true,
          data: result.rows[0] || null
        });
      } else if (brand_id) {
        const result = await pool.query(
          'SELECT * FROM campaigns WHERE brand_id = $1 ORDER BY created_at DESC',
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
        objective,
        target_audience,
        messaging,
        channels,
        budget,
        timeline,
        kpis,
        status,
        description
      } = req.body;

      if (!brand_id || !name) {
        res.status(400).json({
          success: false,
          error: 'brand_id and name are required'
        });
        return;
      }

      const result = await pool.query(
        `INSERT INTO campaigns (
          brand_id, name, objective, target_audience, messaging, channels,
          budget, timeline, kpis, status, description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          brand_id,
          name,
          objective,
          target_audience,
          messaging,
          JSON.stringify(channels || []),
          budget,
          timeline,
          JSON.stringify(kpis || []),
          status || 'draft',
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
        name,
        objective,
        target_audience,
        messaging,
        channels,
        budget,
        timeline,
        kpis,
        status,
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
        `UPDATE campaigns
         SET name = COALESCE($2, name),
             objective = COALESCE($3, objective),
             target_audience = COALESCE($4, target_audience),
             messaging = COALESCE($5, messaging),
             channels = COALESCE($6, channels),
             budget = COALESCE($7, budget),
             timeline = COALESCE($8, timeline),
             kpis = COALESCE($9, kpis),
             status = COALESCE($10, status),
             description = COALESCE($11, description),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [
          id,
          name,
          objective,
          target_audience,
          messaging,
          channels ? JSON.stringify(channels) : null,
          budget,
          timeline,
          kpis ? JSON.stringify(kpis) : null,
          status,
          description
        ]
      );

      if (result.rowCount === 0) {
        res.status(404).json({
          success: false,
          error: 'Campaign not found'
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
        'DELETE FROM campaigns WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rowCount === 0) {
        res.status(404).json({
          success: false,
          error: 'Campaign not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Campaign deleted successfully'
      });
    }
    else {
      res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Campaigns error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};
