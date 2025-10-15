const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { Pool } = require('pg');
const slugify = require('slugify');
const { nanoid } = require('nanoid');

// Load .env.local file if it exists (for local development)
// In production (Railway), environment variables are injected directly
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  // dotenv not installed or .env.local not found - use environment variables
  console.log('Using environment variables (production mode)');
}

const app = express();
const PORT = process.env.PORT || 3001;

// PostgreSQL connection pool
// Supports both DATABASE_URL (Railway, Heroku) and individual connection params
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      }
    : {
        host: process.env.DATABASE_HOST,
        port: parseInt(process.env.DATABASE_PORT || '5432'),
        database: process.env.DATABASE_NAME,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        ssl: false,
      }
);

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

// Test all endpoints - comprehensive testing
app.get('/api/test-all', async (req, res) => {
  const results = {
    timestamp: new Date().toISOString(),
    backend: {
      health: null,
      database: null
    },
    externalServices: {
      gtmApi: null
    },
    endpoints: []
  };

  // Test backend health
  try {
    results.backend.health = { status: 'ok', message: 'Backend is running' };
  } catch (error) {
    results.backend.health = { status: 'error', message: error.message };
  }

  // Test database connection
  try {
    const dbTest = await pool.query('SELECT NOW()');
    results.backend.database = {
      status: 'ok',
      message: 'Database connected',
      timestamp: dbTest.rows[0].now
    };
  } catch (error) {
    results.backend.database = { status: 'error', message: error.message };
  }

  // Test external GTM API
  try {
    const gtmHealth = await axios.get('https://gtm.edwinlovett.com/api/health', { timeout: 5000 });
    results.externalServices.gtmApi = {
      status: 'ok',
      message: 'GTM API is operational',
      version: gtmHealth.data.version,
      uptime: gtmHealth.data.uptime
    };
  } catch (error) {
    results.externalServices.gtmApi = {
      status: 'error',
      message: error.code === 'ECONNABORTED' ? 'Timeout' : error.message
    };
  }

  // Test key endpoints
  const endpoints = [
    { method: 'GET', path: '/api/brands', description: 'List brands' },
    { method: 'GET', path: '/api/target-audiences', description: 'List target audiences', query: '?brand_id=test' },
    { method: 'GET', path: '/api/products-services', description: 'List products/services', query: '?brand_id=test' },
    { method: 'GET', path: '/api/campaigns', description: 'List campaigns', query: '?brand_id=test' },
    { method: 'GET', path: '/api/competitor-analyses', description: 'List competitor analyses', query: '?brand_id=test' },
    { method: 'GET', path: '/api/ad-inspirations', description: 'List ad inspirations', query: '?brand_id=test&limit=1' }
  ];

  for (const endpoint of endpoints) {
    try {
      const url = `http://localhost:${PORT}${endpoint.path}${endpoint.query || ''}`;
      const response = await axios.get(url, { timeout: 3000 });
      results.endpoints.push({
        endpoint: endpoint.path,
        method: endpoint.method,
        description: endpoint.description,
        status: 'ok',
        responseTime: response.headers['x-response-time'] || 'N/A',
        dataCount: response.data.data?.length || 0
      });
    } catch (error) {
      results.endpoints.push({
        endpoint: endpoint.path,
        method: endpoint.method,
        description: endpoint.description,
        status: 'error',
        message: error.message
      });
    }
  }

  res.json(results);
});

// Status Dashboard - HTML interface
app.get('/status', async (req, res) => {
  let backendStatus = 'ok';
  let databaseStatus = { status: 'unknown', time: null, error: null };
  let gtmApiStatus = { status: 'unknown', data: null, error: null };
  let brandCount = 0;

  // Check database
  try {
    const dbTest = await pool.query('SELECT NOW()');
    const brandCountResult = await pool.query('SELECT COUNT(*) FROM brands');
    databaseStatus = { status: 'ok', time: dbTest.rows[0].now, error: null };
    brandCount = parseInt(brandCountResult.rows[0].count);
  } catch (error) {
    databaseStatus = { status: 'error', time: null, error: error.message };
  }

  // Check GTM API
  try {
    const gtmHealth = await axios.get('https://gtm.edwinlovett.com/api/health', { timeout: 5000 });
    gtmApiStatus = { status: 'ok', data: gtmHealth.data, error: null };
  } catch (error) {
    gtmApiStatus = { status: 'error', data: null, error: error.message };
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>System Status Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
      color: #ffffff;
      padding: 40px 20px;
      min-height: 100vh;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #333;
    }
    .header h1 {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 10px;
      background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .timestamp {
      color: #888;
      font-size: 0.9rem;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .card {
      background: #1e1e1e;
      border-radius: 12px;
      padding: 24px;
      border: 1px solid #333;
      transition: transform 0.2s;
    }
    .card:hover { transform: translateY(-2px); }
    .card-title {
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .status-ok { background: #059669; color: #fff; }
    .status-error { background: #dc2626; color: #fff; }
    .status-unknown { background: #6b7280; color: #fff; }
    .metric {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #2a2a2a;
    }
    .metric:last-child { border-bottom: none; }
    .metric-label { color: #888; font-size: 0.9rem; }
    .metric-value { color: #fff; font-weight: 600; }
    .endpoints-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    .endpoints-table th {
      text-align: left;
      padding: 12px;
      background: #2a2a2a;
      font-weight: 600;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .endpoints-table td {
      padding: 12px;
      border-bottom: 1px solid #2a2a2a;
      font-size: 0.9rem;
    }
    .endpoints-table tr:hover { background: #252525; }
    .endpoint-method {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      background: #374151;
      color: #fff;
    }
    .endpoint-method.get { background: #059669; }
    .endpoint-method.post { background: #2563eb; }
    .endpoint-method.put { background: #d97706; }
    .endpoint-method.delete { background: #dc2626; }
    .refresh-btn {
      background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      font-size: 1rem;
      transition: transform 0.2s;
    }
    .refresh-btn:hover { transform: scale(1.05); }
    .actions { text-align: center; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 System Status Dashboard</h1>
      <div class="timestamp">Last updated: ${new Date().toLocaleString()}</div>
    </div>

    <div class="grid">
      <!-- Backend Status -->
      <div class="card">
        <div class="card-title">
          ⚡ Backend Server
          <span class="status-badge status-${backendStatus}">${backendStatus.toUpperCase()}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Environment</span>
          <span class="metric-value">${process.env.NODE_ENV || 'development'}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Port</span>
          <span class="metric-value">${PORT}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Uptime</span>
          <span class="metric-value">${Math.floor(process.uptime())} seconds</span>
        </div>
      </div>

      <!-- Database Status -->
      <div class="card">
        <div class="card-title">
          💾 PostgreSQL Database
          <span class="status-badge status-${databaseStatus.status}">${databaseStatus.status.toUpperCase()}</span>
        </div>
        ${databaseStatus.status === 'ok' ? `
          <div class="metric">
            <span class="metric-label">Connection</span>
            <span class="metric-value">Connected</span>
          </div>
          <div class="metric">
            <span class="metric-label">Server Time</span>
            <span class="metric-value">${new Date(databaseStatus.time).toLocaleTimeString()}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Total Brands</span>
            <span class="metric-value">${brandCount}</span>
          </div>
        ` : `
          <div class="metric">
            <span class="metric-label">Error</span>
            <span class="metric-value" style="color: #ef4444;">${databaseStatus.error}</span>
          </div>
        `}
      </div>

      <!-- GTM API Status -->
      <div class="card">
        <div class="card-title">
          🔍 GTM Brand Extractor API
          <span class="status-badge status-${gtmApiStatus.status}">${gtmApiStatus.status.toUpperCase()}</span>
        </div>
        ${gtmApiStatus.status === 'ok' ? `
          <div class="metric">
            <span class="metric-label">Status</span>
            <span class="metric-value">${gtmApiStatus.data.status}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Version</span>
            <span class="metric-value">${gtmApiStatus.data.version || 'N/A'}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Uptime</span>
            <span class="metric-value">${gtmApiStatus.data.uptime || 'N/A'}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Mode</span>
            <span class="metric-value">${gtmApiStatus.data.mode || 'N/A'}</span>
          </div>
        ` : `
          <div class="metric">
            <span class="metric-label">Error</span>
            <span class="metric-value" style="color: #ef4444;">${gtmApiStatus.error}</span>
          </div>
        `}
      </div>
    </div>

    <!-- API Endpoints -->
    <div class="card" style="grid-column: 1 / -1;">
      <div class="card-title">📡 API Endpoints</div>
      <table class="endpoints-table">
        <thead>
          <tr>
            <th>Method</th>
            <th>Endpoint</th>
            <th>Description</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span class="endpoint-method get">GET</span></td>
            <td>/health</td>
            <td>Backend health check</td>
            <td><span class="status-badge status-ok">OK</span></td>
          </tr>
          <tr>
            <td><span class="endpoint-method get">GET</span></td>
            <td>/status</td>
            <td>System status dashboard</td>
            <td><span class="status-badge status-ok">OK</span></td>
          </tr>
          <tr>
            <td><span class="endpoint-method get">GET</span></td>
            <td>/api/test-all</td>
            <td>Comprehensive endpoint testing</td>
            <td><span class="status-badge status-ok">OK</span></td>
          </tr>
          <tr>
            <td><span class="endpoint-method post">POST</span></td>
            <td>/api/extract-brand</td>
            <td>Extract brand assets from URL</td>
            <td><span class="status-badge status-${gtmApiStatus.status}">${gtmApiStatus.status.toUpperCase()}</span></td>
          </tr>
          <tr>
            <td><span class="endpoint-method get">GET</span></td>
            <td>/api/brands</td>
            <td>List all brands</td>
            <td><span class="status-badge status-${databaseStatus.status}">${databaseStatus.status.toUpperCase()}</span></td>
          </tr>
          <tr>
            <td><span class="endpoint-method post">POST</span></td>
            <td>/api/brands</td>
            <td>Create new brand</td>
            <td><span class="status-badge status-${databaseStatus.status}">${databaseStatus.status.toUpperCase()}</span></td>
          </tr>
          <tr>
            <td><span class="endpoint-method get">GET</span></td>
            <td>/api/target-audiences</td>
            <td>List target audiences</td>
            <td><span class="status-badge status-${databaseStatus.status}">${databaseStatus.status.toUpperCase()}</span></td>
          </tr>
          <tr>
            <td><span class="endpoint-method get">GET</span></td>
            <td>/api/products-services</td>
            <td>List products/services</td>
            <td><span class="status-badge status-${databaseStatus.status}">${databaseStatus.status.toUpperCase()}</span></td>
          </tr>
          <tr>
            <td><span class="endpoint-method get">GET</span></td>
            <td>/api/campaigns</td>
            <td>List marketing campaigns</td>
            <td><span class="status-badge status-${databaseStatus.status}">${databaseStatus.status.toUpperCase()}</span></td>
          </tr>
          <tr>
            <td><span class="endpoint-method get">GET</span></td>
            <td>/api/competitor-analyses</td>
            <td>List competitor analyses</td>
            <td><span class="status-badge status-${databaseStatus.status}">${databaseStatus.status.toUpperCase()}</span></td>
          </tr>
          <tr>
            <td><span class="endpoint-method get">GET</span></td>
            <td>/api/ad-inspirations</td>
            <td>List ad inspirations</td>
            <td><span class="status-badge status-${databaseStatus.status}">${databaseStatus.status.toUpperCase()}</span></td>
          </tr>
          <tr>
            <td><span class="endpoint-method post">POST</span></td>
            <td>/api/ai/*</td>
            <td>AI generation endpoints</td>
            <td><span class="status-badge status-ok">OK</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="actions">
      <button class="refresh-btn" onclick="window.location.reload()">🔄 Refresh Status</button>
      <a href="/api/test-all" target="_blank">
        <button class="refresh-btn" style="margin-left: 10px; background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);">
          🧪 Run Full Test Suite
        </button>
      </a>
    </div>
  </div>
</body>
</html>
  `;

  res.send(html);
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
      timeout: 65000 // 65 second timeout
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

    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return res.status(504).json({
        success: false,
        error: 'Brand extraction timed out. The website may be slow or complex. Please try again.'
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

// Brand Profile endpoints
// GET - Fetch brand profile by brand_id
app.get('/api/brand-profile', async (req, res) => {
  try {
    const { brand_id } = req.query;

    if (!brand_id) {
      return res.status(400).json({
        success: false,
        error: 'brand_id is required'
      });
    }

    const result = await pool.query(
      'SELECT * FROM brand_profiles WHERE brand_id = $1',
      [brand_id]
    );

    res.json({
      success: true,
      data: result.rows[0] || null
    });
  } catch (error) {
    console.error('Error fetching brand profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch brand profile'
    });
  }
});

// POST - Create or update brand profile
app.post('/api/brand-profile', async (req, res) => {
  try {
    const {
      brand_id,
      job_id,
      profile_status,
      brand_name,
      tagline,
      story,
      mission,
      positioning,
      value_props,
      personality,
      tone_sliders,
      lexicon_preferred,
      lexicon_avoid,
      primary_audience,
      audience_needs,
      audience_pain_points,
      sentence_length,
      paragraph_style,
      formatting_guidelines,
      writing_avoid,
      pages_crawled,
      reviews_analyzed,
      analysis_duration,
      review_sources,
      confidence_score,
      raw_response
    } = req.body;

    if (!brand_id) {
      return res.status(400).json({
        success: false,
        error: 'brand_id is required'
      });
    }

    // Check if profile already exists
    const existing = await pool.query(
      'SELECT id FROM brand_profiles WHERE brand_id = $1',
      [brand_id]
    );

    let result;
    if (existing.rows.length > 0) {
      // Update existing
      result = await pool.query(
        `UPDATE brand_profiles
         SET job_id = COALESCE($1, job_id),
             profile_status = COALESCE($2, profile_status),
             brand_name = COALESCE($3, brand_name),
             tagline = COALESCE($4, tagline),
             story = COALESCE($5, story),
             mission = COALESCE($6, mission),
             positioning = COALESCE($7, positioning),
             value_props = COALESCE($8, value_props),
             personality = COALESCE($9, personality),
             tone_sliders = COALESCE($10, tone_sliders),
             lexicon_preferred = COALESCE($11, lexicon_preferred),
             lexicon_avoid = COALESCE($12, lexicon_avoid),
             primary_audience = COALESCE($13, primary_audience),
             audience_needs = COALESCE($14, audience_needs),
             audience_pain_points = COALESCE($15, audience_pain_points),
             sentence_length = COALESCE($16, sentence_length),
             paragraph_style = COALESCE($17, paragraph_style),
             formatting_guidelines = COALESCE($18, formatting_guidelines),
             writing_avoid = COALESCE($19, writing_avoid),
             pages_crawled = COALESCE($20, pages_crawled),
             reviews_analyzed = COALESCE($21, reviews_analyzed),
             analysis_duration = COALESCE($22, analysis_duration),
             review_sources = COALESCE($23, review_sources),
             confidence_score = COALESCE($24, confidence_score),
             raw_response = COALESCE($25, raw_response),
             updated_at = CURRENT_TIMESTAMP
         WHERE brand_id = $26
         RETURNING *`,
        [
          job_id, profile_status, brand_name, tagline, story, mission, positioning,
          value_props ? JSON.stringify(value_props) : null,
          personality ? JSON.stringify(personality) : null,
          tone_sliders ? JSON.stringify(tone_sliders) : null,
          lexicon_preferred ? JSON.stringify(lexicon_preferred) : null,
          lexicon_avoid ? JSON.stringify(lexicon_avoid) : null,
          primary_audience,
          audience_needs ? JSON.stringify(audience_needs) : null,
          audience_pain_points ? JSON.stringify(audience_pain_points) : null,
          sentence_length, paragraph_style, formatting_guidelines,
          writing_avoid ? JSON.stringify(writing_avoid) : null,
          pages_crawled, reviews_analyzed, analysis_duration,
          review_sources ? JSON.stringify(review_sources) : null,
          confidence_score,
          raw_response ? JSON.stringify(raw_response) : null,
          brand_id
        ]
      );
    } else {
      // Insert new
      result = await pool.query(
        `INSERT INTO brand_profiles (
          brand_id, job_id, profile_status, brand_name, tagline, story, mission, positioning,
          value_props, personality, tone_sliders, lexicon_preferred, lexicon_avoid,
          primary_audience, audience_needs, audience_pain_points, sentence_length,
          paragraph_style, formatting_guidelines, writing_avoid, pages_crawled,
          reviews_analyzed, analysis_duration, review_sources, confidence_score, raw_response
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
        RETURNING *`,
        [
          brand_id, job_id || null, profile_status || 'completed', brand_name || null,
          tagline || null, story || null, mission || null, positioning || null,
          JSON.stringify(value_props || []),
          JSON.stringify(personality || []),
          JSON.stringify(tone_sliders || {}),
          JSON.stringify(lexicon_preferred || []),
          JSON.stringify(lexicon_avoid || []),
          primary_audience || null,
          JSON.stringify(audience_needs || []),
          JSON.stringify(audience_pain_points || []),
          sentence_length || null, paragraph_style || null,
          formatting_guidelines || null,
          JSON.stringify(writing_avoid || []),
          pages_crawled || 0, reviews_analyzed || 0, analysis_duration || null,
          JSON.stringify(review_sources || {}),
          confidence_score || null,
          JSON.stringify(raw_response || null)
        ]
      );
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error saving brand profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save brand profile'
    });
  }
});

// Brand Images endpoints
// GET - Fetch brand images by brand_id
app.get('/api/brand-images', async (req, res) => {
  try {
    const { brand_id } = req.query;

    if (!brand_id) {
      return res.status(400).json({
        success: false,
        error: 'brand_id is required'
      });
    }

    const result = await pool.query(
      'SELECT * FROM brand_images WHERE brand_id = $1 ORDER BY relevance_score DESC, created_at DESC',
      [brand_id]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching brand images:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch brand images'
    });
  }
});

// POST - Save brand images (upsert by brand_id + page_url)
// Supports both single page and bulk save (array of pages)
app.post('/api/brand-images', async (req, res) => {
  try {
    const { brand_id, pages, page_url, page_title, page_category, relevance_score, images, images_count } = req.body;

    if (!brand_id) {
      return res.status(400).json({
        success: false,
        error: 'brand_id is required'
      });
    }

    // Handle bulk save (array of pages)
    if (pages && Array.isArray(pages)) {
      const results = [];

      for (const page of pages) {
        const result = await pool.query(
          `INSERT INTO brand_images (brand_id, page_url, page_title, page_category, relevance_score, images, images_count)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (brand_id, page_url)
           DO UPDATE SET
             page_title = EXCLUDED.page_title,
             page_category = EXCLUDED.page_category,
             relevance_score = EXCLUDED.relevance_score,
             images = EXCLUDED.images,
             images_count = EXCLUDED.images_count,
             last_fetched_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
           RETURNING *`,
          [
            brand_id,
            page.page_url,
            page.page_title || null,
            page.page_category || null,
            page.relevance_score || null,
            JSON.stringify(page.images || []),
            page.images_count || (page.images?.length || 0)
          ]
        );
        results.push(result.rows[0]);
      }

      return res.json({
        success: true,
        data: results,
        count: results.length
      });
    }

    // Handle single page save
    if (!page_url) {
      return res.status(400).json({
        success: false,
        error: 'page_url is required for single page save, or provide pages array for bulk save'
      });
    }

    const result = await pool.query(
      `INSERT INTO brand_images (brand_id, page_url, page_title, page_category, relevance_score, images, images_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (brand_id, page_url)
       DO UPDATE SET
         page_title = EXCLUDED.page_title,
         page_category = EXCLUDED.page_category,
         relevance_score = EXCLUDED.relevance_score,
         images = EXCLUDED.images,
         images_count = EXCLUDED.images_count,
         last_fetched_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        brand_id,
        page_url,
        page_title || null,
        page_category || null,
        relevance_score || null,
        JSON.stringify(images || []),
        images_count || (images?.length || 0)
      ]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error saving brand images:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save brand images'
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

    // Fetch offers for each product
    const productsWithOffers = await Promise.all(result.rows.map(async (product) => {
      const offersResult = await pool.query(
        'SELECT id, offer_text, expiration_date FROM product_offers WHERE product_service_id = $1 ORDER BY created_at ASC',
        [product.id]
      );
      return {
        ...product,
        offers: offersResult.rows
      };
    }));

    res.json({
      success: true,
      data: productsWithOffers
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
    const { brand_id, name, category, description, price, cturl, features, offers, image_url, image_urls, default_image_url } = req.body;

    if (!brand_id || !name || !category) {
      return res.status(400).json({
        success: false,
        error: 'brand_id, name, and category are required'
      });
    }

    // Support both old (image_url) and new (image_urls/default_image_url) formats
    const imageUrlsArray = image_urls || (image_url ? [image_url] : []);
    const defaultImage = default_image_url || image_url || null;

    const result = await pool.query(
      `INSERT INTO products_services (brand_id, name, category, description, price, cturl, features, image_url, image_urls, default_image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [brand_id, name, category, description, price, cturl, JSON.stringify(features || []), image_url, imageUrlsArray, defaultImage]
    );

    const product = result.rows[0];

    // Insert offers if provided
    if (offers && offers.length > 0) {
      for (const offer of offers) {
        await pool.query(
          `INSERT INTO product_offers (product_service_id, offer_text, expiration_date)
           VALUES ($1, $2, $3)`,
          [product.id, offer.offer_text, offer.expiration_date || null]
        );
      }
    }

    // Fetch the complete product with offers
    const offersResult = await pool.query(
      'SELECT id, offer_text, expiration_date FROM product_offers WHERE product_service_id = $1 ORDER BY created_at ASC',
      [product.id]
    );

    res.status(201).json({
      success: true,
      data: {
        ...product,
        offers: offersResult.rows
      }
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
    const { id, name, category, description, price, cturl, features, offers, image_url, image_urls, default_image_url } = req.body;

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
           cturl = COALESCE($5, cturl),
           features = COALESCE($6, features),
           image_url = COALESCE($7, image_url),
           image_urls = COALESCE($8, image_urls),
           default_image_url = COALESCE($9, default_image_url)
       WHERE id = $10
       RETURNING *`,
      [name, category, description, price, cturl, features ? JSON.stringify(features) : null, image_url, image_urls, default_image_url, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product/service not found'
      });
    }

    // Handle offers update if provided
    if (offers !== undefined) {
      // Delete existing offers
      await pool.query(
        'DELETE FROM product_offers WHERE product_service_id = $1',
        [id]
      );

      // Insert new offers
      if (offers.length > 0) {
        for (const offer of offers) {
          await pool.query(
            `INSERT INTO product_offers (product_service_id, offer_text, expiration_date)
             VALUES ($1, $2, $3)`,
            [id, offer.offer_text, offer.expiration_date || null]
          );
        }
      }
    }

    // Fetch the complete product with offers
    const offersResult = await pool.query(
      'SELECT id, offer_text, expiration_date FROM product_offers WHERE product_service_id = $1 ORDER BY created_at ASC',
      [id]
    );

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        offers: offersResult.rows
      }
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

// GET - Get all target audiences for a brand OR a single audience by ID
app.get('/api/target-audiences', async (req, res) => {
  try {
    const { brand_id, id } = req.query;
    console.log('📋 Target Audiences GET - Query params:', { brand_id, id });

    // If fetching by ID (for editing)
    if (id) {
      console.log(`🔍 Fetching single audience with id: ${id}`);
      const result = await pool.query(
        'SELECT * FROM target_audiences WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Target audience not found'
        });
      }

      const row = result.rows[0];
      console.log(`✅ Found audience: ${row.name}`);

      // Return single audience (no transformation needed for edit page)
      return res.json({
        success: true,
        data: {
          id: row.id,
          name: row.name,
          description: row.description,
          demographics: row.demographics,
          interests: row.interests || [],
          pain_points: row.pain_points || [],
          goals: row.goals || [],
          budget_range: row.budget_range || '',
          channels: row.channels || []
        }
      });
    }

    // If fetching all audiences for a brand
    if (!brand_id) {
      return res.status(400).json({
        success: false,
        error: 'brand_id or id is required'
      });
    }

    console.log(`🔍 Fetching all audiences for brand: ${brand_id}`);
    const result = await pool.query(
      'SELECT * FROM target_audiences WHERE brand_id = $1 ORDER BY created_at DESC',
      [brand_id]
    );

    console.log(`✅ Found ${result.rows.length} audience(s)`);

    // Transform snake_case to camelCase for frontend
    const transformedData = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      demographics: row.demographics,
      interests: row.interests || [],
      painPoints: row.pain_points || [],
      goals: row.goals || [],
      budgetRange: row.budget_range || '',
      channels: row.channels || []
    }));

    res.json({
      success: true,
      data: transformedData
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
    const {
      brand_id,
      name,
      description,
      age_range,
      gender,
      location,
      income_level,
      education,
      occupation,
      interests,
      values,
      lifestyle,
      pain_points,
      goals,
      buying_behavior,
      budget_range,
      channels
    } = req.body;

    if (!brand_id || !name) {
      return res.status(400).json({
        success: false,
        error: 'brand_id and name are required'
      });
    }

    // Build demographics text from individual fields
    const demographicsText = [
      age_range && `Age: ${age_range}`,
      gender && `Gender: ${gender}`,
      location && `Location: ${location}`,
      income_level && `Income: ${income_level}`,
      education && `Education: ${education}`,
      occupation && `Occupation: ${occupation}`,
      lifestyle && `Lifestyle: ${lifestyle}`,
      buying_behavior && `Buying Behavior: ${buying_behavior}`
    ].filter(Boolean).join(' | ');

    const result = await pool.query(
      `INSERT INTO target_audiences (brand_id, name, description, demographics, interests, pain_points, goals, budget_range, channels)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        brand_id,
        name,
        description || null,
        demographicsText || null,
        JSON.stringify(interests || []),
        JSON.stringify(pain_points || []),
        JSON.stringify(goals || []),
        budget_range || null,
        JSON.stringify(channels || [])
      ]
    );

    // Transform response to camelCase
    const transformedData = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      description: result.rows[0].description,
      demographics: result.rows[0].demographics,
      interests: result.rows[0].interests || [],
      painPoints: result.rows[0].pain_points || [],
      goals: result.rows[0].goals || [],
      budgetRange: result.rows[0].budget_range || '',
      channels: result.rows[0].channels || []
    };

    res.status(201).json({
      success: true,
      data: transformedData
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
    const {
      id,
      name,
      description,
      age_range,
      gender,
      location,
      income_level,
      education,
      occupation,
      interests,
      values,
      lifestyle,
      pain_points,
      goals,
      buying_behavior,
      budget_range,
      channels
    } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'id is required'
      });
    }

    // Build demographics text from individual fields if provided
    let demographicsText = null;
    if (age_range || gender || location || income_level || education || occupation || lifestyle || buying_behavior) {
      demographicsText = [
        age_range && `Age: ${age_range}`,
        gender && `Gender: ${gender}`,
        location && `Location: ${location}`,
        income_level && `Income: ${income_level}`,
        education && `Education: ${education}`,
        occupation && `Occupation: ${occupation}`,
        lifestyle && `Lifestyle: ${lifestyle}`,
        buying_behavior && `Buying Behavior: ${buying_behavior}`
      ].filter(Boolean).join(' | ');
    }

    const result = await pool.query(
      `UPDATE target_audiences
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           demographics = COALESCE($3, demographics),
           interests = COALESCE($4, interests),
           pain_points = COALESCE($5, pain_points),
           goals = COALESCE($6, goals),
           budget_range = COALESCE($7, budget_range),
           channels = COALESCE($8, channels)
       WHERE id = $9
       RETURNING *`,
      [
        name,
        description,
        demographicsText,
        interests ? JSON.stringify(interests) : null,
        pain_points ? JSON.stringify(pain_points) : null,
        goals ? JSON.stringify(goals) : null,
        budget_range,
        channels ? JSON.stringify(channels) : null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Target audience not found'
      });
    }

    // Transform response to camelCase
    const transformedData = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      description: result.rows[0].description,
      demographics: result.rows[0].demographics,
      interests: result.rows[0].interests || [],
      painPoints: result.rows[0].pain_points || [],
      goals: result.rows[0].goals || [],
      budgetRange: result.rows[0].budget_range || '',
      channels: result.rows[0].channels || []
    };

    res.json({
      success: true,
      data: transformedData
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
    const { brand_id, name, objective, product_service_id, marketing_objectives, other_objective, target_audience_ids, start_date, end_date, channels, status } = req.body;

    if (!brand_id || !name || !objective) {
      return res.status(400).json({
        success: false,
        error: 'brand_id, name, and objective are required'
      });
    }

    const result = await pool.query(
      `INSERT INTO campaigns (brand_id, name, objective, product_service_id, marketing_objectives, other_objective, target_audience_ids, start_date, end_date, channels, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [brand_id, name, objective, product_service_id, JSON.stringify(marketing_objectives || []), other_objective, JSON.stringify(target_audience_ids || []), start_date, end_date, JSON.stringify(channels || []), status || 'draft']
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
    const { id, name, objective, product_service_id, marketing_objectives, other_objective, target_audience_ids, start_date, end_date, channels, status } = req.body;

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
           product_service_id = COALESCE($3, product_service_id),
           marketing_objectives = COALESCE($4, marketing_objectives),
           other_objective = COALESCE($5, other_objective),
           target_audience_ids = COALESCE($6, target_audience_ids),
           start_date = COALESCE($7, start_date),
           end_date = COALESCE($8, end_date),
           channels = COALESCE($9, channels),
           status = COALESCE($10, status)
       WHERE id = $11
       RETURNING *`,
      [name, objective, product_service_id, marketing_objectives ? JSON.stringify(marketing_objectives) : null, other_objective, target_audience_ids ? JSON.stringify(target_audience_ids) : null, start_date, end_date, channels ? JSON.stringify(channels) : null, status, id]
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
// BRAND SETTINGS ENDPOINTS
// ============================================

// GET - Get brand settings for a brand
app.get('/api/brand-settings', async (req, res) => {
  try {
    const { brand_id } = req.query;

    if (!brand_id) {
      return res.status(400).json({
        success: false,
        error: 'brand_id is required'
      });
    }

    const result = await pool.query(
      'SELECT * FROM brand_settings WHERE brand_id = $1',
      [brand_id]
    );

    res.json({
      success: true,
      data: result.rows[0] || null
    });
  } catch (error) {
    console.error('Error fetching brand settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch brand settings'
    });
  }
});

// POST/PUT - Save or update brand settings
app.post('/api/brand-settings', async (req, res) => {
  try {
    const {
      brand_id,
      creative_guidelines,
      ad_copy_guidelines,
      brand_guidelines,
      emoji_usage,
      tone_preferences
    } = req.body;

    if (!brand_id) {
      return res.status(400).json({
        success: false,
        error: 'brand_id is required'
      });
    }

    // Check if settings already exist
    const existing = await pool.query(
      'SELECT id FROM brand_settings WHERE brand_id = $1',
      [brand_id]
    );

    let result;
    if (existing.rows.length > 0) {
      // Update existing
      result = await pool.query(
        `UPDATE brand_settings
         SET creative_guidelines = COALESCE($1, creative_guidelines),
             ad_copy_guidelines = COALESCE($2, ad_copy_guidelines),
             brand_guidelines = COALESCE($3, brand_guidelines),
             emoji_usage = COALESCE($4, emoji_usage),
             tone_preferences = COALESCE($5, tone_preferences),
             updated_at = CURRENT_TIMESTAMP
         WHERE brand_id = $6
         RETURNING *`,
        [
          creative_guidelines,
          ad_copy_guidelines,
          brand_guidelines,
          emoji_usage,
          tone_preferences ? JSON.stringify(tone_preferences) : null,
          brand_id
        ]
      );
    } else {
      // Insert new
      result = await pool.query(
        `INSERT INTO brand_settings (brand_id, creative_guidelines, ad_copy_guidelines, brand_guidelines, emoji_usage, tone_preferences)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          brand_id,
          creative_guidelines || null,
          ad_copy_guidelines || null,
          brand_guidelines || null,
          emoji_usage || 'auto',
          JSON.stringify(tone_preferences || {})
        ]
      );
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error saving brand settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save brand settings'
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
      analysis_confidence,
      analysis_start_date,
      analysis_end_date
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
        key_findings, analysis_model, analysis_confidence,
        analysis_start_date, analysis_end_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
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
        analysis_confidence,
        analysis_start_date,
        analysis_end_date
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
      model: 'claude-3-7-sonnet-20250219',
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
    const { brand_id, audience_description } = req.body;

    if (!brand_id) {
      return res.status(400).json({
        success: false,
        error: 'brand_id is required'
      });
    }

    console.log(`🤖 Generating target audiences for brand: ${brand_id}`);
    if (audience_description) {
      console.log(`📝 User description: ${audience_description}`);
    }

    // Get brand data
    const brandResult = await pool.query('SELECT * FROM brands WHERE id = $1', [brand_id]);
    if (brandResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Brand not found'
      });
    }
    const brand = brandResult.rows[0];

    // Get brand intelligence
    const intelligenceResult = await pool.query(
      'SELECT * FROM brand_intelligence WHERE brand_id = $1 ORDER BY created_at DESC LIMIT 1',
      [brand_id]
    );
    const intelligence = intelligenceResult.rows[0] || null;

    // Get products/services
    const productsResult = await pool.query(
      'SELECT * FROM products_services WHERE brand_id = $1',
      [brand_id]
    );
    const products = productsResult.rows;

    // Get competitor analyses
    const competitorsResult = await pool.query(
      'SELECT competitor_name, overview, positioning FROM competitor_analyses WHERE brand_id = $1 ORDER BY created_at DESC LIMIT 3',
      [brand_id]
    );
    const competitors = competitorsResult.rows;

    const claudeApiKey = process.env.VITE_CLAUDE_API_KEY;
    if (!claudeApiKey) {
      return res.status(503).json({
        success: false,
        error: 'Claude API key not configured'
      });
    }

    // Build context from available data
    let contextParts = [];

    contextParts.push(`Brand: ${brand.name}`);

    if (intelligence) {
      contextParts.push(`Industry: ${intelligence.industry || 'N/A'}`);
      contextParts.push(`Mission: ${intelligence.mission || 'N/A'}`);
      contextParts.push(`Values: ${JSON.stringify(intelligence.values) || 'N/A'}`);
      contextParts.push(`Target Market: ${intelligence.target_market || 'N/A'}`);
      contextParts.push(`UVP: ${intelligence.unique_value_proposition || 'N/A'}`);
    }

    if (products.length > 0) {
      contextParts.push(`Products/Services: ${products.map(p => p.name).join(', ')}`);
    }

    if (competitors.length > 0) {
      contextParts.push(`Competitor Insights: ${competitors.map(c => `${c.competitor_name}: ${c.positioning || c.overview}`).join('; ')}`);
    }

    if (audience_description) {
      contextParts.push(`User's Audience Description: ${audience_description}`);
    }

    const context = contextParts.join('\n');

    const prompt = `Based on this brand context, generate exactly 3 detailed target audience personas:

${context}

Generate and return ONLY a valid JSON array with exactly 3 audience personas. Each persona must have this exact structure:
[
  {
    "name": "Persona Name (e.g., 'Tech-Savvy Millennials')",
    "age_range": "25-35",
    "gender": "All",
    "location": "Urban areas",
    "income_level": "$50k-$100k",
    "education": "Bachelor's degree or higher",
    "occupation": "Professional/Manager",
    "interests": ["interest1", "interest2", "interest3"],
    "values": ["value1", "value2"],
    "lifestyle": "Lifestyle description",
    "pain_points": ["pain1", "pain2"],
    "goals": ["goal1", "goal2"],
    "buying_behavior": "How they make decisions"
  }
]

IMPORTANT: Return ONLY the JSON array, no markdown, no explanations, no other text.`;

    const claudeResponse = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-7-sonnet-20250219',
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

    let aiResponse = claudeResponse.data.content[0].text.trim();

    // Remove markdown code blocks if present
    if (aiResponse.startsWith('```')) {
      aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }

    const audiences = JSON.parse(aiResponse);

    console.log(`✅ Generated ${audiences.length} target audiences`);

    // Return audiences WITHOUT saving to DB (frontend will handle saving selected ones)
    res.json({
      success: true,
      data: audiences
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
    // Accept both parameter name formats for compatibility
    const {
      brand_id,
      competitor_name,
      facebook_page,
      start_date,
      end_date,
      analysis_start_date,
      analysis_end_date
    } = req.body;

    const startDate = analysis_start_date || start_date;
    const endDate = analysis_end_date || end_date;

    if (!brand_id || !competitor_name) {
      return res.status(400).json({
        success: false,
        error: 'brand_id and competitor_name are required'
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'start_date/analysis_start_date and end_date/analysis_end_date are required'
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
    // Use facebook_page for more accurate results, fallback to competitor_name
    const searchQuery = facebook_page || competitor_name;
    console.log(`🔍 Fetching competitor ads from Foreplay (query: "${searchQuery}")...`);

    const searchResponse = await axios.get('https://public.api.foreplay.co/api/discovery/ads', {
      headers: {
        'Authorization': foreplayApiKey
      },
      params: {
        query: searchQuery,
        advertiser: facebook_page || undefined, // Try advertiser filter if FB page provided
        limit: 50, // Increased limit for better results
        order: 'most_relevant',
        geo_location: 'US',
        languages: 'English'
      },
      timeout: 30000
    });

    const ads = searchResponse.data?.data || [];

    if (ads.length === 0) {
      return res.status(200).json({
        success: false,
        error: 'No ads found for this competitor in Foreplay database. Try using a broader search term or different competitor name.'
      });
    }

    // Filter ads by date range
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const filteredAds = ads.filter(ad => {
      if (!ad.started_running) return false;
      const adDate = new Date(ad.started_running);
      return adDate >= startDateObj && adDate <= endDateObj;
    });

    if (filteredAds.length === 0) {
      return res.status(200).json({
        success: false,
        error: 'No ads were running during the selected time period. Try expanding the date range or using "All Time".'
      });
    }

    console.log(`✅ Found ${filteredAds.length} ads in date range, analyzing with AI...`);

    // Use Claude to analyze the ads
    const claudeApiKey = process.env.VITE_CLAUDE_API_KEY;
    if (!claudeApiKey) {
      return res.status(503).json({
        success: false,
        error: 'Claude API key not configured'
      });
    }

    const prompt = `Analyze these ${filteredAds.length} competitor ads and provide a comprehensive analysis:

Competitor: ${competitor_name}
Ads Data: ${JSON.stringify(filteredAds.slice(0, 20), null, 2)}

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
      model: 'claude-3-7-sonnet-20250219',
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

    // Remove markdown code fences if present
    let cleanedText = aiResponse.trim();
    cleanedText = cleanedText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');

    // Extract JSON object
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    // Save analysis to database
    const result = await pool.query(
      `INSERT INTO competitor_analyses (
        brand_id, competitor_name, facebook_page, total_ads_analyzed, ad_ids, ads_data,
        overview, positioning, creative_strategy, messaging_analysis, visual_design_elements,
        target_audience_insights, performance_indicators, recommendations, key_findings,
        analysis_model, analysis_confidence, analysis_start_date, analysis_end_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        brand_id,
        competitor_name,
        facebook_page,
        filteredAds.length,
        JSON.stringify(filteredAds.map(ad => ad.id)),
        JSON.stringify(filteredAds),
        analysis.overview,
        analysis.positioning,
        JSON.stringify(analysis.creative_strategy),
        JSON.stringify(analysis.messaging_analysis),
        JSON.stringify(analysis.visual_design_elements),
        JSON.stringify(analysis.target_audience_insights),
        JSON.stringify(analysis.performance_indicators),
        JSON.stringify(analysis.recommendations),
        JSON.stringify(analysis.key_findings),
        'claude-3-7-sonnet-20250219',
        0.85,
        startDate,
        endDate
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
      model: 'claude-3-7-sonnet-20250219',
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
      model: 'claude-3-7-sonnet-20250219',
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

// ============================================
// AD COPY GENERATION ENDPOINTS
// ============================================

// POST - Generate ad copy for a specific channel
app.post('/api/ai/generate-ad-copy', async (req, res) => {
  try {
    const {
      brand_id,
      campaign_id,
      channel,
      product_service_id,
      target_audience_ids,
      marketing_objectives
    } = req.body;

    if (!brand_id || !campaign_id || !channel) {
      return res.status(400).json({
        success: false,
        error: 'brand_id, campaign_id, and channel are required'
      });
    }

    console.log(`🤖 Generating ad copy for channel: ${channel}`);

    // Gather all context
    const context = {};

    // 1. Get brand intelligence
    const intelligenceResult = await pool.query(
      'SELECT * FROM brand_intelligence WHERE brand_id = $1 ORDER BY created_at DESC LIMIT 1',
      [brand_id]
    );
    context.intelligence = intelligenceResult.rows[0] || null;

    // 2. Get brand settings (guidelines)
    const settingsResult = await pool.query(
      'SELECT * FROM brand_settings WHERE brand_id = $1',
      [brand_id]
    );
    context.settings = settingsResult.rows[0] || null;

    // 3. Get brand basic info
    const brandResult = await pool.query(
      'SELECT * FROM brands WHERE id = $1',
      [brand_id]
    );
    context.brand = brandResult.rows[0];

    // 4. Get campaign details
    const campaignResult = await pool.query(
      'SELECT * FROM campaigns WHERE id = $1',
      [campaign_id]
    );
    context.campaign = campaignResult.rows[0];

    // 5. Get product/service if specified
    if (product_service_id) {
      const productResult = await pool.query(
        'SELECT ps.*, array_agg(json_build_object(\'offer_text\', po.offer_text, \'expiration_date\', po.expiration_date)) as offers FROM products_services ps LEFT JOIN product_offers po ON ps.id = po.product_service_id WHERE ps.id = $1 AND (po.expiration_date IS NULL OR po.expiration_date > NOW()) GROUP BY ps.id',
        [product_service_id]
      );
      context.product = productResult.rows[0] || null;
    }

    // 6. Get target audiences if specified
    if (target_audience_ids && target_audience_ids.length > 0) {
      const audiencesResult = await pool.query(
        'SELECT * FROM target_audiences WHERE id = ANY($1)',
        [target_audience_ids]
      );
      context.audiences = audiencesResult.rows;
    }

    // Determine format and build prompt
    const isMetaChannel = channel === 'Meta';
    const isDisplayChannel = channel.includes('Display');

    let prompt = '';

    if (isMetaChannel) {
      // Meta/Facebook format
      const emojiInstruction = context.settings?.emoji_usage === 'never'
        ? 'NO EMOJIS'
        : context.settings?.emoji_usage === 'always'
        ? 'Use emojis'
        : 'Use emojis sparingly if appropriate';

      prompt = `You are generating Facebook/Meta ad copy for ${context.brand.name}.

BRAND CONTEXT:
${context.intelligence ? `
- Mission: ${context.intelligence.mission || 'N/A'}
- Brand Voice: ${JSON.stringify(context.intelligence.brand_voice) || 'N/A'}
- Brand Tone: ${context.intelligence.brand_tone || 'N/A'}
- Key Messages: ${JSON.stringify(context.intelligence.key_messages) || 'N/A'}
` : ''}

${context.product ? `
PRODUCT/SERVICE:
- Name: ${context.product.name}
- Category: ${context.product.category}
- Description: ${context.product.description}
- Features: ${JSON.stringify(context.product.features)}
- Price: ${context.product.price || 'Contact for pricing'}
${context.product.offers ? `- Active Offers: ${JSON.stringify(context.product.offers.filter(o => o.offer_text))}` : ''}
` : ''}

${context.audiences && context.audiences.length > 0 ? `
TARGET AUDIENCE:
${context.audiences.map(a => `- ${a.name}: ${a.description}`).join('\n')}
Pain Points: ${JSON.stringify(context.audiences[0]?.pain_points || [])}
Goals: ${JSON.stringify(context.audiences[0]?.goals || [])}
` : ''}

CAMPAIGN:
- Objective: ${context.campaign.objective}
- Marketing Objectives: ${JSON.stringify(context.campaign.marketing_objectives)}

${context.settings?.ad_copy_guidelines ? `
GUIDELINES:
${context.settings.ad_copy_guidelines}
` : ''}

REQUIREMENTS:
- Primary Text: Maximum 125 characters. ${emojiInstruction}
- Headline: Maximum 40 characters, compelling and clear.
- Link Description: Maximum 30 characters, action-oriented copy that complements the headline.
- Display Link: Use a clean domain format (e.g., '${context.brand.website?.replace(/^https?:\/\//, '').replace(/\/$/, '') || 'example.com'}').
- CTA: Choose from: Learn More, Shop Now, Sign Up, Download, Get Quote, Book Now, Apply Now, Contact Us.
- Ad Name: Brief, descriptive name including ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}. Focus on the content, avoid underscores or hyphens.

Generate 5 variants with different approaches:
1. Value-first (problem → outcome)
2. Offer-led (with urgency if applicable)
3. Proof-driven (trust/social proof)
4. Speed/convenience
5. Emotional connection

OUTPUT FORMAT (JSON array):
[
  {
    "postText": "primary text under 125 chars",
    "headline": "headline under 40 chars",
    "linkDescription": "supporting copy under 30 chars",
    "displayLink": "clean domain",
    "cta": "selected CTA from list",
    "adName": "descriptive campaign name under 50 chars",
    "reasoning": "brief explanation of creative approach"
  }
]

Return ONLY the JSON array, no other text.`;
    } else if (isDisplayChannel) {
      // Display Ads format
      prompt = `You are generating display banner ad copy for ${context.brand.name}.

BRAND CONTEXT:
${context.intelligence ? `
- Mission: ${context.intelligence.mission || 'N/A'}
- Brand Voice: ${JSON.stringify(context.intelligence.brand_voice) || 'N/A'}
- Brand Tone: ${context.intelligence.brand_tone || 'N/A'}
- Key Messages: ${JSON.stringify(context.intelligence.key_messages) || 'N/A'}
` : ''}

${context.product ? `
PRODUCT/SERVICE:
- Name: ${context.product.name}
- Description: ${context.product.description}
- Features: ${JSON.stringify(context.product.features)}
- Price: ${context.product.price || 'Contact for pricing'}
` : ''}

${context.audiences && context.audiences.length > 0 ? `
TARGET AUDIENCE:
${context.audiences.map(a => `- ${a.name}: ${a.description}`).join('\n')}
Pain Points: ${JSON.stringify(context.audiences[0]?.pain_points || [])}
` : ''}

CAMPAIGN:
- Objective: ${context.campaign.objective}
- Marketing Objectives: ${JSON.stringify(context.campaign.marketing_objectives)}

${context.settings?.ad_copy_guidelines ? `
GUIDELINES:
${context.settings.ad_copy_guidelines}
` : ''}

REQUIREMENTS:
- Short Headline: Maximum 30 characters (no end punctuation)
- Long Headline: Maximum 90 characters
- Description: Maximum 90 characters
- CTA: Choose from: Learn More, Shop Now, Book Now, Get Quote, Start Free
- Display Link: ${context.brand.website?.replace(/^https?:\/\//, '').replace(/\/$/, '') || 'example.com'}
- Ad Name: Brief, descriptive name

IMPORTANT:
- Say one thing, fast. Single value prop + one CTA.
- Prioritize clarity over cleverness
- Use active voice and short, scannable copy
- No text on images (this is text-only)

Generate 5 variants with different approaches:
1. Value-first (problem → outcome)
2. Offer-led (numerals + urgency)
3. Proof-driven (trust token)
4. Speed/convenience
5. Direct benefit

OUTPUT FORMAT (JSON array):
[
  {
    "shortHeadline": "short headline ≤30 chars",
    "longHeadline": "long headline ≤90 chars",
    "description": "description ≤90 chars",
    "displayLink": "clean domain",
    "cta": "selected CTA",
    "adName": "descriptive name",
    "reasoning": "brief explanation"
  }
]

Return ONLY the JSON array, no other text.`;
    } else {
      return res.status(400).json({
        success: false,
        error: `Unsupported channel: ${channel}. Currently supports Meta and Display channels.`
      });
    }

    // Call Claude API
    const claudeApiKey = process.env.VITE_CLAUDE_API_KEY;
    if (!claudeApiKey) {
      return res.status(503).json({
        success: false,
        error: 'Claude API key not configured'
      });
    }

    const claudeResponse = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-7-sonnet-20250219',
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
      },
      timeout: 60000
    });

    let aiResponse = claudeResponse.data.content[0].text.trim();

    // Remove markdown code blocks if present
    if (aiResponse.startsWith('```')) {
      aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }

    const variants = JSON.parse(aiResponse);

    if (!Array.isArray(variants) || variants.length === 0) {
      throw new Error('AI did not return valid variants array');
    }

    console.log(`✅ Generated ${variants.length} ad copy variants`);

    // Create generated_creative record
    const creativeResult = await pool.query(
      `INSERT INTO generated_creatives (brand_id, campaign_id, channel, status, generation_model, context_used)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [brand_id, campaign_id, channel, 'completed', 'claude-3-7-sonnet-20250219', JSON.stringify(context)]
    );

    const creative = creativeResult.rows[0];

    // Save variants
    for (let i = 0; i < variants.length; i++) {
      await pool.query(
        `INSERT INTO ad_copy_variants (creative_id, variant_number, copy_data, rationale)
         VALUES ($1, $2, $3, $4)`,
        [creative.id, i + 1, JSON.stringify(variants[i]), variants[i].reasoning || '']
      );
    }

    res.json({
      success: true,
      data: {
        creative_id: creative.id,
        channel: channel,
        variants: variants
      }
    });

  } catch (error) {
    console.error('Error generating ad copy:', error);

    // Update creative status to failed if it was created
    if (req.body.creative_id) {
      await pool.query(
        'UPDATE generated_creatives SET status = $1, error_message = $2 WHERE id = $3',
        ['failed', error.message, req.body.creative_id]
      );
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate ad copy'
    });
  }
});

// POST - Trigger ad copy generation for all channels in a campaign
app.post('/api/campaigns/:id/generate-creatives', async (req, res) => {
  try {
    const { id: campaign_id } = req.params;

    console.log(`🚀 Triggering creative generation for campaign: ${campaign_id}`);

    // Get campaign details
    const campaignResult = await pool.query(
      'SELECT * FROM campaigns WHERE id = $1',
      [campaign_id]
    );

    if (campaignResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    const campaign = campaignResult.rows[0];
    const channels = campaign.channels || [];

    if (channels.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Campaign has no channels selected'
      });
    }

    // Generate ad copy for each channel
    const results = [];
    for (const channel of channels) {
      try {
        const genResponse = await axios.post(`${req.protocol}://${req.get('host')}/api/ai/generate-ad-copy`, {
          brand_id: campaign.brand_id,
          campaign_id: campaign.id,
          channel: channel,
          product_service_id: campaign.product_service_id,
          target_audience_ids: campaign.target_audience_ids,
          marketing_objectives: campaign.marketing_objectives
        });

        results.push({
          channel,
          success: true,
          creative_id: genResponse.data.data.creative_id
        });
      } catch (error) {
        console.error(`Failed to generate for channel ${channel}:`, error.message);
        results.push({
          channel,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Generated ad copy for ${results.filter(r => r.success).length}/${channels.length} channels`,
      results
    });

  } catch (error) {
    console.error('Error triggering creative generation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger creative generation'
    });
  }
});

// GET - Fetch generated creatives with optional campaign filter
app.get('/api/generated-creatives', async (req, res) => {
  try {
    const { brand_id, campaign_id } = req.query;

    if (!brand_id) {
      return res.status(400).json({
        success: false,
        error: 'brand_id is required'
      });
    }

    let query = `
      SELECT gc.*, c.name as campaign_name, c.objective as campaign_objective
      FROM generated_creatives gc
      LEFT JOIN campaigns c ON gc.campaign_id = c.id
      WHERE gc.brand_id = $1
    `;
    const params = [brand_id];

    if (campaign_id) {
      query += ' AND gc.campaign_id = $2';
      params.push(campaign_id);
    }

    query += ' ORDER BY gc.created_at DESC';

    const creativesResult = await pool.query(query, params);

    // Fetch variants for each creative
    const creativesWithVariants = await Promise.all(
      creativesResult.rows.map(async (creative) => {
        const variantsResult = await pool.query(
          'SELECT * FROM ad_copy_variants WHERE creative_id = $1 ORDER BY variant_number ASC',
          [creative.id]
        );

        return {
          ...creative,
          variants: variantsResult.rows
        };
      })
    );

    res.json({
      success: true,
      data: creativesWithVariants
    });

  } catch (error) {
    console.error('Error fetching generated creatives:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch generated creatives'
    });
  }
});

// POST - Unified AI endpoint (handles multiple actions including parse-product-service)
app.post('/api/ai', async (req, res) => {
  try {
    const { action, url, content, images, itemType, pageType } = req.body;

    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'action is required'
      });
    }

    console.log(`🤖 AI action: ${action}`);

    // Handle parse-product-service action
    if (action === 'parse-product-service') {
      if (!url || !content || !images || !itemType || !pageType) {
        return res.status(400).json({
          success: false,
          error: 'url, content, images, itemType, and pageType are required for parse-product-service'
        });
      }

      const claudeApiKey = process.env.VITE_CLAUDE_API_KEY;
      if (!claudeApiKey) {
        return res.status(503).json({
          success: false,
          error: 'Claude API key not configured'
        });
      }

      const isSingleItem = pageType === 'single';
      const isProduct = itemType === 'product';

      const prompt = isSingleItem
        ? `Parse this ${isProduct ? 'product' : 'service'} page and extract structured information. Return ONLY a JSON object (not an array) with this exact structure:
{
  "name": "Product/Service name",
  "category": "Category or type",
  "description": "Detailed description (2-3 sentences)",
  "price": "Price or pricing info (e.g. '$99' or '$99/mo' or 'Contact for pricing')",
  "features": ["Feature 1", "Feature 2", "Feature 3"],
  "image_urls": ["url1", "url2"]
}

Page URL: ${url}
Page Title: ${content?.title || 'N/A'}
Page Description: ${content?.description || 'N/A'}
Page Content: ${content?.text?.substring(0, 10000) || 'N/A'}
Available Images: ${JSON.stringify(images?.slice(0, 4) || [])}

Extract the key features, pricing, and select 1-4 of the most relevant product images from the available images.`
        : `Parse this page containing multiple ${isProduct ? 'products' : 'services'} and extract structured information for each. Return ONLY a JSON array with this exact structure:
[
  {
    "name": "Product/Service name",
    "category": "Category or type",
    "description": "Brief description (1-2 sentences)",
    "price": "Price or pricing info",
    "features": ["Feature 1", "Feature 2"],
    "image_urls": ["url1", "url2"]
  }
]

Page URL: ${url}
Page Title: ${content?.title || 'N/A'}
Page Description: ${content?.description || 'N/A'}
Page Content: ${content?.text?.substring(0, 20000) || 'N/A'}
Available Images: ${JSON.stringify(images?.slice(0, 20) || [])}

Extract 3-10 items from the page. For each item, select 1-3 of the most relevant images from the available images.`;

      const claudeResponse = await axios.post('https://api.anthropic.com/v1/messages', {
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 8000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      }, {
        headers: {
          'x-api-key': claudeApiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        timeout: 60000
      });

      const responseText = claudeResponse.data.content[0].text;

      let result;
      if (isSingleItem) {
        // For single item, parse the object and return it in an array
        const item = JSON.parse(responseText.match(/\{[\s\S]*\}/)[0]);
        result = [item];
      } else {
        // For collection, parse the array directly
        result = JSON.parse(responseText.match(/\[[\s\S]*\]/)[0]);
      }

      console.log(`✅ Parsed ${result.length} item(s)`);

      return res.json({
        success: true,
        data: result
      });
    }

    // For other actions, redirect to dedicated endpoints
    const dedicatedEndpoints = {
      'generate-brand-intelligence': '/api/ai/generate-brand-intelligence',
      'generate-audiences': '/api/ai/generate-audiences',
      'analyze-competitor': '/api/ai/analyze-competitor',
      'generate-products': '/api/ai/generate-products',
      'generate-campaigns': '/api/ai/generate-campaigns'
    };

    const dedicatedEndpoint = dedicatedEndpoints[action];
    if (dedicatedEndpoint) {
      return res.status(400).json({
        success: false,
        error: `Use dedicated endpoint: POST ${dedicatedEndpoint}`,
        hint: 'The unified /api/ai endpoint only supports parse-product-service. For other actions, use the dedicated endpoints listed above.'
      });
    }

    return res.status(400).json({
      success: false,
      error: `Unknown action: ${action}`
    });

  } catch (error) {
    console.error('AI endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'AI processing failed'
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ API server running on http://localhost:${PORT}`);
  console.log(`✅ Network access available at http://192.168.254.93:${PORT}`);
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