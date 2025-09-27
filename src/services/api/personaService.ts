import { apiClient, USE_MOCK_DATA, CLAUDE_API_KEY, CLAUDE_MODEL } from '../config/apiConfig'
import type { Persona, ApiResponse } from '@/types'

const generateMockPersonas = (companyProfile: string): Persona[] => {
  const profile = companyProfile.toLowerCase()

  let industry = 'general business'
  if (profile.includes('saas') || profile.includes('software')) industry = 'saas'
  else if (profile.includes('ecommerce') || profile.includes('retail')) industry = 'ecommerce'
  else if (profile.includes('agency') || profile.includes('marketing')) industry = 'agency'

  const timestamp = Date.now().toString()

  return [
    {
      id: `persona-${timestamp}-1`,
      name: 'Sarah Chen',
      role: industry === 'saas' ? 'Product Marketing Manager' : 'Marketing Manager',
      businessContext: industry === 'saas'
        ? 'Manages go-to-market for B2B software products'
        : 'Drives lead generation and brand awareness',
      painPoints: [
        'Complex feature communication',
        'Long sales cycles',
        'Proving ROI for marketing spend'
      ],
      behaviors: [
        'Checks analytics daily',
        'Active on LinkedIn',
        'Prefers email communication'
      ],
      motivations: [
        'Career advancement',
        'Team efficiency',
        'Business impact'
      ],
      budgetRange: '$5,000 - $15,000/month',
      objections: [
        'Learning curve concerns',
        'Needs leadership approval',
        'Implementation time'
      ],
      benefits: [
        'Saves 10+ hours per week',
        'Better ROI tracking',
        'Professional results'
      ],
      pitch: 'Simplify your marketing with AI-powered creative tools.',
      cta: 'Start Free Trial'
    },
    {
      id: `persona-${timestamp}-2`,
      name: 'Mike Rodriguez',
      role: 'Small Business Owner',
      businessContext: 'Runs a local service business with 5-15 employees',
      painPoints: [
        'No dedicated marketing team',
        'Limited budget',
        'Time constraints'
      ],
      behaviors: [
        'Works evenings and weekends',
        'Checks phone constantly',
        'Makes quick decisions'
      ],
      motivations: [
        'Business growth',
        'Supporting family',
        'Building reputation'
      ],
      budgetRange: '$300 - $1,500/month',
      objections: [
        'Technology skepticism',
        'Ongoing costs',
        'Prefers personal touch'
      ],
      benefits: [
        'Professional materials',
        'More time for operations',
        'Increased visibility'
      ],
      pitch: 'Get professional marketing without the agency costs.',
      cta: 'Try It Free'
    }
  ]
}

export const generatePersonas = async (companyProfile: string): Promise<Persona[]> => {
  if (USE_MOCK_DATA || !CLAUDE_API_KEY) {
    await new Promise(resolve => setTimeout(resolve, 2000))
    return generateMockPersonas(companyProfile)
  }

  try {
    const response = await apiClient.post<ApiResponse<Persona[]>>('/api/personas/generate', {
      profile: companyProfile,
      apiKey: CLAUDE_API_KEY,
      model: CLAUDE_MODEL
    })

    if (response.data.success && response.data.data) {
      return response.data.data
    }

    throw new Error(response.data.error || 'Failed to generate personas')
  } catch (error) {
    console.error('Persona generation error:', error)
    await new Promise(resolve => setTimeout(resolve, 1500))
    return generateMockPersonas(companyProfile)
  }
}

export const savePersona = async (persona: Persona): Promise<void> => {
  if (USE_MOCK_DATA) {
    const saved = localStorage.getItem('personas')
    const personas = saved ? JSON.parse(saved) : []
    personas.push(persona)
    localStorage.setItem('personas', JSON.stringify(personas))
    return
  }

  try {
    await apiClient.post('/api/personas', persona)
  } catch (error) {
    console.error('Failed to save persona:', error)
    throw error
  }
}

export const loadPersonas = async (): Promise<Persona[]> => {
  if (USE_MOCK_DATA) {
    const saved = localStorage.getItem('personas')
    return saved ? JSON.parse(saved) : []
  }

  try {
    const response = await apiClient.get<ApiResponse<Persona[]>>('/api/personas')
    return response.data.data || []
  } catch (error) {
    console.error('Failed to load personas:', error)
    return []
  }
}