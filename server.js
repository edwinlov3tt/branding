const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { Pool } = require('pg');
const slugify = require('slugify');
const { nanoid } = require('nanoid');
require('dotenv').config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3001;

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  ssl: false,
});

// Utility functions for slug and short ID generation
function generateSlug(name) {
  return slugify(name, {
    lower: true,
    strict: true,
    trim: true
  });
}

function generateShortId() {
  return nanoid(5);
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API server is running' });
});

// Brand extraction endpoint - proxy to real API
app.post('/api/extract-brand', async (req, res) => {
  try {
    const { url, includeScreenshot = true } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format. Please provide a valid URL (e.g., https://example.com)'
      });
    }

    console.log(`🔍 Extracting brand data for: ${url} (screenshot: ${includeScreenshot})`);

    // Call the real API
    const response = await axios.post('https://gtm.edwinlovett.com/api/extract-brand', {
      url,
      includeScreenshot
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Branding-App/1.0'
      },
      timeout: 30000 // 30 second timeout
    });

    console.log(`✅ Brand extraction completed for: ${new URL(url).hostname}`);

    // Return the real API response
    res.json(response.data);

  } catch (error) {
    console.error('Brand extraction error:', error.message);

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return res.status(503).json({
        success: false,
        error: 'Brand extraction service is currently unavailable. Please try again later.'
      });
    }

    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        error: error.response.data?.error || 'Failed to extract brand data'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to extract brand data'
    });
  }
});

// Discover brand pages endpoint
app.post('/api/discover-brand-pages', async (req, res) => {
  try {
    const {
      url,
      maxPages = 10,
      includeScraping = false,
      includeImages = true,
      maxImagesPerPage = 8
    } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }

    // Validate URL
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format. Please provide a valid URL (e.g., https://example.com)'
      });
    }

    console.log(`🔍 Discovering brand pages for: ${url} (maxPages: ${maxPages}, images: ${includeImages})`);

    // Call the real API
    const response = await axios.post('https://gtm.edwinlovett.com/api/discover-brand-pages', {
      url,
      maxPages,
      includeScraping,
      includeImages,
      maxImagesPerPage
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Branding-App/1.0'
      },
      timeout: 60000 // 60 second timeout for this longer operation
    });

    console.log(`✅ Page discovery completed for: ${new URL(url).hostname}`);

    // Return the real API response
    res.json(response.data);

  } catch (error) {
    console.error('Page discovery error:', error.message);

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return res.status(503).json({
        success: false,
        error: 'Page discovery service is currently unavailable. Please try again later.'
      });
    }

    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        error: error.response.data?.error || 'Failed to discover brand pages'
      });
    }

    res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while discovering brand pages'
    });
  }
});

// Save edited brand data endpoint
app.post('/api/brand/save-edited', (req, res) => {
  try {
    const editedData = req.body;

    // In production, this would save to a database
    // For now, just acknowledge receipt
    console.log('Saving edited brand data:', editedData);

    res.json({
      success: true,
      message: 'Brand data saved successfully'
    });
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save brand data'
    });
  }
});

// Load edited brand data endpoint
app.get('/api/brand/edited', (req, res) => {
  try {
    // In production, this would load from a database
    // For now, return null (no saved data)
    res.json({
      success: true,
      data: null
    });
  } catch (error) {
    console.error('Load error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load brand data'
    });
  }
});

// Brand CRUD endpoints
// GET all brands
app.get('/api/brands', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        b.*,
        (SELECT COUNT(*) FROM target_audiences WHERE brand_id = b.id) as audience_count,
        (SELECT COUNT(*) FROM products_services WHERE brand_id = b.id) as product_count,
        (SELECT COUNT(*) FROM campaigns WHERE brand_id = b.id) as campaign_count,
        (SELECT COUNT(*) FROM competitors WHERE brand_id = b.id) as competitor_count,
        (SELECT COUNT(*) FROM templates WHERE brand_id = b.id) as template_count,
        (SELECT COUNT(*) FROM generations WHERE brand_id = b.id) as generation_count
      FROM brands b
      ORDER BY b.created_at DESC
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch brands'
    });
  }
});

// GET brand by slug and short ID
app.get('/api/brands/:slug/:shortId', async (req, res) => {
  try {
    const { slug, shortId } = req.params;

    const result = await pool.query(`
      SELECT
        b.*,
        (SELECT COUNT(*) FROM target_audiences WHERE brand_id = b.id) as audience_count,
        (SELECT COUNT(*) FROM products_services WHERE brand_id = b.id) as product_count,
        (SELECT COUNT(*) FROM campaigns WHERE brand_id = b.id) as campaign_count,
        (SELECT COUNT(*) FROM competitors WHERE brand_id = b.id) as competitor_count,
        (SELECT COUNT(*) FROM templates WHERE brand_id = b.id) as template_count,
        (SELECT COUNT(*) FROM generations WHERE brand_id = b.id) as generation_count
      FROM brands b
      WHERE b.slug = $1 AND b.short_id = $2
    `, [slug, shortId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Brand not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching brand:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch brand'
    });
  }
});

// POST - Create new brand
app.post('/api/brands', async (req, res) => {
  try {
    const { name, website, logo_url, primary_color, industry, favicon_url } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Brand name is required'
      });
    }

    // Generate slug and short ID
    let slug = generateSlug(name);
    let shortId = generateShortId();

    // Check for slug uniqueness and regenerate if needed
    const existingSlugs = await pool.query('SELECT slug FROM brands WHERE slug = $1', [slug]);
    if (existingSlugs.rows.length > 0) {
      let counter = 1;
      let uniqueSlug = slug;
      while (true) {
        uniqueSlug = `${slug}-${counter}`;
        const check = await pool.query('SELECT slug FROM brands WHERE slug = $1', [uniqueSlug]);
        if (check.rows.length === 0) {
          slug = uniqueSlug;
          break;
        }
        counter++;
      }
    }

    // Check for short ID uniqueness (very unlikely collision but just in case)
    const existingIds = await pool.query('SELECT short_id FROM brands WHERE short_id = $1', [shortId]);
    if (existingIds.rows.length > 0) {
      shortId = generateShortId(); // Generate a new one
    }

    const result = await pool.query(
      `INSERT INTO brands (name, website, logo_url, primary_color, slug, short_id, industry, favicon_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, website, logo_url, primary_color, slug, shortId, industry, favicon_url]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating brand:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create brand',
      message: error.message
    });
  }
});

// PUT - Update brand
app.put('/api/brands', async (req, res) => {
  try {
    const { id, name, website, logo_url, primary_color } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Brand ID is required'
      });
    }

    const result = await pool.query(
      `UPDATE brands
       SET name = COALESCE($2, name),
           website = COALESCE($3, website),
           logo_url = COALESCE($4, logo_url),
           primary_color = COALESCE($5, primary_color),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id, name, website, logo_url, primary_color]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Brand not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating brand:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update brand'
    });
  }
});

// DELETE - Delete brand
app.delete('/api/brands', async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Brand ID is required'
      });
    }

    const result = await pool.query(
      'DELETE FROM brands WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Brand not found'
      });
    }

    res.json({
      success: true,
      message: 'Brand deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting brand:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete brand'
    });
  }
});

// Brand Assets endpoints
// POST - Save brand assets
app.post('/api/brand-assets', async (req, res) => {
  try {
    const { brand_id, assets } = req.body;

    if (!brand_id || !assets) {
      return res.status(400).json({
        success: false,
        error: 'Brand ID and assets are required'
      });
    }

    // Check if table exists, create if not
    await pool.query(`
      CREATE TABLE IF NOT EXISTS brand_assets (
        id SERIAL PRIMARY KEY,
        brand_id UUID UNIQUE REFERENCES brands(id) ON DELETE CASCADE,
        assets JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert or update brand assets
    const result = await pool.query(
      `INSERT INTO brand_assets (brand_id, assets)
       VALUES ($1, $2)
       ON CONFLICT (brand_id)
       DO UPDATE SET assets = $2, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [brand_id, assets]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Brand Assets API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// GET - Fetch brand assets by brand_id
app.get('/api/brand-assets', async (req, res) => {
  try {
    const { brand_id } = req.query;

    if (!brand_id) {
      return res.status(400).json({
        success: false,
        error: 'Brand ID is required'
      });
    }

    // Check if table exists first
    await pool.query(`
      CREATE TABLE IF NOT EXISTS brand_assets (
        id SERIAL PRIMARY KEY,
        brand_id UUID UNIQUE REFERENCES brands(id) ON DELETE CASCADE,
        assets JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const result = await pool.query(
      'SELECT * FROM brand_assets WHERE brand_id = $1',
      [brand_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Brand assets not found'
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Brand Assets API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Ad Inspirations endpoints
// GET all curated ads (platform-wide)
app.get('/api/ad-inspirations/curated', async (req, res) => {
  try {
    const { platform, niche, limit = 50 } = req.query;

    let query = 'SELECT * FROM ad_inspirations WHERE is_curated = true';
    const params = [];
    let paramIndex = 1;

    if (platform) {
      query += ` AND platform = $${paramIndex}`;
      params.push(platform);
      paramIndex++;
    }

    if (niche) {
      query += ` AND niche = $${paramIndex}`;
      params.push(niche);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching curated ads:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch curated ads'
    });
  }
});

// GET ad inspirations for a specific brand
app.get('/api/ad-inspirations', async (req, res) => {
  try {
    const { brand_id } = req.query;

    if (!brand_id) {
      return res.status(400).json({
        success: false,
        error: 'Brand ID is required'
      });
    }

    // Check if table exists first
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ad_inspirations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
        foreplay_ad_id VARCHAR(255),
        ad_data JSONB NOT NULL,
        thumbnail_url TEXT NOT NULL,
        video_url TEXT,
        platform VARCHAR(50) NOT NULL,
        advertiser_name VARCHAR(255) NOT NULL,
        niche VARCHAR(100),
        ad_copy TEXT,
        is_curated BOOLEAN DEFAULT false,
        saved_by_brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const result = await pool.query(
      'SELECT * FROM ad_inspirations WHERE brand_id = $1 OR saved_by_brand_id = $1 ORDER BY created_at DESC',
      [brand_id]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching ad inspirations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ad inspirations'
    });
  }
});

// POST - Save ad to brand inspiration
app.post('/api/ad-inspirations', async (req, res) => {
  try {
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

    if (!brand_id || !thumbnail_url || !platform || !advertiser_name) {
      return res.status(400).json({
        success: false,
        error: 'Brand ID, thumbnail URL, platform, and advertiser name are required'
      });
    }

    // Check if ad already saved by this brand
    const existing = await pool.query(
      'SELECT id FROM ad_inspirations WHERE brand_id = $1 AND foreplay_ad_id = $2',
      [brand_id, foreplay_ad_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Ad already saved to this brand'
      });
    }

    const result = await pool.query(
      `INSERT INTO ad_inspirations
       (brand_id, foreplay_ad_id, ad_data, thumbnail_url, video_url, platform, advertiser_name, niche, ad_copy, saved_by_brand_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $1)
       RETURNING *`,
      [brand_id, foreplay_ad_id, ad_data, thumbnail_url, video_url, platform, advertiser_name, niche, ad_copy]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error saving ad inspiration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save ad inspiration',
      message: error.message
    });
  }
});

// DELETE - Remove ad from brand inspiration
app.delete('/api/ad-inspirations', async (req, res) => {
  try {
    const { id, brand_id } = req.query;

    if (!id || !brand_id) {
      return res.status(400).json({
        success: false,
        error: 'Ad ID and Brand ID are required'
      });
    }

    const result = await pool.query(
      'DELETE FROM ad_inspirations WHERE id = $1 AND brand_id = $2 RETURNING *',
      [id, brand_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Ad inspiration not found'
      });
    }

    res.json({
      success: true,
      message: 'Ad inspiration removed successfully'
    });
  } catch (error) {
    console.error('Error deleting ad inspiration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete ad inspiration'
    });
  }
});

// Foreplay API proxy - search ads
app.post('/api/foreplay/search-ads', async (req, res) => {
  try {
    const { query, platform, niche, limit = 20 } = req.body;
    const foreplayApiKey = process.env.FOREPLAY_API_KEY;

    if (!foreplayApiKey) {
      return res.status(503).json({
        success: false,
        error: 'Foreplay API key not configured'
      });
    }

    // Call Foreplay API
    const response = await axios.get('https://public.api.foreplay.co/api/brand/getAdsByBrandId', {
      headers: {
        'Authorization': `Bearer ${foreplayApiKey}`,
        'Content-Type': 'application/json'
      },
      params: {
        query,
        platform,
        niche,
        limit
      },
      timeout: 30000
    });

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Foreplay API error:', error.message);

    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        error: error.response.data?.error || 'Foreplay API request failed'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to search ads'
    });
  }
});

// Fallback route - handle all other requests
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

app.listen(PORT, () => {
  console.log(`✅ API server running on http://localhost:${PORT}`);
  console.log('📍 Available endpoints:');
  console.log('   GET  /health - Health check');
  console.log('   POST /api/extract-brand - Extract brand from URL');
  console.log('   POST /api/discover-brand-pages - Discover brand pages with images');
  console.log('   POST /api/brand/save-edited - Save edited brand data');
  console.log('   GET  /api/brand/edited - Load edited brand data');
  console.log('   GET  /api/brands - Get all brands');
  console.log('   GET  /api/brands/:slug/:shortId - Get brand by slug and short ID');
  console.log('   POST /api/brands - Create new brand');
  console.log('   PUT  /api/brands - Update brand');
  console.log('   DELETE /api/brands - Delete brand');
  console.log('   POST /api/brand-assets - Save brand assets');
  console.log('   GET  /api/brand-assets - Get brand assets');
  console.log('   GET  /api/ad-inspirations/curated - Get curated ad inspirations');
  console.log('   GET  /api/ad-inspirations - Get brand ad inspirations');
  console.log('   POST /api/ad-inspirations - Save ad inspiration');
  console.log('   DELETE /api/ad-inspirations - Remove ad inspiration');
  console.log('   POST /api/foreplay/search-ads - Search ads via Foreplay API');
});