import axios from 'axios';

const BRAND_SERVICES_API = 'https://brand-services.edwin-6f1.workers.dev';

export interface BrandServicesResponse {
  results: Array<{
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
  }>;
}

export interface ScrapePageOptions {
  url: string;
  limit?: number; // Max images per page (1-50, default: 4)
  types?: string; // Image types: "img,og,icon,css,source"
  includeContent?: boolean; // Extract page content (default: true)
  maxContentLength?: number; // Max content bytes (1000-200000, default: 50000)
}

/**
 * Scrape a page for images and content using the Brand Services API
 */
export const scrapePage = async (options: ScrapePageOptions): Promise<BrandServicesResponse> => {
  const {
    url,
    limit = 4,
    types = 'img,og,icon,css,source',
    includeContent = true,
    maxContentLength = 50000
  } = options;

  try {
    const response = await axios.get<BrandServicesResponse>(BRAND_SERVICES_API, {
      params: {
        url,
        limit,
        types,
        includeContent,
        maxContentLength
      },
      timeout: 30000 // 30 second timeout
    });

    return response.data;
  } catch (error: any) {
    console.error('Brand Services API error:', error);
    throw new Error(error.response?.data?.error || 'Failed to scrape page');
  }
};

/**
 * Scrape multiple pages at once
 */
export const scrapeMultiplePages = async (
  urls: string[],
  options?: Omit<ScrapePageOptions, 'url'>
): Promise<BrandServicesResponse> => {
  const {
    limit = 4,
    types = 'img,og,icon,css,source',
    includeContent = true,
    maxContentLength = 50000
  } = options || {};

  try {
    const response = await axios.post<BrandServicesResponse>(
      BRAND_SERVICES_API,
      {
        urls,
        limit,
        types,
        includeContent,
        maxContentLength,
        concurrency: 4
      },
      {
        timeout: 60000 // 60 second timeout for multiple pages
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Brand Services API error:', error);
    throw new Error(error.response?.data?.error || 'Failed to scrape pages');
  }
};
