import axios from 'axios';

const CONTENT_SCRAPER_API = 'https://brand-services.edwin-6f1.workers.dev';

export interface ContentScraperResult {
  url: string;
  found: boolean;
  images: string[];
  sources: {
    og: string[];
    img: string[];
    source: string[];
    icon: string[];
    css: string[];
  };
  content: {
    title: string;
    description: string;
    text: string;
    truncated: boolean;
  } | null;
  scrapeMethod: 'direct' | 'scrapfly';
  antiBot: boolean;
  errors: string[];
}

export interface ContentScraperResponse {
  results: ContentScraperResult[];
}

export interface ScraperOptions {
  limit?: number; // Max images to return (1-50, default: 4)
  types?: string; // Comma-separated image types (default: "img,og,icon,css,source")
  includeContent?: boolean; // Whether to extract page content (default: true)
  maxContentLength?: number; // Max content length in bytes (1000-200000, default: 50000)
}

/**
 * Extract images and content from a single URL using GET request
 */
export const scrapeUrl = async (
  url: string,
  options: ScraperOptions = {}
): Promise<ContentScraperResult> => {
  try {
    const params = new URLSearchParams({
      url,
      limit: (options.limit || 10).toString(),
      types: options.types || 'img,og,icon,css,source',
      includeContent: (options.includeContent !== false).toString(),
      maxContentLength: (options.maxContentLength || 50000).toString()
    });

    console.log('[ContentScraper] GET request:', `${CONTENT_SCRAPER_API}?${params}`);

    const response = await axios.get<ContentScraperResponse>(
      `${CONTENT_SCRAPER_API}?${params}`,
      {
        timeout: 30000 // 30 second timeout
      }
    );

    if (response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      console.log('[ContentScraper] ✅ Successfully scraped:', url);
      console.log('[ContentScraper] Images found:', result.images.length);
      console.log('[ContentScraper] Content length:', result.content?.text.length || 0);
      return result;
    }

    throw new Error('No results returned from scraper');
  } catch (error: any) {
    console.error('[ContentScraper] ❌ Failed to scrape URL:', error);
    throw error;
  }
};

/**
 * Extract images and content from multiple URLs using POST request
 */
export const scrapeUrls = async (
  urls: string[],
  options: ScraperOptions = {},
  concurrency: number = 4
): Promise<ContentScraperResult[]> => {
  try {
    const payload = {
      urls,
      limit: options.limit || 10,
      types: options.types || 'img,og,icon,css,source',
      includeContent: options.includeContent !== false,
      maxContentLength: options.maxContentLength || 50000,
      concurrency: Math.min(concurrency, 10) // Max 10
    };

    console.log('[ContentScraper] POST request for', urls.length, 'URLs');

    const response = await axios.post<ContentScraperResponse>(
      CONTENT_SCRAPER_API,
      payload,
      {
        timeout: 60000, // 60 second timeout for bulk
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.results) {
      console.log('[ContentScraper] ✅ Successfully scraped', response.data.results.length, 'URLs');
      return response.data.results;
    }

    throw new Error('No results returned from scraper');
  } catch (error: any) {
    console.error('[ContentScraper] ❌ Failed to scrape URLs:', error);
    throw error;
  }
};

/**
 * Extract only text content from a URL (optimized for brand profiling)
 */
export const scrapeContentOnly = async (url: string): Promise<{
  title: string;
  description: string;
  text: string;
  truncated: boolean;
}> => {
  try {
    const result = await scrapeUrl(url, {
      limit: 0, // No images needed
      types: '', // Skip image extraction
      includeContent: true,
      maxContentLength: 100000 // Get more content for brand analysis
    });

    if (!result.content) {
      throw new Error('No content extracted from URL');
    }

    return result.content;
  } catch (error: any) {
    console.error('[ContentScraper] ❌ Failed to scrape content:', error);
    throw error;
  }
};

/**
 * Extract images only (for brand asset discovery)
 */
export const scrapeImagesOnly = async (
  url: string,
  limit: number = 20
): Promise<{
  images: string[];
  sources: ContentScraperResult['sources'];
}> => {
  try {
    const result = await scrapeUrl(url, {
      limit,
      types: 'img,og,icon,css,source',
      includeContent: false // Skip content extraction
    });

    return {
      images: result.images,
      sources: result.sources
    };
  } catch (error: any) {
    console.error('[ContentScraper] ❌ Failed to scrape images:', error);
    throw error;
  }
};
