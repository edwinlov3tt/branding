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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // GET - Fetch curated ads
    if (req.method === 'GET') {
      const { platform, niche, limit = 50, search } = req.query;

      let query = `
        SELECT * FROM ad_inspirations
        WHERE is_curated = true
      `;
      const params = [];
      let paramCount = 0;

      if (platform && platform !== 'all') {
        paramCount++;
        query += ` AND platform = $${paramCount}`;
        params.push(platform);
      }

      if (niche && niche !== 'all') {
        paramCount++;
        query += ` AND niche = $${paramCount}`;
        params.push(niche);
      }

      if (search) {
        paramCount++;
        query += ` AND (
          LOWER(advertiser_name) LIKE LOWER($${paramCount})
          OR LOWER(ad_copy) LIKE LOWER($${paramCount})
          OR LOWER(CAST(ad_data AS TEXT)) LIKE LOWER($${paramCount})
        )`;
        params.push(`%${search}%`);
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1}`;
      params.push(parseInt(limit));

      const result = await pool.query(query, params);

      res.status(200).json({
        success: true,
        data: result.rows
      });
    }
    // POST - Save ad inspiration
    else if (req.method === 'POST') {
      const {
        brand_id,
        foreplay_ad_id,
        ad_data,
        thumbnail_url,
        video_url,
        platform,
        advertiser_name,
        niche,
        ad_copy
      } = req.body;

      if (!brand_id) {
        res.status(400).json({
          success: false,
          error: 'brand_id is required'
        });
        return;
      }

      // Check if ad already saved
      const checkResult = await pool.query(
        'SELECT id FROM ad_inspirations WHERE brand_id = $1 AND foreplay_ad_id = $2',
        [brand_id, foreplay_ad_id]
      );

      if (checkResult.rows.length > 0) {
        res.status(200).json({
          success: true,
          message: 'Ad already saved',
          data: checkResult.rows[0]
        });
        return;
      }

      const result = await pool.query(
        `INSERT INTO ad_inspirations
         (brand_id, foreplay_ad_id, ad_data, thumbnail_url, video_url, platform, advertiser_name, niche, ad_copy, saved_by_brand_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [brand_id, foreplay_ad_id, ad_data, thumbnail_url, video_url, platform, advertiser_name, niche, ad_copy, brand_id]
      );

      res.status(201).json({
        success: true,
        data: result.rows[0]
      });
    }
    else {
      res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Ad inspirations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process ad inspirations',
      message: error.message
    });
  }
};
