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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
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
  } catch (error) {
    console.error('Failed to fetch curated ads:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ad inspirations',
      message: error.message
    });
  }
};
