import { apiClient } from '../config/apiConfig'
import type {
  ApiResponse,
  BrandIntelligence,
  TargetAudience,
  CompetitorAnalysis,
  ProductService,
  Campaign
} from '@/types'

// Generate brand intelligence from website analysis
export const generateBrandIntelligence = async (brandId: string, url: string): Promise<BrandIntelligence> => {
  try {
    const response = await apiClient.post<ApiResponse<BrandIntelligence>>(
      '/api/ai/generate-brand-intelligence',
      { brand_id: brandId, url },
      { timeout: 60000 } // 60 second timeout for AI analysis
    )

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to generate brand intelligence')
    }

    return response.data.data!
  } catch (error: any) {
    console.error('Failed to generate brand intelligence:', error)
    throw new Error(error.response?.data?.error || 'Failed to generate brand intelligence')
  }
}

// Get brand intelligence for a brand
export const getBrandIntelligence = async (brandId: string): Promise<BrandIntelligence | null> => {
  try {
    const response = await apiClient.get<ApiResponse<BrandIntelligence>>('/api/brand-intelligence', {
      params: { brand_id: brandId }
    })

    return response.data.data || null
  } catch (error) {
    console.error('Failed to fetch brand intelligence:', error)
    return null
  }
}

// Generate target audiences using AI
export const generateTargetAudiences = async (brandId: string): Promise<TargetAudience[]> => {
  try {
    const response = await apiClient.post<ApiResponse<TargetAudience[]>>(
      '/api/ai/generate-audiences',
      { brand_id: brandId },
      { timeout: 60000 }
    )

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to generate target audiences')
    }

    return response.data.data || []
  } catch (error: any) {
    console.error('Failed to generate target audiences:', error)
    throw new Error(error.response?.data?.error || 'Failed to generate target audiences')
  }
}

// Generate competitor analysis with Foreplay ads
export const generateCompetitorAnalysis = async (
  brandId: string,
  competitorName: string,
  facebookPage?: string
): Promise<CompetitorAnalysis> => {
  try {
    const response = await apiClient.post<ApiResponse<CompetitorAnalysis>>(
      '/api/ai/analyze-competitor',
      {
        brand_id: brandId,
        competitor_name: competitorName,
        facebook_page: facebookPage
      },
      { timeout: 120000 } // 2 minutes for fetching ads + analysis
    )

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to analyze competitor')
    }

    return response.data.data!
  } catch (error: any) {
    console.error('Failed to generate competitor analysis:', error)
    throw new Error(error.response?.data?.error || 'Failed to analyze competitor')
  }
}

// Get competitor analyses for a brand
export const getCompetitorAnalyses = async (brandId: string): Promise<CompetitorAnalysis[]> => {
  try {
    const response = await apiClient.get<ApiResponse<CompetitorAnalysis[]>>('/api/competitor-analyses', {
      params: { brand_id: brandId }
    })

    return response.data.data || []
  } catch (error) {
    console.error('Failed to fetch competitor analyses:', error)
    return []
  }
}

// Get a single competitor analysis
export const getCompetitorAnalysis = async (analysisId: string): Promise<CompetitorAnalysis | null> => {
  try {
    const response = await apiClient.get<ApiResponse<CompetitorAnalysis>>(
      `/api/competitor-analyses/${analysisId}`
    )

    return response.data.data || null
  } catch (error) {
    console.error('Failed to fetch competitor analysis:', error)
    return null
  }
}

// Generate products and services from website
export const generateProductsServices = async (brandId: string): Promise<ProductService[]> => {
  try {
    const response = await apiClient.post<ApiResponse<ProductService[]>>(
      '/api/ai/generate-products',
      { brand_id: brandId },
      { timeout: 60000 }
    )

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to generate products and services')
    }

    return response.data.data || []
  } catch (error: any) {
    console.error('Failed to generate products and services:', error)
    throw new Error(error.response?.data?.error || 'Failed to generate products and services')
  }
}

// Generate campaign ideas
export const generateCampaigns = async (brandId: string): Promise<Campaign[]> => {
  try {
    const response = await apiClient.post<ApiResponse<Campaign[]>>(
      '/api/ai/generate-campaigns',
      { brand_id: brandId },
      { timeout: 60000 }
    )

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to generate campaigns')
    }

    return response.data.data || []
  } catch (error: any) {
    console.error('Failed to generate campaigns:', error)
    throw new Error(error.response?.data?.error || 'Failed to generate campaigns')
  }
}
