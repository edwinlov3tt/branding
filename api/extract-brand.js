import axios from 'axios';

export default async function handler(req, res) {
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
    const { url, includeScreenshot = true } = req.body;

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
    res.status(200).json(response.data);

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
}