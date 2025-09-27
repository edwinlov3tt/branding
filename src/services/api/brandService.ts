import { apiClient, USE_MOCK_DATA } from '../config/apiConfig'
import type { BrandAsset, ApiResponse } from '@/types'

// Mock data for development
const mockBrandAssets: BrandAsset = {
  logos: [
    { type: 'Primary Logo', format: 'SVG', url: '#' },
    { type: 'Icon', format: 'PNG', url: '#' },
    { type: 'Wordmark', format: 'SVG', url: '#' }
  ],
  colors: [
    { hex: '#dc2626', name: 'Brand Red' },
    { hex: '#1f2937', name: 'Dark Gray' },
    { hex: '#f3f4f6', name: 'Light Gray' },
    { hex: '#ffffff', name: 'White' }
  ],
  fonts: [
    { family: 'Inter', category: 'Sans-serif', weight: '400, 500, 600' },
    { family: 'Roboto', category: 'Sans-serif', weight: '400, 700' }
  ]
}

export const extractBrandAssets = async (url: string): Promise<BrandAsset> => {
  // Use mock data in development if no API is configured
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API delay
    return {
      ...mockBrandAssets,
      url,
      name: new URL(url).hostname.replace('www.', '').split('.')[0]
    }
  }

  try {
    const response = await apiClient.post<ApiResponse<BrandAsset>>('/api/extract', { url })

    if (response.data.success && response.data.data) {
      return response.data.data
    }

    throw new Error(response.data.error || 'Failed to extract brand assets')
  } catch (error) {
    console.error('Brand extraction error:', error)

    // Fallback to mock data if API fails
    await new Promise(resolve => setTimeout(resolve, 1000))
    return {
      ...mockBrandAssets,
      url,
      name: new URL(url).hostname.replace('www.', '').split('.')[0]
    }
  }
}

export const saveBrandAssets = async (assets: BrandAsset): Promise<void> => {
  if (USE_MOCK_DATA) {
    localStorage.setItem('brandAssets', JSON.stringify(assets))
    return
  }

  try {
    await apiClient.post('/api/brand/save', assets)
  } catch (error) {
    console.error('Failed to save brand assets:', error)
    // Save to local storage as fallback
    localStorage.setItem('brandAssets', JSON.stringify(assets))
  }
}

export const loadBrandAssets = async (): Promise<BrandAsset | null> => {
  if (USE_MOCK_DATA) {
    const saved = localStorage.getItem('brandAssets')
    return saved ? JSON.parse(saved) : mockBrandAssets
  }

  try {
    const response = await apiClient.get<ApiResponse<BrandAsset>>('/api/brand')
    return response.data.data || null
  } catch (error) {
    console.error('Failed to load brand assets:', error)
    const saved = localStorage.getItem('brandAssets')
    return saved ? JSON.parse(saved) : null
  }
}