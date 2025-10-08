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
    if (req.method === 'GET') {
      const { brand_id } = req.query;

      if (!brand_id) {
        res.status(400).json({ success: false, error: 'brand_id is required' });
        return;
      }

      const result = await pool.query(
        'SELECT * FROM brand_intelligence WHERE brand_id = $1 ORDER BY created_at DESC LIMIT 1',
        [brand_id]
      );

      res.status(200).json({
        success: true,
        data: result.rows[0] || null
      });
    }
    else if (req.method === 'POST') {
      const {
        brand_id,
        brand_name,
        tagline,
        mission,
        vision,
        values,
        brand_tone,
        brand_voice,
        messaging_themes,
        industry,
        target_market,
        unique_value_proposition,
        key_messages,
        content_themes,
        pages_analyzed,
        analysis_confidence,
        raw_analysis
      } = req.body;

      if (!brand_id) {
        res.status(400).json({ success: false, error: 'brand_id is required' });
        return;
      }

      const result = await pool.query(
        `INSERT INTO brand_intelligence (
          brand_id, brand_name, tagline, mission, vision, values, brand_tone,
          brand_voice, messaging_themes, industry, target_market,
          unique_value_proposition, key_messages, content_themes,
          pages_analyzed, analysis_confidence, raw_analysis
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *`,
        [
          brand_id, brand_name, tagline, mission, vision,
          JSON.stringify(values || []),
          brand_tone,
          JSON.stringify(brand_voice || {}),
          JSON.stringify(messaging_themes || []),
          industry,
          target_market,
          unique_value_proposition,
          JSON.stringify(key_messages || []),
          JSON.stringify(content_themes || []),
          pages_analyzed || 0,
          analysis_confidence,
          JSON.stringify(raw_analysis || {})
        ]
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
    console.error('Brand intelligence error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};
