import { apiClient } from '../config/apiConfig'
import axios from 'axios'
import type {
  ApiResponse,
  BrandExtractResponse,
  EditedBrandData,
  DiscoverPagesResponse
} from '@/types'
import { calculateWCAGContrast } from '@/utils/colorUtils'
import { brandCache } from '../cache/brandCache'

// Health check for the external API
export const checkExternalApiHealth = async (): Promise<boolean> => {
  try {
    const response = await axios.get('https://gtm.edwinlovett.com/api/health', {
      timeout: 5000
    });
    return response.data.status === 'OK';
  } catch (error) {
    console.error('External API health check failed:', error);
    return false;
  }
}

// Enhanced brand extraction with new API
export const extractBrandData = async (url: string, includeScreenshot: boolean = true): Promise<BrandExtractResponse> => {
  try {
    const response = await apiClient.post<BrandExtractResponse>('/api/extract-brand', {
      url,
      includeScreenshot
    })

    if (response.data.success && response.data.brand) {
      // Fill in missing WCAG contrast data if needed
      const enhancedBrand = {
        ...response.data.brand,
        colors: {
          ...response.data.brand.colors,
          palette: response.data.brand.colors.palette.map(color => ({
            ...color,
            wcagContrast: color.wcagContrast || calculateWCAGContrast(color.hex)
          }))
        }
      }

      return {
        ...response.data,
        brand: enhancedBrand
      }
    }

    throw new Error('Failed to extract brand data')
  } catch (error: any) {
    // Check for other common errors
    if (error.response?.status === 404) {
      throw new Error('Brand extraction endpoint not found. Please check the API configuration.')
    }

    if (error.response?.status === 500) {
      throw new Error('Server error occurred while extracting brand data. Please try again.')
    }

    if (error.code === 'ERR_NETWORK' || error.message?.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error('Unable to connect to brand extraction service. Please check your internet connection and try again.')
    }

    console.error('Brand extraction error:', error)
    throw new Error(error.response?.data?.message || 'Failed to extract brand data. Please try again.')
  }
}


// Save edited brand data
export const saveEditedBrandData = async (editedData: EditedBrandData): Promise<void> => {
  try {
    await apiClient.post('/api/brand/save-edited', editedData)
    // Also save to local storage for persistence
    localStorage.setItem('editedBrandData', JSON.stringify(editedData))
  } catch (error) {
    console.error('Failed to save edited brand data:', error)
    // Save to local storage as fallback
    localStorage.setItem('editedBrandData', JSON.stringify(editedData))
    throw error
  }
}

export const loadEditedBrandData = async (): Promise<EditedBrandData | null> => {
  try {
    const response = await apiClient.get<ApiResponse<EditedBrandData>>('/api/brand/edited')
    return response.data.data || null
  } catch (error: any) {
    // Silently handle connection errors and use local storage
    if (error.code === 'ERR_NETWORK' || error.message?.includes('ERR_CONNECTION_REFUSED')) {
      const saved = localStorage.getItem('editedBrandData')
      return saved ? JSON.parse(saved) : null
    }

    console.error('Failed to load edited brand data from API:', error)
    // Try to load from local storage as fallback
    const saved = localStorage.getItem('editedBrandData')
    return saved ? JSON.parse(saved) : null
  }
}

// Discover brand pages with images
export const discoverBrandPages = async (
  url: string,
  options: {
    maxPages?: number;
    includeScraping?: boolean;
    includeImages?: boolean;
    maxImagesPerPage?: number;
  } = {}
): Promise<DiscoverPagesResponse> => {
  const {
    maxPages = 10,
    includeScraping = false,
    includeImages = true,
    maxImagesPerPage = 8
  } = options;

  try {
    const response = await apiClient.post<DiscoverPagesResponse>('/api/discover-brand-pages', {
      url,
      maxPages,
      includeScraping,
      includeImages,
      maxImagesPerPage
    }, {
      timeout: 60000 // 60 second timeout for this longer operation
    });

    if (!response.data.success) {
      throw new Error('Failed to discover brand pages');
    }

    return response.data;
  } catch (error: any) {
    // Check for other common errors
    if (error.response?.status === 404) {
      throw new Error('Page discovery endpoint not found. Please check the API configuration.');
    }

    if (error.response?.status === 500) {
      throw new Error('Server error occurred while discovering pages. Please try again.');
    }

    if (error.code === 'ERR_NETWORK' || error.message?.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error('Unable to connect to page discovery service. Please check your internet connection and try again.');
    }

    throw error;
  }
}

// Brand CRUD operations
export const getAllBrands = async () => {
  try {
    const response = await apiClient.get('/api/brands')
    return response.data
  } catch (error) {
    console.error('Failed to fetch brands:', error)
    throw error
  }
}

export const getBrandByIdentifiers = async (slug: string, shortId: string) => {
  try {
    const response = await apiClient.get(`/api/brands/${slug}/${shortId}`)
    return response.data
  } catch (error) {
    console.error('Failed to fetch brand:', error)
    throw error
  }
}

export const createBrand = async (brandData: {
  name: string
  website?: string
  logo_url?: string
  primary_color?: string
  industry?: string
  favicon_url?: string
}) => {
  try {
    const response = await apiClient.post('/api/brands', brandData)
    return response.data
  } catch (error) {
    console.error('Failed to create brand:', error)
    throw error
  }
}

export const updateBrand = async (id: string, brandData: {
  name?: string
  website?: string
  logo_url?: string
  primary_color?: string
  industry?: string
  favicon_url?: string
}) => {
  try {
    const response = await apiClient.put('/api/brands', { id, ...brandData })
    return response.data
  } catch (error) {
    console.error('Failed to update brand:', error)
    throw error
  }
}

export const deleteBrand = async (id: string) => {
  try {
    const response = await apiClient.delete(`/api/brands?id=${id}`)
    return response.data
  } catch (error) {
    console.error('Failed to delete brand:', error)
    throw error
  }
}

export const saveBrandAssets = async (brandId: string, extractedData: BrandExtractResponse) => {
  try {
    const response = await apiClient.post('/api/brand-assets', {
      brand_id: brandId,
      assets: extractedData
    })

    // Invalidate cache for this brand since we just updated it
    brandCache.invalidate(brandId)

    // Store the new data in cache
    brandCache.set(brandId, extractedData)

    return response.data
  } catch (error) {
    console.error('Failed to save brand assets:', error)
    // Don't throw - this is not critical
    return { success: false, error }
  }
}

export const getBrandAssets = async (brandId: string): Promise<BrandExtractResponse | null> => {
  // Check cache first
  const cached = brandCache.get(brandId)
  if (cached) {
    console.log(`[Cache Hit] Brand assets loaded from cache for brand: ${brandId}`)
    return cached
  }

  // Cache miss - fetch from API
  console.log(`[Cache Miss] Fetching brand assets from database for brand: ${brandId}`)
  try {
    const response = await apiClient.get(`/api/brand-assets?brand_id=${brandId}`)
    if (response.data.success && response.data.data) {
      const assets = response.data.data.assets

      // Store in cache for future requests
      brandCache.set(brandId, assets)

      return assets
    }
    return null
  } catch (error) {
    console.error('Failed to load brand assets:', error)
    return null
  }
}

// Brand Profile API methods
export const getBrandProfile = async (brandId: string) => {
  try {
    const response = await apiClient.get(`/api/brand-profile?brand_id=${brandId}`)
    return response.data
  } catch (error) {
    console.error('Failed to fetch brand profile:', error)
    throw error
  }
}

export const createBrandProfile = async (
  brandId: string,
  domain: string,
  options: {
    includeReviews?: boolean
    maxPages?: number
    mode?: 'sync' | 'async'
  } = {}
) => {
  try {
    const response = await apiClient.post('/api/brand-profile', {
      brand_id: brandId,
      domain,
      includeReviews: options.includeReviews !== false,
      maxPages: options.maxPages || 20,
      mode: options.mode || 'sync'
    })
    return response.data
  } catch (error) {
    console.error('Failed to create brand profile:', error)
    throw error
  }
}

export const pollBrandProfile = async (jobId: string, brandId: string) => {
  try {
    const response = await apiClient.put('/api/brand-profile', {
      job_id: jobId,
      brand_id: brandId
    })
    return response.data
  } catch (error) {
    console.error('Failed to poll brand profile:', error)
    throw error
  }
}

// Brand Images API methods
export const getBrandImages = async (brandId: string) => {
  try {
    const response = await apiClient.get(`/api/brand-images?brand_id=${brandId}`)
    return response.data
  } catch (error) {
    console.error('Failed to fetch brand images:', error)
    throw error
  }
}

export const saveBrandImages = async (
  brandId: string,
  pages: Array<{
    page_url: string
    page_title?: string
    page_category?: string
    relevance_score?: number
    images: any[]
  }>
) => {
  try {
    const response = await apiClient.post('/api/brand-images', {
      brand_id: brandId,
      pages
    })
    return response.data
  } catch (error) {
    console.error('Failed to save brand images:', error)
    throw error
  }
}

export const clearBrandImagesCache = async (brandId: string, pageUrl?: string) => {
  try {
    const params = new URLSearchParams({ brand_id: brandId })
    if (pageUrl) {
      params.append('page_url', pageUrl)
    }
    const response = await apiClient.delete(`/api/brand-images?${params.toString()}`)
    return response.data
  } catch (error) {
    console.error('Failed to clear brand images cache:', error)
    throw error
  }
}

