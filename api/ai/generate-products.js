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

    const prompt = `Based on this brand information, generate 3-5 product/service offerings in JSON format.

Brand Information:
- Name: ${brandIntel.brand_name}
- Industry: ${brandIntel.industry}
- Mission: ${brandIntel.mission}
- Value Proposition: ${brandIntel.unique_value_proposition}

Return ONLY a JSON array with this structure:
[
  {
    "name": "Product/Service Name",
    "category": "Category",
    "description": "Brief description",
    "price": "Price range or model",
    "features": ["Feature 1", "Feature 2", "Feature 3"]
  }
]`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    const products = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    // Save products to database
    const savedProducts = [];
    for (const product of products) {
      const result = await pool.query(
        `INSERT INTO products_services (
          brand_id, name, category, description, price, features
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [
          brand_id,
          product.name,
          product.category,
          product.description,
          product.price,
          JSON.stringify(product.features || [])
        ]
      );
      savedProducts.push(result.rows[0]);
    }

    res.status(200).json({
      success: true,
      data: savedProducts
    });
  } catch (error) {
    console.error('Products generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate products',
      message: error.message
    });
  }
};
