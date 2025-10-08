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
    const { brand_id } = req.body;

    if (!brand_id) {
      res.status(400).json({
        success: false,
        error: 'brand_id is required'
      });
      return;
    }

    // Get brand intelligence and audiences
    const brandResult = await pool.query(
      'SELECT * FROM brand_intelligence WHERE brand_id = $1 ORDER BY created_at DESC LIMIT 1',
      [brand_id]
    );

    const audienceResult = await pool.query(
      'SELECT * FROM target_audiences WHERE brand_id = $1 LIMIT 3',
      [brand_id]
    );

    const brandIntel = brandResult.rows[0];
    const audiences = audienceResult.rows;

    if (!brandIntel) {
      res.status(404).json({
        success: false,
        error: 'Brand intelligence not found. Please generate it first.'
      });
      return;
    }

    const anthropic = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY
    });

    const prompt = `Generate 3-5 marketing campaign ideas based on this brand and audience information in JSON format.

Brand Information:
- Name: ${brandIntel.brand_name}
- Industry: ${brandIntel.industry}
- Mission: ${brandIntel.mission}
- Key Messages: ${JSON.stringify(brandIntel.key_messages)}

Target Audiences:
${audiences.map(a => `- ${a.persona_name}: ${a.description}`).join('\n')}

Return ONLY a JSON array with this structure:
[
  {
    "name": "Campaign Name",
    "objective": "Awareness/Consideration/Conversion",
    "target_audience": "Target audience description",
    "messaging": "Key messaging and value prop",
    "channels": ["Facebook", "Instagram", "Email"],
    "budget": "Suggested budget range",
    "timeline": "Suggested duration",
    "kpis": ["KPI 1", "KPI 2", "KPI 3"],
    "description": "Detailed campaign description"
  }
]`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    const campaigns = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    // Save campaigns to database
    const savedCampaigns = [];
    for (const campaign of campaigns) {
      const result = await pool.query(
        `INSERT INTO campaigns (
          brand_id, name, objective, target_audience, messaging, channels,
          budget, timeline, kpis, status, description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          brand_id,
          campaign.name,
          campaign.objective,
          campaign.target_audience,
          campaign.messaging,
          JSON.stringify(campaign.channels || []),
          campaign.budget,
          campaign.timeline,
          JSON.stringify(campaign.kpis || []),
          'draft',
          campaign.description
        ]
      );
      savedCampaigns.push(result.rows[0]);
    }

    res.status(200).json({
      success: true,
      data: savedCampaigns
    });
  } catch (error) {
    console.error('Campaigns generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate campaigns',
      message: error.message
    });
  }
};
