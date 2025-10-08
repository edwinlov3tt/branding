import { apiClient } from '../config/apiConfig'
import type {
  ApiResponse,
  AdInspiration,
  AdSearchParams,
  ForeplaySearchResponse
} from '@/types'

// Get all curated ads (platform-wide)
export const getCuratedAds = async (params?: {
  platform?: string;
  niche?: string;
  limit?: number;
}): Promise<AdInspiration[]> => {
  try {
    const response = await apiClient.get<ApiResponse<AdInspiration[]>>('/api/ad-inspirations/curated', {
      params
    })

    return response.data.data || []
  } catch (error) {
    console.error('Failed to fetch curated ads:', error)
    throw error
  }
}

// Get ad inspirations for a specific brand
export const getBrandAdInspirations = async (brandId: string): Promise<AdInspiration[]> => {
  try {
    const response = await apiClient.get<ApiResponse<AdInspiration[]>>('/api/ad-inspirations', {
      params: { brand_id: brandId }
    })

    return response.data.data || []
  } catch (error) {
    console.error('Failed to fetch brand ad inspirations:', error)
    throw error
  }
}

// Save ad to brand inspiration
export const saveAdInspiration = async (adData: {
  brand_id: string;
  foreplay_ad_id?: string;
  ad_data: any;
  thumbnail_url: string;
  video_url?: string;
  platform: string;
  advertiser_name: string;
  niche?: string;
  ad_copy?: string;
}): Promise<AdInspiration> => {
  try {
    const response = await apiClient.post<ApiResponse<AdInspiration>>('/api/ad-inspirations', adData)

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to save ad inspiration')
    }

    return response.data.data!
  } catch (error: any) {
    console.error('Failed to save ad inspiration:', error)
    throw new Error(error.response?.data?.error || 'Failed to save ad inspiration')
  }
}

// Remove ad from brand inspiration
export const removeAdInspiration = async (adId: string, brandId: string): Promise<void> => {
  try {
    await apiClient.delete('/api/ad-inspirations', {
      params: { id: adId, brand_id: brandId }
    })
  } catch (error) {
    console.error('Failed to remove ad inspiration:', error)
    throw error
  }
}

// Search ads via Foreplay API
export const searchAds = async (params: AdSearchParams): Promise<ForeplaySearchResponse> => {
  try {
    const response = await apiClient.post<ForeplaySearchResponse>('/api/foreplay/search-ads', params, {
      timeout: 30000
    })

    return response.data
  } catch (error: any) {
    console.error('Failed to search ads:', error)

    if (error.response?.status === 503) {
      throw new Error('Foreplay API is not configured. Please add your API key in settings.')
    }

    throw new Error(error.response?.data?.error || 'Failed to search ads')
  }
}
