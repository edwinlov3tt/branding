const Anthropic = require('@anthropic-ai/sdk');
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

async function generateBrandIntelligence(brand_id, url) {
  console.log(`🔍 Analyzing brand: ${url}`);
  const response = await axios.post(
    'https://gtm.edwinlovett.com/api/analyze-brand-enhanced',
    { url, maxPages: 10 },
    { timeout: 110000 }
  );

  const analysis = response.data;
  const result = await pool.query(
    `INSERT INTO brand_intelligence (
      brand_id, brand_name, tagline, mission, vision, values, brand_tone,
      brand_voice, messaging_themes, industry, target_market,
      unique_value_proposition, key_messages, content_themes,
      pages_analyzed, analysis_confidence, raw_analysis
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING *`,
    [
      brand_id, analysis.brand_name || null, analysis.tagline || null,
      analysis.mission || null, analysis.vision || null,
      JSON.stringify(analysis.values || []), analysis.brand_tone || null,
      JSON.stringify(analysis.brand_voice || {}),
      JSON.stringify(analysis.messaging_themes || []), analysis.industry || null,
      analysis.target_market || null, analysis.unique_value_proposition || null,
      JSON.stringify(analysis.key_messages || []),
      JSON.stringify(analysis.content_themes || []),
      analysis.pages_analyzed || 0, analysis.confidence_score || 0.5,
      JSON.stringify(analysis)
    ]
  );
  return result.rows[0];
}

async function generateAudiences(brand_id) {
  const brandResult = await pool.query(
    'SELECT * FROM brand_intelligence WHERE brand_id = $1 ORDER BY created_at DESC LIMIT 1',
    [brand_id]
  );
  const brandIntel = brandResult.rows[0];
  if (!brandIntel) throw new Error('Brand intelligence not found');

  const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY
  });

  const prompt = `Based on this brand, generate 3-5 target audience personas in JSON array format:
Brand: ${brandIntel.brand_name}, Industry: ${brandIntel.industry}, Mission: ${brandIntel.mission}
Return ONLY JSON array: [{"persona_name":"Name","age_range":"25-40","gender":"All","location":"Urban","income_level":"$75k-150k","occupation":"Job","interests":["Interest"],"pain_points":["Pain"],"goals":["Goal"],"buying_behavior":"Behavior","preferred_channels":["Channel"],"description":"Description"}]`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }]
  });

  const responseText = message.content[0].text;
  const personas = JSON.parse(responseText.match(/\[[\s\S]*\]/)[0]);

  const saved = [];
  for (const persona of personas) {
    const result = await pool.query(
      `INSERT INTO target_audiences (brand_id, persona_name, age_range, gender, location, income_level, occupation, interests, pain_points, goals, buying_behavior, preferred_channels, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [brand_id, persona.persona_name, persona.age_range, persona.gender, persona.location, persona.income_level, persona.occupation, JSON.stringify(persona.interests || []), JSON.stringify(persona.pain_points || []), JSON.stringify(persona.goals || []), persona.buying_behavior, JSON.stringify(persona.preferred_channels || []), persona.description]
    );
    saved.push(result.rows[0]);
  }
  return saved;
}

async function analyzeCompetitor(brand_id, competitor_name, facebook_page) {
  const foreplayApiKey = process.env.FOREPLAY_API_KEY;
  if (!foreplayApiKey) throw new Error('Foreplay API key not configured');

  const searchResponse = await axios.get('https://public.api.foreplay.co/api/discovery/ads', {
    headers: { 'Authorization': foreplayApiKey },
    params: { query: competitor_name, limit: 20 },
    timeout: 30000
  });

  const ads = searchResponse.data?.data || [];
  if (ads.length === 0) throw new Error('No ads found');

  const adsForAnalysis = ads.map(ad => ({
    id: ad.id,
    platform: ad.publisher_platform?.[0] || 'Facebook',
    copy: ad.description || '',
    cta: ad.cta_type
  }));

  const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY
  });

  const prompt = `Analyze these ${ads.length} competitor ads. Return ONLY JSON: {"overview":"...","positioning":"...","creative_strategy":{"ad_formats":[],"common_themes":[]},"messaging_analysis":{"tone":"","key_messages":[]},"visual_design_elements":{},"target_audience_insights":{},"performance_indicators":{},"recommendations":[],"key_findings":[]}
Ads: ${JSON.stringify(adsForAnalysis)}`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }]
  });

  const analysis = JSON.parse(message.content[0].text.match(/\{[\s\S]*\}/)[0]);

  const result = await pool.query(
    `INSERT INTO competitor_analyses (brand_id, competitor_name, facebook_page, total_ads_analyzed, ad_ids, ads_data, overview, positioning, creative_strategy, messaging_analysis, visual_design_elements, target_audience_insights, performance_indicators, recommendations, key_findings, analysis_model, analysis_confidence, analysis_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, CURRENT_TIMESTAMP) RETURNING *`,
    [brand_id, competitor_name, facebook_page, ads.length, JSON.stringify(ads.map(a => a.id)), JSON.stringify(adsForAnalysis), analysis.overview, analysis.positioning, JSON.stringify(analysis.creative_strategy || {}), JSON.stringify(analysis.messaging_analysis || {}), JSON.stringify(analysis.visual_design_elements || {}), JSON.stringify(analysis.target_audience_insights || {}), JSON.stringify(analysis.performance_indicators || {}), JSON.stringify(analysis.recommendations || []), JSON.stringify(analysis.key_findings || []), 'claude-3-5-sonnet-20241022', 0.85]
  );
  return result.rows[0];
}

async function generateProducts(brand_id) {
  const brandResult = await pool.query(
    'SELECT * FROM brand_intelligence WHERE brand_id = $1 ORDER BY created_at DESC LIMIT 1',
    [brand_id]
  );
  const brandIntel = brandResult.rows[0];
  if (!brandIntel) throw new Error('Brand intelligence not found');

  const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY
  });

  const prompt = `Generate 3-5 products/services for this brand. Return ONLY JSON array: [{"name":"Product","category":"Category","description":"Description","price":"Price","features":["Feature"]}]
Brand: ${brandIntel.brand_name}, Industry: ${brandIntel.industry}`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }]
  });

  const products = JSON.parse(message.content[0].text.match(/\[[\s\S]*\]/)[0]);

  const saved = [];
  for (const product of products) {
    const result = await pool.query(
      `INSERT INTO products_services (brand_id, name, category, description, price, features)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [brand_id, product.name, product.category, product.description, product.price, JSON.stringify(product.features || [])]
    );
    saved.push(result.rows[0]);
  }
  return saved;
}

async function generateCampaigns(brand_id) {
  const brandResult = await pool.query(
    'SELECT * FROM brand_intelligence WHERE brand_id = $1 ORDER BY created_at DESC LIMIT 1',
    [brand_id]
  );
  const brandIntel = brandResult.rows[0];
  if (!brandIntel) throw new Error('Brand intelligence not found');

  const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY
  });

  const prompt = `Generate 3-5 campaign ideas. Return ONLY JSON array: [{"name":"Campaign","objective":"Objective","target_audience":"Audience","messaging":"Messaging","channels":["Channel"],"budget":"Budget","timeline":"Timeline","kpis":["KPI"],"description":"Description"}]
Brand: ${brandIntel.brand_name}, Industry: ${brandIntel.industry}`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }]
  });

  const campaigns = JSON.parse(message.content[0].text.match(/\[[\s\S]*\]/)[0]);

  const saved = [];
  for (const campaign of campaigns) {
    const result = await pool.query(
      `INSERT INTO campaigns (brand_id, name, objective, target_audience, messaging, channels, budget, timeline, kpis, status, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [brand_id, campaign.name, campaign.objective, campaign.target_audience, campaign.messaging, JSON.stringify(campaign.channels || []), campaign.budget, campaign.timeline, JSON.stringify(campaign.kpis || []), 'draft', campaign.description]
    );
    saved.push(result.rows[0]);
  }
  return saved;
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
    const { action, brand_id, url, competitor_name, facebook_page } = req.body;

    let result;
    switch (action) {
      case 'generate-brand-intelligence':
        if (!brand_id || !url) throw new Error('brand_id and url required');
        result = await generateBrandIntelligence(brand_id, url);
        break;
      case 'generate-audiences':
        if (!brand_id) throw new Error('brand_id required');
        result = await generateAudiences(brand_id);
        break;
      case 'analyze-competitor':
        if (!brand_id || !competitor_name) throw new Error('brand_id and competitor_name required');
        result = await analyzeCompetitor(brand_id, competitor_name, facebook_page);
        break;
      case 'generate-products':
        if (!brand_id) throw new Error('brand_id required');
        result = await generateProducts(brand_id);
        break;
      case 'generate-campaigns':
        if (!brand_id) throw new Error('brand_id required');
        result = await generateCampaigns(brand_id);
        break;
      default:
        res.status(400).json({ success: false, error: 'Invalid action' });
        return;
    }

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('AI generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
