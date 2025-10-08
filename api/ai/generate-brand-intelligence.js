const axios = require('axios');
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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const { brand_id, url } = req.body;

    if (!brand_id || !url) {
      res.status(400).json({
        success: false,
        error: 'brand_id and url are required'
      });
      return;
    }

    console.log(`🔍 Analyzing brand: ${url}`);

    // Call gtm.edwinlovett.com API
    const response = await axios.post(
      'https://gtm.edwinlovett.com/api/analyze-brand-enhanced',
      { url, maxPages: 10 },
      { timeout: 110000 } // 110 seconds (within Vercel's 120s limit)
    );

    const analysis = response.data;

    // Save to database
    const result = await pool.query(
      `INSERT INTO brand_intelligence (
        brand_id, brand_name, tagline, mission, vision, values, brand_tone,
        brand_voice, messaging_themes, industry, target_market,
        unique_value_proposition, key_messages, content_themes,
        pages_analyzed, analysis_confidence, raw_analysis
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        brand_id,
        analysis.brand_name || null,
        analysis.tagline || null,
        analysis.mission || null,
        analysis.vision || null,
        JSON.stringify(analysis.values || []),
        analysis.brand_tone || null,
        JSON.stringify(analysis.brand_voice || {}),
        JSON.stringify(analysis.messaging_themes || []),
        analysis.industry || null,
        analysis.target_market || null,
        analysis.unique_value_proposition || null,
        JSON.stringify(analysis.key_messages || []),
        JSON.stringify(analysis.content_themes || []),
        analysis.pages_analyzed || 0,
        analysis.confidence_score || 0.5,
        JSON.stringify(analysis)
      ]
    );

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Brand intelligence generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate brand intelligence',
      message: error.response?.data?.message || error.message
    });
  }
};
