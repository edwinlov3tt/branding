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

    // Get brand intelligence
    const brandResult = await pool.query(
      'SELECT * FROM brand_intelligence WHERE brand_id = $1 ORDER BY created_at DESC LIMIT 1',
      [brand_id]
    );

    const brandIntel = brandResult.rows[0];

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

    const prompt = `Based on this brand information, generate 3-5 distinct target audience personas in JSON format.

Brand Information:
- Name: ${brandIntel.brand_name}
- Industry: ${brandIntel.industry}
- Mission: ${brandIntel.mission}
- Target Market: ${brandIntel.target_market}
- Value Proposition: ${brandIntel.unique_value_proposition}

Return ONLY a JSON array of personas with this structure:
[
  {
    "persona_name": "Tech-Savvy Professional",
    "age_range": "25-40",
    "gender": "All",
    "location": "Urban areas",
    "income_level": "$75,000-$150,000",
    "occupation": "Software Engineer, Product Manager",
    "interests": ["Technology", "Innovation", "Productivity"],
    "pain_points": ["Limited time", "Need for efficiency"],
    "goals": ["Career advancement", "Work-life balance"],
    "buying_behavior": "Research-driven, values quality",
    "preferred_channels": ["LinkedIn", "Tech blogs", "Email"],
    "description": "Brief description..."
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
    const personas = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    // Save personas to database
    const savedPersonas = [];
    for (const persona of personas) {
      const result = await pool.query(
        `INSERT INTO target_audiences (
          brand_id, persona_name, age_range, gender, location, income_level,
          occupation, interests, pain_points, goals, buying_behavior,
          preferred_channels, description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          brand_id,
          persona.persona_name,
          persona.age_range,
          persona.gender,
          persona.location,
          persona.income_level,
          persona.occupation,
          JSON.stringify(persona.interests || []),
          JSON.stringify(persona.pain_points || []),
          JSON.stringify(persona.goals || []),
          persona.buying_behavior,
          JSON.stringify(persona.preferred_channels || []),
          persona.description
        ]
      );
      savedPersonas.push(result.rows[0]);
    }

    res.status(200).json({
      success: true,
      data: savedPersonas
    });
  } catch (error) {
    console.error('Audience generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate audiences',
      message: error.message
    });
  }
};
