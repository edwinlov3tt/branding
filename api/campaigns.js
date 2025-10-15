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
        marketing_objectives,
        other_objective,
        target_audience_ids,
        channels,
        start_date,
        end_date,
        product_service_id,
        status
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
          brand_id, name, objective, marketing_objectives, other_objective,
          target_audience_ids, channels, start_date, end_date, product_service_id, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          brand_id,
          name,
          objective || null,
          marketing_objectives || [],
          other_objective || null,
          target_audience_ids || [],
          channels || [],
          start_date || null,
          end_date || null,
          product_service_id || null,
          status || 'draft'
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
        marketing_objectives,
        other_objective,
        target_audience_ids,
        channels,
        start_date,
        end_date,
        product_service_id,
        status
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
             marketing_objectives = COALESCE($4, marketing_objectives),
             other_objective = COALESCE($5, other_objective),
             target_audience_ids = COALESCE($6, target_audience_ids),
             channels = COALESCE($7, channels),
             start_date = COALESCE($8, start_date),
             end_date = COALESCE($9, end_date),
             product_service_id = COALESCE($10, product_service_id),
             status = COALESCE($11, status),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [
          id,
          name,
          objective,
          marketing_objectives || null,
          other_objective,
          target_audience_ids || null,
          channels || null,
          start_date,
          end_date,
          product_service_id,
          status
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
