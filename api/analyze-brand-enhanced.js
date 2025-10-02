const https = require('https');

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      url,
      maxPages = 10,
      includeScreenshots = true,
      includeScraping = false,
      includeImages = false,
      maxImagesPerPage = 5
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

    console.log(`🔍 Enhanced brand analysis for: ${url} (maxPages: ${maxPages})`);

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const postData = JSON.stringify({
      url,
      maxPages,
      includeScreenshots,
      includeScraping,
      includeImages,
      maxImagesPerPage
    });

    const options = {
      hostname: 'gtm.edwinlovett.com',
      path: '/api/analyze-brand-enhanced',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Branding-App/1.0'
      }
    };

    const proxyReq = https.request(options, (proxyRes) => {
      // Forward status code
      res.status(proxyRes.statusCode || 200);

      // Stream the response
      proxyRes.on('data', (chunk) => {
        res.write(chunk);
      });

      proxyRes.on('end', () => {
        console.log(`✅ Enhanced analysis completed for: ${new URL(url).hostname}`);
        res.end();
      });
    });

    proxyReq.on('error', (error) => {
      console.error('Proxy request error:', error);
      res.write(`event: error\ndata: ${JSON.stringify({ message: 'Failed to connect to analysis service' })}\n\n`);
      res.end();
    });

    // Send the POST data
    proxyReq.write(postData);
    proxyReq.end();

  } catch (error) {
    console.error('Enhanced analysis error:', error.message);
    res.write(`event: error\ndata: ${JSON.stringify({ message: 'An unexpected error occurred' })}\n\n`);
    res.end();
  }
};
