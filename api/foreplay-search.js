const axios = require('axios');

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
    const { query, platform, niche, limit = 50, cursor } = req.body;
    const foreplayApiKey = process.env.FOREPLAY_API_KEY;

    if (!foreplayApiKey) {
      res.status(503).json({
        success: false,
        error: 'Foreplay API key not configured'
      });
      return;
    }

    const apiParams = {
      query: query || '',
      limit: Math.min(limit, 100),
      page_token: cursor || undefined
    };

    if (platform && platform !== 'all') {
      apiParams.publisher_platform = [platform.toLowerCase()];
    }

    if (niche && niche !== 'all') {
      apiParams.niches = [niche];
    }

    const response = await axios.get('https://public.api.foreplay.co/api/discovery/ads', {
      headers: {
        'Authorization': foreplayApiKey,
        'Content-Type': 'application/json'
      },
      params: apiParams,
      timeout: 25000
    });

    const adsWithDetails = await Promise.all(
      (response.data?.data || []).map(async (ad) => {
        try {
          const detailResponse = await axios.get('https://public.api.foreplay.co/api/ad', {
            headers: { 'Authorization': foreplayApiKey },
            params: { id: ad.id },
            timeout: 5000
          });

          return {
            ...ad,
            thumbnail: detailResponse.data?.thumbnail_url || ad.thumbnail,
            image: detailResponse.data?.media?.[0]?.url || detailResponse.data?.thumbnail_url,
            video: detailResponse.data?.media?.find(m => m.type === 'video')?.url || null
          };
        } catch (err) {
          return ad;
        }
      })
    );

    res.status(200).json({
      success: true,
      data: adsWithDetails,
      metadata: {
        cursor: response.data?.next_page_token || null
      }
    });
  } catch (error) {
    console.error('Foreplay API error:', error);
    res.status(error.response?.status || 500).json({
      success: false,
      error: 'Failed to search ads',
      message: error.response?.data?.message || error.message
    });
  }
};
