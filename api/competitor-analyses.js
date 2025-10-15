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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
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
        // Get single analysis
        const result = await pool.query(
          'SELECT * FROM competitor_analyses WHERE id = $1',
          [id]
        );
        res.status(200).json({
          success: true,
          data: result.rows[0] || null
        });
      } else if (brand_id) {
        // Get all analyses for brand
        const result = await pool.query(
          'SELECT * FROM competitor_analyses WHERE brand_id = $1 ORDER BY created_at DESC',
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
        competitor_id,
        competitor_name,
        competitor_website,
        facebook_page,
        total_ads_analyzed,
        ad_ids,
        ads_data,
        overview,
        positioning,
        creative_strategy,
        messaging_analysis,
        visual_design_elements,
        target_audience_insights,
        performance_indicators,
        recommendations,
        key_findings,
        analysis_model,
        analysis_confidence,
        analysis_start_date,
        analysis_end_date
      } = req.body;

      if (!brand_id || !competitor_name) {
        res.status(400).json({
          success: false,
          error: 'brand_id and competitor_name are required'
        });
        return;
      }

      const result = await pool.query(
        `INSERT INTO competitor_analyses (
          brand_id, competitor_id, competitor_name, competitor_website,
          facebook_page, total_ads_analyzed, ad_ids, ads_data, overview,
          positioning, creative_strategy, messaging_analysis,
          visual_design_elements, target_audience_insights,
          performance_indicators, recommendations, key_findings,
          analysis_model, analysis_confidence, analysis_date,
          analysis_start_date, analysis_end_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, CURRENT_TIMESTAMP, $20, $21)
        RETURNING *`,
        [
          brand_id,
          competitor_id,
          competitor_name,
          competitor_website,
          facebook_page,
          total_ads_analyzed || 0,
          JSON.stringify(ad_ids || []),
          JSON.stringify(ads_data || []),
          overview,
          positioning,
          JSON.stringify(creative_strategy || {}),
          JSON.stringify(messaging_analysis || {}),
          JSON.stringify(visual_design_elements || {}),
          JSON.stringify(target_audience_insights || {}),
          JSON.stringify(performance_indicators || {}),
          JSON.stringify(recommendations || []),
          JSON.stringify(key_findings || []),
          analysis_model,
          analysis_confidence,
          analysis_start_date,
          analysis_end_date
        ]
      );

      res.status(201).json({
        success: true,
        data: result.rows[0]
      });
    }
    else if (req.method === 'DELETE') {
      // Extract id from URL path (e.g., /api/competitor-analyses/uuid)
      let id = req.query.id;

      if (!id && req.url) {
        const urlParts = req.url.split('/');
        const lastPart = urlParts[urlParts.length - 1];
        // Remove query string if present
        id = lastPart.split('?')[0];
      }

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'id is required'
        });
        return;
      }

      const result = await pool.query(
        'DELETE FROM competitor_analyses WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rowCount === 0) {
        res.status(404).json({
          success: false,
          error: 'Analysis not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Analysis deleted successfully'
      });
    }
    else {
      res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Competitor analyses error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};
