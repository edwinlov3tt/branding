const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

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
});