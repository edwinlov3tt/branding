import axios from 'axios'

// API Configuration
// Use relative URLs to leverage Vite proxy in development
// In production (Vercel), use relative URLs to call the API functions
const isProduction = import.meta.env.PROD;
export const API_BASE_URL = ''
export const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY || ''
export const CLAUDE_MODEL = import.meta.env.VITE_CLAUDE_MODEL || 'claude-3-opus-20240229'
export const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || ''
export const CORS_PROXY_URL = import.meta.env.VITE_CORS_PROXY_URL || ''

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('authToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Mock mode flag for development
export const USE_MOCK_DATA = import.meta.env.VITE_ENV === 'development' && !API_BASE_URL