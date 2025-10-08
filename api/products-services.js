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
          'SELECT * FROM products_services WHERE id = $1',
          [id]
        );
        res.status(200).json({
          success: true,
          data: result.rows[0] || null
        });
      } else if (brand_id) {
        const result = await pool.query(
          'SELECT * FROM products_services WHERE brand_id = $1 ORDER BY created_at DESC',
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
      const { brand_id, name, category, description, price, features, image_url } = req.body;

      if (!brand_id || !name) {
        res.status(400).json({
          success: false,
          error: 'brand_id and name are required'
        });
        return;
      }

      const result = await pool.query(
        `INSERT INTO products_services (brand_id, name, category, description, price, features, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [brand_id, name, category, description, price, JSON.stringify(features || []), image_url]
      );

      res.status(201).json({
        success: true,
        data: result.rows[0]
      });
    }
    else if (req.method === 'PUT') {
      const { id, name, category, description, price, features, image_url } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'id is required'
        });
        return;
      }

      const result = await pool.query(
        `UPDATE products_services
         SET name = COALESCE($2, name),
             category = COALESCE($3, category),
             description = COALESCE($4, description),
             price = COALESCE($5, price),
             features = COALESCE($6, features),
             image_url = COALESCE($7, image_url),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [id, name, category, description, price, features ? JSON.stringify(features) : null, image_url]
      );

      if (result.rowCount === 0) {
        res.status(404).json({
          success: false,
          error: 'Product/service not found'
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
        'DELETE FROM products_services WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rowCount === 0) {
        res.status(404).json({
          success: false,
          error: 'Product/service not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Product/service deleted successfully'
      });
    }
    else {
      res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Products/services error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};
