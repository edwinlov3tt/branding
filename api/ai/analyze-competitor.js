const axios = require('axios');
const Anthropic = require('@anthropic-ai/sdk');
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
    const { brand_id, competitor_name, facebook_page } = req.body;

    if (!brand_id || !competitor_name) {
      res.status(400).json({
        success: false,
        error: 'brand_id and competitor_name are required'
      });
      return;
    }

    const foreplayApiKey = process.env.FOREPLAY_API_KEY;
    if (!foreplayApiKey) {
      res.status(503).json({
        success: false,
        error: 'Foreplay API key not configured'
      });
      return;
    }

    console.log(`🔍 Searching Foreplay for competitor: ${competitor_name}`);

    // Search for competitor ads
    const searchResponse = await axios.get('https://public.api.foreplay.co/api/discovery/ads', {
      headers: {
        'Authorization': foreplayApiKey,
        'Content-Type': 'application/json'
      },
      params: {
        query: competitor_name,
        limit: 20
      },
      timeout: 30000
    });

    const ads = searchResponse.data?.data || [];

    if (ads.length === 0) {
      res.status(404).json({
        success: false,
        error: 'No ads found for this competitor'
      });
      return;
    }

    console.log(`✅ Found ${ads.length} ads. Analyzing with Claude...`);

    // Prepare ad data for analysis
    const adsForAnalysis = ads.map(ad => ({
      id: ad.id,
      platform: ad.publisher_platform?.[0] || 'Facebook',
      copy: ad.description || ad.copy || '',
      cta: ad.cta_type,
      started_running: ad.started_running,
      live: ad.live
    }));

    const anthropic = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY
    });

    const prompt = `Analyze these ${ads.length} competitor ads and provide a comprehensive analysis in JSON format.

Competitor: ${competitor_name}
Ads Data:
${JSON.stringify(adsForAnalysis, null, 2)}

Return ONLY valid JSON with this structure:
{
  "overview": "High-level summary of competitor's advertising strategy",
  "positioning": "How they position themselves in the market",
  "creative_strategy": {
    "ad_formats": ["Image", "Video", "Carousel"],
    "common_themes": ["Theme 1", "Theme 2"],
    "creative_patterns": ["Pattern 1", "Pattern 2"]
  },
  "messaging_analysis": {
    "tone": "Professional, friendly, urgent",
    "key_messages": ["Message 1", "Message 2"],
    "ctas": ["Shop Now", "Learn More"],
    "value_propositions": ["Prop 1", "Prop 2"]
  },
  "visual_design_elements": {
    "imagery_style": "Modern, minimalist",
    "branding_consistency": "High/Medium/Low"
  },
  "target_audience_insights": {
    "demographics": ["25-45 years", "Urban professionals"],
    "psychographics": ["Value quality", "Tech-savvy"],
    "pain_points": ["Pain 1", "Pain 2"]
  },
  "performance_indicators": {
    "ad_frequency": "How often they run ads",
    "timing": "When they advertise most"
  },
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "key_findings": ["Finding 1", "Finding 2"]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 8000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    // Save analysis to database
    const result = await pool.query(
      `INSERT INTO competitor_analyses (
        brand_id, competitor_name, facebook_page, total_ads_analyzed,
        ad_ids, ads_data, overview, positioning, creative_strategy,
        messaging_analysis, visual_design_elements, target_audience_insights,
        performance_indicators, recommendations, key_findings,
        analysis_model, analysis_confidence, analysis_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        brand_id,
        competitor_name,
        facebook_page,
        ads.length,
        JSON.stringify(ads.map(a => a.id)),
        JSON.stringify(adsForAnalysis),
        analysis.overview,
        analysis.positioning,
        JSON.stringify(analysis.creative_strategy || {}),
        JSON.stringify(analysis.messaging_analysis || {}),
        JSON.stringify(analysis.visual_design_elements || {}),
        JSON.stringify(analysis.target_audience_insights || {}),
        JSON.stringify(analysis.performance_indicators || {}),
        JSON.stringify(analysis.recommendations || []),
        JSON.stringify(analysis.key_findings || []),
        'claude-3-5-sonnet-20241022',
        0.85
      ]
    );

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Competitor analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze competitor',
      message: error.response?.data?.message || error.message
    });
  }
};
