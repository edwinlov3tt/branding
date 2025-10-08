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
// GET all curated ads (platform-wide) or search cached ads
app.get('/api/ad-inspirations/curated', async (req, res) => {
  try {
    const { platform, niche, limit = 50, search } = req.query;

    let query = 'SELECT * FROM ad_inspirations WHERE ';
    const params = [];
    let paramIndex = 1;

    // If search query provided, search cached ads with matching search_query
    // Otherwise, only return curated ads
    if (search) {
      // Normalize search query (remove spaces, lowercase)
      const normalizedSearch = search.toLowerCase().replace(/\s+/g, '');

      query += `(
        search_query IS NOT NULL AND
        is_curated = false AND
        brand_id IS NULL AND
        saved_by_brand_id IS NULL AND
        LOWER(REPLACE(search_query, ' ', '')) LIKE LOWER($${paramIndex})
      )`;
      params.push(`%${normalizedSearch}%`);
      paramIndex++;
      console.log(`🔍 Searching database cache for Foreplay results matching: "${search}" (excluding curated & brand-saved ads)`);
    } else {
      query += 'is_curated = true';
    }

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

    if (search) {
      console.log(`✅ Found ${result.rows.length} ads in cache with similar query`);
    }

    res.json({
      success: true,
      data: result.rows,
      fromCache: !!search,
      count: result.rows.length
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
    const { query, platform, niche, limit = 20, order = 'most_relevant', cursor } = req.body;
    const foreplayApiKey = process.env.FOREPLAY_API_KEY;

    if (!foreplayApiKey) {
      return res.status(503).json({
        success: false,
        error: 'Foreplay API key not configured'
      });
    }

    console.log('🔍 Foreplay API search request:', { query, platform, niche, limit, cursor: !!cursor });

    // Build API parameters for discovery endpoint
    const apiParams = {
      limit: Math.min(limit, 100), // Max 100 per Foreplay docs
      order: order,
      geo_location: 'US', // Filter for US-based ads only
      languages: 'English' // Filter for English language ads
    };

    // Add cursor for pagination
    if (cursor) {
      apiParams.cursor = cursor;
    }

    // Add query if provided
    if (query) {
      apiParams.query = query;
    }

    // Add platform filter (convert to lowercase as Foreplay expects)
    if (platform && platform !== 'all') {
      apiParams.publisher_platform = platform.toLowerCase();
    }

    // Add niche filter if provided
    if (niche && niche !== 'all') {
      apiParams.niches = niche;
    }

    console.log('📤 Calling Foreplay Discovery API with params:', apiParams);

    const response = await axios.get('https://public.api.foreplay.co/api/discovery/ads', {
      headers: {
        'Authorization': foreplayApiKey,
      },
      params: apiParams,
      timeout: 30000
    });

    console.log('✅ Foreplay API response:', {
      status: response.status,
      dataLength: response.data?.data?.length || 0,
      cursor: response.data?.metadata?.cursor || 'NO CURSOR',
      hasMetadata: !!response.data?.metadata
    });

    // Get the ads array from response
    const ads = response.data?.data || [];

    // For each ad, fetch full details to get thumbnail and video
    const detailedAds = await Promise.all(
      ads.slice(0, Math.min(limit, ads.length)).map(async (ad) => {
        try {
          const detailResponse = await axios.get('https://public.api.foreplay.co/api/ad', {
            headers: {
              'Authorization': foreplayApiKey,
            },
            params: { ad_id: ad.id },
            timeout: 10000
          });
          return detailResponse.data?.data || ad;
        } catch (err) {
          console.error(`Failed to fetch details for ad ${ad.id}:`, err.message);
          return ad; // Return basic ad if detail fetch fails
        }
      })
    );

    // Log first ad to see structure
    if (detailedAds.length > 0) {
      console.log('📊 Sample ad structure:', JSON.stringify(detailedAds[0], null, 2));
    }

    // Auto-save all results to database for caching (without brand_id)
    console.log(`💾 Auto-saving ${detailedAds.length} ads to database for caching...`);
    let savedCount = 0;
    let skippedCount = 0;

    for (const ad of detailedAds) {
      try {
        // Check if already exists by foreplay_ad_id
        const existing = await pool.query(
          'SELECT id FROM ad_inspirations WHERE foreplay_ad_id = $1 LIMIT 1',
          [ad.id || ad.ad_id]
        );

        if (existing.rows.length === 0) {
          // Map Foreplay ad structure to our schema
          const adData = {
            first_seen: ad.started_running ? new Date(ad.started_running).toISOString() : null,
            cta: ad.cta_type,
            landing_page: ad.link_url,
            is_live: ad.live
          };

          const platform = Array.isArray(ad.publisher_platform)
            ? ad.publisher_platform[0]?.charAt(0).toUpperCase() + ad.publisher_platform[0]?.slice(1) || 'Facebook'
            : 'Facebook';

          await pool.query(
            `INSERT INTO ad_inspirations
             (foreplay_ad_id, ad_data, thumbnail_url, video_url, platform, advertiser_name, niche, ad_copy, is_curated, search_query)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              ad.id || ad.ad_id,
              adData,
              ad.image || ad.thumbnail || ad.avatar || '',
              ad.video || null,
              platform,
              ad.name || 'Unknown',
              Array.isArray(ad.niches) ? ad.niches[0] : ad.niche || null,
              ad.description || ad.copy || '',
              false, // not curated
              query || null // Store the search query that found this ad
            ]
          );
          savedCount++;
        } else {
          skippedCount++;
        }
      } catch (err) {
        console.error(`Failed to save ad ${ad.id}:`, err.message);
      }
    }

    console.log(`✅ Auto-saved ${savedCount} new ads, skipped ${skippedCount} existing ads`);

    const responseCursor = response.data?.metadata?.cursor || null;
    console.log(`📤 Returning ${detailedAds.length} ads to frontend, cursor: ${responseCursor || 'NULL'}, hasMore: ${!!responseCursor}`);

    res.json({
      success: true,
      data: detailedAds,
      metadata: {
        cursor: responseCursor,
        hasMore: !!responseCursor
      }
    });
  } catch (error) {
    console.error('Foreplay API error:', error.message);

    if (error.response) {
      console.error('Foreplay API error details:', {
        status: error.response.status,
        data: error.response.data
      });

      return res.status(error.response.status).json({
        success: false,
        error: error.response.data?.message || error.response.data?.error || 'Foreplay API request failed',
        details: error.response.data
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to search ads'
    });
  }
});

// ===== PRODUCTS/SERVICES CRUD =====

// GET - Get all products/services for a brand
app.get('/api/products-services', async (req, res) => {
  try {
    const { brand_id } = req.query;

    if (!brand_id) {
      return res.status(400).json({
        success: false,
        error: 'brand_id is required'
      });
    }

    const result = await pool.query(
      'SELECT * FROM products_services WHERE brand_id = $1 ORDER BY created_at DESC',
      [brand_id]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching products/services:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products/services'
    });
  }
});

// POST - Create new product/service
app.post('/api/products-services', async (req, res) => {
  try {
    const { brand_id, name, category, description, price, features, image_url } = req.body;

    if (!brand_id || !name || !category) {
      return res.status(400).json({
        success: false,
        error: 'brand_id, name, and category are required'
      });
    }

    const result = await pool.query(
      `INSERT INTO products_services (brand_id, name, category, description, price, features, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [brand_id, name, category, description, price, JSON.stringify(features || []), image_url]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating product/service:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create product/service'
    });
  }
});

// PUT - Update product/service
app.put('/api/products-services', async (req, res) => {
  try {
    const { id, name, category, description, price, features, image_url } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'id is required'
      });
    }

    const result = await pool.query(
      `UPDATE products_services
       SET name = COALESCE($1, name),
           category = COALESCE($2, category),
           description = COALESCE($3, description),
           price = COALESCE($4, price),
           features = COALESCE($5, features),
           image_url = COALESCE($6, image_url)
       WHERE id = $7
       RETURNING *`,
      [name, category, description, price, features ? JSON.stringify(features) : null, image_url, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product/service not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating product/service:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update product/service'
    });
  }
});

// DELETE - Delete product/service
app.delete('/api/products-services', async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'id is required'
      });
    }

    const result = await pool.query(
      'DELETE FROM products_services WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product/service not found'
      });
    }

    res.json({
      success: true,
      message: 'Product/service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product/service:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete product/service'
    });
  }
});

// ===== COMPETITORS CRUD =====

// GET - Get all competitors for a brand
app.get('/api/competitors', async (req, res) => {
  try {
    const { brand_id } = req.query;

    if (!brand_id) {
      return res.status(400).json({
        success: false,
        error: 'brand_id is required'
      });
    }

    const result = await pool.query(
      'SELECT * FROM competitors WHERE brand_id = $1 ORDER BY created_at DESC',
      [brand_id]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching competitors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch competitors'
    });
  }
});

// POST - Create new competitor
app.post('/api/competitors', async (req, res) => {
  try {
    const { brand_id, name, description, website_url, strengths, weaknesses, market_position } = req.body;

    if (!brand_id || !name) {
      return res.status(400).json({
        success: false,
        error: 'brand_id and name are required'
      });
    }

    const result = await pool.query(
      `INSERT INTO competitors (brand_id, name, description, website_url, strengths, weaknesses, market_position)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [brand_id, name, description, website_url, JSON.stringify(strengths || []), JSON.stringify(weaknesses || []), market_position]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating competitor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create competitor'
    });
  }
});

// PUT - Update competitor
app.put('/api/competitors', async (req, res) => {
  try {
    const { id, name, description, website_url, strengths, weaknesses, market_position } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'id is required'
      });
    }

    const result = await pool.query(
      `UPDATE competitors
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           website_url = COALESCE($3, website_url),
           strengths = COALESCE($4, strengths),
           weaknesses = COALESCE($5, weaknesses),
           market_position = COALESCE($6, market_position)
       WHERE id = $7
       RETURNING *`,
      [name, description, website_url, strengths ? JSON.stringify(strengths) : null, weaknesses ? JSON.stringify(weaknesses) : null, market_position, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Competitor not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating competitor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update competitor'
    });
  }
});

// DELETE - Delete competitor
app.delete('/api/competitors', async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'id is required'
      });
    }

    const result = await pool.query(
      'DELETE FROM competitors WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Competitor not found'
      });
    }

    res.json({
      success: true,
      message: 'Competitor deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting competitor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete competitor'
    });
  }
});

// ===== TARGET AUDIENCES CRUD =====

// GET - Get all target audiences for a brand
app.get('/api/target-audiences', async (req, res) => {
  try {
    const { brand_id } = req.query;

    if (!brand_id) {
      return res.status(400).json({
        success: false,
        error: 'brand_id is required'
      });
    }

    const result = await pool.query(
      'SELECT * FROM target_audiences WHERE brand_id = $1 ORDER BY created_at DESC',
      [brand_id]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching target audiences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch target audiences'
    });
  }
});

// POST - Create new target audience
app.post('/api/target-audiences', async (req, res) => {
  try {
    const { brand_id, name, description, demographics, psychographics } = req.body;

    if (!brand_id || !name) {
      return res.status(400).json({
        success: false,
        error: 'brand_id and name are required'
      });
    }

    const result = await pool.query(
      `INSERT INTO target_audiences (brand_id, name, description, demographics, psychographics)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [brand_id, name, description, JSON.stringify(demographics || {}), JSON.stringify(psychographics || {})]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating target audience:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create target audience'
    });
  }
});

// PUT - Update target audience
app.put('/api/target-audiences', async (req, res) => {
  try {
    const { id, name, description, demographics, psychographics } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'id is required'
      });
    }

    const result = await pool.query(
      `UPDATE target_audiences
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           demographics = COALESCE($3, demographics),
           psychographics = COALESCE($4, psychographics)
       WHERE id = $5
       RETURNING *`,
      [name, description, demographics ? JSON.stringify(demographics) : null, psychographics ? JSON.stringify(psychographics) : null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Target audience not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating target audience:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update target audience'
    });
  }
});

// DELETE - Delete target audience
app.delete('/api/target-audiences', async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'id is required'
      });
    }

    const result = await pool.query(
      'DELETE FROM target_audiences WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Target audience not found'
      });
    }

    res.json({
      success: true,
      message: 'Target audience deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting target audience:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete target audience'
    });
  }
});

// ===== CAMPAIGNS CRUD =====

// GET - Get all campaigns for a brand
app.get('/api/campaigns', async (req, res) => {
  try {
    const { brand_id } = req.query;

    if (!brand_id) {
      return res.status(400).json({
        success: false,
        error: 'brand_id is required'
      });
    }

    const result = await pool.query(
      'SELECT * FROM campaigns WHERE brand_id = $1 ORDER BY created_at DESC',
      [brand_id]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch campaigns'
    });
  }
});

// POST - Create new campaign
app.post('/api/campaigns', async (req, res) => {
  try {
    const { brand_id, name, objective, target_audience_ids, start_date, end_date, budget, channels, status } = req.body;

    if (!brand_id || !name || !objective) {
      return res.status(400).json({
        success: false,
        error: 'brand_id, name, and objective are required'
      });
    }

    const result = await pool.query(
      `INSERT INTO campaigns (brand_id, name, objective, target_audience_ids, start_date, end_date, budget, channels, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [brand_id, name, objective, JSON.stringify(target_audience_ids || []), start_date, end_date, budget, JSON.stringify(channels || []), status || 'draft']
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create campaign'
    });
  }
});

// PUT - Update campaign
app.put('/api/campaigns', async (req, res) => {
  try {
    const { id, name, objective, target_audience_ids, start_date, end_date, budget, channels, status } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'id is required'
      });
    }

    const result = await pool.query(
      `UPDATE campaigns
       SET name = COALESCE($1, name),
           objective = COALESCE($2, objective),
           target_audience_ids = COALESCE($3, target_audience_ids),
           start_date = COALESCE($4, start_date),
           end_date = COALESCE($5, end_date),
           budget = COALESCE($6, budget),
           channels = COALESCE($7, channels),
           status = COALESCE($8, status)
       WHERE id = $9
       RETURNING *`,
      [name, objective, target_audience_ids ? JSON.stringify(target_audience_ids) : null, start_date, end_date, budget, channels ? JSON.stringify(channels) : null, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update campaign'
    });
  }
});

// DELETE - Delete campaign
app.delete('/api/campaigns', async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'id is required'
      });
    }

    const result = await pool.query(
      'DELETE FROM campaigns WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    res.json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete campaign'
    });
  }
});

// ============================================
// BRAND INTELLIGENCE ENDPOINTS
// ============================================

// GET - Get brand intelligence for a brand
app.get('/api/brand-intelligence', async (req, res) => {
  try {
    const { brand_id } = req.query;

    if (!brand_id) {
      return res.status(400).json({
        success: false,
        error: 'brand_id is required'
      });
    }

    const result = await pool.query(
      'SELECT * FROM brand_intelligence WHERE brand_id = $1 ORDER BY created_at DESC LIMIT 1',
      [brand_id]
    );

    res.json({
      success: true,
      data: result.rows[0] || null
    });
  } catch (error) {
    console.error('Error fetching brand intelligence:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch brand intelligence'
    });
  }
});

// POST - Save brand intelligence
app.post('/api/brand-intelligence', async (req, res) => {
  try {
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
      return res.status(400).json({
        success: false,
        error: 'brand_id is required'
      });
    }

    const result = await pool.query(
      `INSERT INTO brand_intelligence (
        brand_id, brand_name, tagline, mission, vision, values, brand_tone, brand_voice,
        messaging_themes, industry, target_market, unique_value_proposition, key_messages,
        content_themes, pages_analyzed, analysis_confidence, raw_analysis
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        brand_id, brand_name, tagline, mission, vision,
        JSON.stringify(values || []),
        brand_tone,
        JSON.stringify(brand_voice || {}),
        JSON.stringify(messaging_themes || []),
        industry, target_market, unique_value_proposition,
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
  } catch (error) {
    console.error('Error saving brand intelligence:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save brand intelligence'
    });
  }
});

// ============================================
// COMPETITOR ANALYSES ENDPOINTS
// ============================================

// GET - Get all competitor analyses for a brand
app.get('/api/competitor-analyses', async (req, res) => {
  try {
    const { brand_id } = req.query;

    if (!brand_id) {
      return res.status(400).json({
        success: false,
        error: 'brand_id is required'
      });
    }

    const result = await pool.query(
      'SELECT * FROM competitor_analyses WHERE brand_id = $1 ORDER BY created_at DESC',
      [brand_id]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching competitor analyses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch competitor analyses'
    });
  }
});

// GET - Get single competitor analysis by ID
app.get('/api/competitor-analyses/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM competitor_analyses WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Competitor analysis not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching competitor analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch competitor analysis'
    });
  }
});

// POST - Create competitor analysis
app.post('/api/competitor-analyses', async (req, res) => {
  try {
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
      analysis_confidence
    } = req.body;

    if (!brand_id || !competitor_name) {
      return res.status(400).json({
        success: false,
        error: 'brand_id and competitor_name are required'
      });
    }

    const result = await pool.query(
      `INSERT INTO competitor_analyses (
        brand_id, competitor_id, competitor_name, competitor_website, facebook_page,
        total_ads_analyzed, ad_ids, ads_data, overview, positioning,
        creative_strategy, messaging_analysis, visual_design_elements,
        target_audience_insights, performance_indicators, recommendations,
        key_findings, analysis_model, analysis_confidence
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        brand_id, competitor_id, competitor_name, competitor_website, facebook_page,
        total_ads_analyzed || 0,
        JSON.stringify(ad_ids || []),
        JSON.stringify(ads_data || []),
        overview, positioning,
        JSON.stringify(creative_strategy || {}),
        JSON.stringify(messaging_analysis || {}),
        JSON.stringify(visual_design_elements || {}),
        JSON.stringify(target_audience_insights || {}),
        JSON.stringify(performance_indicators || {}),
        JSON.stringify(recommendations || []),
        JSON.stringify(key_findings || []),
        analysis_model,
        analysis_confidence
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating competitor analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create competitor analysis'
    });
  }
});

// DELETE - Delete competitor analysis
app.delete('/api/competitor-analyses/:id', async (req, res) => {
  try {
    const { id} = req.params;

    const result = await pool.query(
      'DELETE FROM competitor_analyses WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Competitor analysis not found'
      });
    }

    res.json({
      success: true,
      message: 'Competitor analysis deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting competitor analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete competitor analysis'
    });
  }
});

// ============================================
// AI GENERATION ENDPOINTS
// ============================================

// POST - Generate brand intelligence from website
app.post('/api/ai/generate-brand-intelligence', async (req, res) => {
  try {
    const { brand_id, url } = req.body;

    if (!brand_id || !url) {
      return res.status(400).json({
        success: false,
        error: 'brand_id and url are required'
      });
    }

    console.log(`🤖 Generating brand intelligence for: ${url}`);

    // Call analyze-brand-enhanced API to get comprehensive website analysis
    const analysisResponse = await axios.post('https://gtm.edwinlovett.com/api/analyze-brand-enhanced', {
      url,
      maxPages: 15,
      includeScreenshots: false,
      includeScraping: true,
      includeImages: false
    }, {
      timeout: 120000
    });

    // Extract insights from the analysis
    const brandAnalysis = analysisResponse.data;
    console.log('✅ Brand analysis complete, processing with AI...');

    // Use Claude to extract structured brand intelligence
    const claudeApiKey = process.env.VITE_CLAUDE_API_KEY;
    if (!claudeApiKey) {
      return res.status(503).json({
        success: false,
        error: 'Claude API key not configured'
      });
    }

    const prompt = `Analyze this brand data and extract key brand intelligence in JSON format:

${JSON.stringify(brandAnalysis, null, 2)}

Extract and return ONLY a valid JSON object with this structure:
{
  "brand_name": "extracted brand name",
  "tagline": "brand tagline if found",
  "mission": "mission statement",
  "vision": "vision statement",
  "values": ["value1", "value2"],
  "brand_tone": "overall tone (e.g., professional, friendly, innovative)",
  "brand_voice": {"formality": "formal/casual", "enthusiasm": "high/medium/low"},
  "messaging_themes": ["theme1", "theme2"],
  "industry": "industry/vertical",
  "target_market": "target market description",
  "unique_value_proposition": "what makes them unique",
  "key_messages": ["message1", "message2"],
  "content_themes": ["theme1", "theme2"]
}

Be concise and extract only what's clearly present in the data. Return ONLY the JSON, no other text.`;

    const claudeResponse = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    }, {
      headers: {
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    });

    const aiResponse = claudeResponse.data.content[0].text;
    const intelligence = JSON.parse(aiResponse);

    // Save to database
    const result = await pool.query(
      `INSERT INTO brand_intelligence (
        brand_id, brand_name, tagline, mission, vision, values, brand_tone, brand_voice,
        messaging_themes, industry, target_market, unique_value_proposition, key_messages,
        content_themes, pages_analyzed, analysis_confidence, raw_analysis
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        brand_id,
        intelligence.brand_name,
        intelligence.tagline,
        intelligence.mission,
        intelligence.vision,
        JSON.stringify(intelligence.values || []),
        intelligence.brand_tone,
        JSON.stringify(intelligence.brand_voice || {}),
        JSON.stringify(intelligence.messaging_themes || []),
        intelligence.industry,
        intelligence.target_market,
        intelligence.unique_value_proposition,
        JSON.stringify(intelligence.key_messages || []),
        JSON.stringify(intelligence.content_themes || []),
        brandAnalysis.discoveryMetadata?.totalPagesFound || 0,
        0.85,
        JSON.stringify(brandAnalysis)
      ]
    );

    console.log('✅ Brand intelligence saved successfully');

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error generating brand intelligence:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate brand intelligence'
    });
  }
});

// POST - Generate target audiences using AI
app.post('/api/ai/generate-audiences', async (req, res) => {
  try {
    const { brand_id } = req.body;

    if (!brand_id) {
      return res.status(400).json({
        success: false,
        error: 'brand_id is required'
      });
    }

    console.log(`🤖 Generating target audiences for brand: ${brand_id}`);

    // Get brand intelligence
    const intelligenceResult = await pool.query(
      'SELECT * FROM brand_intelligence WHERE brand_id = $1 ORDER BY created_at DESC LIMIT 1',
      [brand_id]
    );

    if (intelligenceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Brand intelligence not found. Please generate brand intelligence first.'
      });
    }

    const intelligence = intelligenceResult.rows[0];

    const claudeApiKey = process.env.VITE_CLAUDE_API_KEY;
    if (!claudeApiKey) {
      return res.status(503).json({
        success: false,
        error: 'Claude API key not configured'
      });
    }

    const prompt = `Based on this brand intelligence, generate 3-5 detailed target audience personas:

Brand: ${intelligence.brand_name}
Industry: ${intelligence.industry}
Mission: ${intelligence.mission}
Values: ${JSON.stringify(intelligence.values)}
Target Market: ${intelligence.target_market}
UVP: ${intelligence.unique_value_proposition}

Generate and return ONLY a valid JSON array of audience personas:
[
  {
    "name": "Persona Name (e.g., 'Tech-Savvy Millennials')",
    "description": "Detailed description",
    "demographics": {
      "age_range": "25-35",
      "gender": "All",
      "location": "Urban areas",
      "income_level": "$50k-$100k",
      "education": "Bachelor's degree or higher",
      "occupation": "Professional/Manager"
    },
    "psychographics": {
      "interests": "List of interests",
      "values": "What they value",
      "lifestyle": "Lifestyle description",
      "pain_points": "Key problems they face",
      "goals": "What they want to achieve",
      "buying_behavior": "How they make decisions"
    }
  }
]

Return ONLY the JSON array, no other text.`;

    const claudeResponse = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    }, {
      headers: {
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    });

    const aiResponse = claudeResponse.data.content[0].text;
    const audiences = JSON.parse(aiResponse);

    // Save audiences to database
    const savedAudiences = [];
    for (const audience of audiences) {
      const result = await pool.query(
        `INSERT INTO target_audiences (brand_id, name, description, demographics, psychographics)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          brand_id,
          audience.name,
          audience.description,
          JSON.stringify(audience.demographics),
          JSON.stringify(audience.psychographics)
        ]
      );
      savedAudiences.push(result.rows[0]);
    }

    console.log(`✅ Generated ${savedAudiences.length} target audiences`);

    res.json({
      success: true,
      data: savedAudiences
    });
  } catch (error) {
    console.error('Error generating audiences:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate target audiences'
    });
  }
});

// POST - Analyze competitor with Foreplay ads + AI
app.post('/api/ai/analyze-competitor', async (req, res) => {
  try {
    const { brand_id, competitor_name, facebook_page } = req.body;

    if (!brand_id || !competitor_name) {
      return res.status(400).json({
        success: false,
        error: 'brand_id and competitor_name are required'
      });
    }

    console.log(`🤖 Analyzing competitor: ${competitor_name}`);

    const foreplayApiKey = process.env.FOREPLAY_API_KEY;
    if (!foreplayApiKey) {
      return res.status(503).json({
        success: false,
        error: 'Foreplay API key not configured'
      });
    }

    // Search for competitor ads
    console.log('🔍 Fetching competitor ads from Foreplay...');
    const searchResponse = await axios.get('https://public.api.foreplay.co/api/discovery/ads', {
      headers: {
        'Authorization': foreplayApiKey
      },
      params: {
        query: competitor_name,
        limit: 20,
        order: 'most_relevant',
        geo_location: 'US',
        languages: 'English'
      },
      timeout: 30000
    });

    const ads = searchResponse.data?.data || [];

    if (ads.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No ads found for this competitor'
      });
    }

    console.log(`✅ Found ${ads.length} ads, analyzing with AI...`);

    // Use Claude to analyze the ads
    const claudeApiKey = process.env.VITE_CLAUDE_API_KEY;
    if (!claudeApiKey) {
      return res.status(503).json({
        success: false,
        error: 'Claude API key not configured'
      });
    }

    const prompt = `Analyze these ${ads.length} competitor ads and provide a comprehensive analysis:

Competitor: ${competitor_name}
Ads Data: ${JSON.stringify(ads.slice(0, 20), null, 2)}

Provide a detailed analysis in JSON format matching this structure:
{
  "overview": "Overall competitive positioning and strategy summary",
  "positioning": "How they position themselves in the market",
  "creative_strategy": {
    "ad_formats": ["format types used"],
    "common_themes": ["recurring themes"],
    "creative_patterns": ["patterns observed"],
    "frequency": "posting frequency"
  },
  "messaging_analysis": {
    "tone": "overall tone",
    "key_messages": ["main messages"],
    "ctas": ["call-to-actions used"],
    "value_propositions": ["value props highlighted"]
  },
  "visual_design_elements": {
    "colors": ["color schemes"],
    "imagery_style": "style description",
    "typography": "typography approach",
    "branding_consistency": "consistency level"
  },
  "target_audience_insights": {
    "demographics": ["apparent demographics"],
    "psychographics": ["apparent psychographics"],
    "pain_points": ["pain points addressed"]
  },
  "performance_indicators": {
    "engagement_patterns": "patterns observed",
    "ad_frequency": "how often they post",
    "timing": "when they post"
  },
  "key_findings": ["finding 1", "finding 2", "finding 3"],
  "recommendations": ["actionable recommendation 1", "recommendation 2"]
}

Return ONLY the JSON object, no other text.`;

    const claudeResponse = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    }, {
      headers: {
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    });

    const aiResponse = claudeResponse.data.content[0].text;
    const analysis = JSON.parse(aiResponse);

    // Save analysis to database
    const result = await pool.query(
      `INSERT INTO competitor_analyses (
        brand_id, competitor_name, facebook_page, total_ads_analyzed, ad_ids, ads_data,
        overview, positioning, creative_strategy, messaging_analysis, visual_design_elements,
        target_audience_insights, performance_indicators, recommendations, key_findings,
        analysis_model, analysis_confidence
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        brand_id,
        competitor_name,
        facebook_page,
        ads.length,
        JSON.stringify(ads.map(ad => ad.id)),
        JSON.stringify(ads),
        analysis.overview,
        analysis.positioning,
        JSON.stringify(analysis.creative_strategy),
        JSON.stringify(analysis.messaging_analysis),
        JSON.stringify(analysis.visual_design_elements),
        JSON.stringify(analysis.target_audience_insights),
        JSON.stringify(analysis.performance_indicators),
        JSON.stringify(analysis.recommendations),
        JSON.stringify(analysis.key_findings),
        'claude-3-5-sonnet-20241022',
        0.85
      ]
    );

    console.log('✅ Competitor analysis saved successfully');

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error analyzing competitor:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze competitor'
    });
  }
});

// POST - Generate products and services from brand intelligence
app.post('/api/ai/generate-products', async (req, res) => {
  try {
    const { brand_id } = req.body;

    if (!brand_id) {
      return res.status(400).json({
        success: false,
        error: 'brand_id is required'
      });
    }

    console.log(`🤖 Generating products/services for brand: ${brand_id}`);

    // Get brand intelligence
    const intelligenceResult = await pool.query(
      'SELECT * FROM brand_intelligence WHERE brand_id = $1 ORDER BY created_at DESC LIMIT 1',
      [brand_id]
    );

    if (intelligenceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Brand intelligence not found'
      });
    }

    const intelligence = intelligenceResult.rows[0];

    const claudeApiKey = process.env.VITE_CLAUDE_API_KEY;
    if (!claudeApiKey) {
      return res.status(503).json({
        success: false,
        error: 'Claude API key not configured'
      });
    }

    const prompt = `Based on this brand intelligence, identify and generate their likely products/services:

Brand: ${intelligence.brand_name}
Industry: ${intelligence.industry}
Mission: ${intelligence.mission}
UVP: ${intelligence.unique_value_proposition}
Content Themes: ${JSON.stringify(intelligence.content_themes)}

Generate and return ONLY a valid JSON array of products/services:
[
  {
    "name": "Product/Service Name",
    "category": "Category",
    "description": "Description",
    "price": "Price range if inferable",
    "features": ["feature1", "feature2", "feature3"]
  }
]

Return ONLY the JSON array, no other text.`;

    const claudeResponse = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    }, {
      headers: {
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    });

    const aiResponse = claudeResponse.data.content[0].text;
    const products = JSON.parse(aiResponse);

    // Save to database
    const savedProducts = [];
    for (const product of products) {
      const result = await pool.query(
        `INSERT INTO products_services (brand_id, name, category, description, price, features)
         VALUES ($1, $2, $3, $4, $5, $6)
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

    console.log(`✅ Generated ${savedProducts.length} products/services`);

    res.json({
      success: true,
      data: savedProducts
    });
  } catch (error) {
    console.error('Error generating products:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate products/services'
    });
  }
});

// POST - Generate campaign ideas
app.post('/api/ai/generate-campaigns', async (req, res) => {
  try {
    const { brand_id } = req.body;

    if (!brand_id) {
      return res.status(400).json({
        success: false,
        error: 'brand_id is required'
      });
    }

    console.log(`🤖 Generating campaigns for brand: ${brand_id}`);

    // Get brand intelligence and audiences
    const intelligenceResult = await pool.query(
      'SELECT * FROM brand_intelligence WHERE brand_id = $1 ORDER BY created_at DESC LIMIT 1',
      [brand_id]
    );

    const audiencesResult = await pool.query(
      'SELECT * FROM target_audiences WHERE brand_id = $1',
      [brand_id]
    );

    if (intelligenceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Brand intelligence not found'
      });
    }

    const intelligence = intelligenceResult.rows[0];
    const audiences = audiencesResult.rows;

    const claudeApiKey = process.env.VITE_CLAUDE_API_KEY;
    if (!claudeApiKey) {
      return res.status(503).json({
        success: false,
        error: 'Claude API key not configured'
      });
    }

    const prompt = `Based on this brand data, generate 3-5 campaign ideas:

Brand: ${intelligence.brand_name}
Industry: ${intelligence.industry}
Mission: ${intelligence.mission}
UVP: ${intelligence.unique_value_proposition}
Target Audiences: ${JSON.stringify(audiences.map(a => a.name))}

Generate and return ONLY a valid JSON array of campaign ideas:
[
  {
    "name": "Campaign Name",
    "objective": "Campaign objective/goal",
    "target_audience_ids": [],
    "start_date": "2025-11-01",
    "end_date": "2025-12-31",
    "budget": "$10,000 - $25,000",
    "channels": ["Facebook", "Instagram", "Google Ads"],
    "status": "draft"
  }
]

Return ONLY the JSON array, no other text.`;

    const claudeResponse = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    }, {
      headers: {
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    });

    const aiResponse = claudeResponse.data.content[0].text;
    const campaigns = JSON.parse(aiResponse);

    // Save to database
    const savedCampaigns = [];
    for (const campaign of campaigns) {
      const result = await pool.query(
        `INSERT INTO campaigns (brand_id, name, objective, target_audience_ids, start_date, end_date, budget, channels, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          brand_id,
          campaign.name,
          campaign.objective,
          JSON.stringify(campaign.target_audience_ids || []),
          campaign.start_date,
          campaign.end_date,
          campaign.budget,
          JSON.stringify(campaign.channels || []),
          'draft'
        ]
      );
      savedCampaigns.push(result.rows[0]);
    }

    console.log(`✅ Generated ${savedCampaigns.length} campaigns`);

    res.json({
      success: true,
      data: savedCampaigns
    });
  } catch (error) {
    console.error('Error generating campaigns:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate campaigns'
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