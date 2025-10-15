import { useState, useEffect } from 'react'
import { useBrand } from '@/contexts/BrandContext'
import axios from 'axios'
import AdCopyCard from './AdCopyCard'
import './GenerationsList.css'

interface Campaign {
  id: string
  name: string
}

interface MetaCopyData {
  postText: string
  headline: string
  linkDescription: string
  displayLink: string
  cta: string
  adName: string
  reasoning?: string
}

interface DisplayCopyData {
  shortHeadline: string
  longHeadline: string
  description: string
  displayLink: string
  cta: string
  adName: string
  reasoning?: string
}

interface AdCopyVariant {
  id: string
  variant_number: number
  copy_data: MetaCopyData | DisplayCopyData
  rationale: string
  created_at: string
}

interface GeneratedCreative {
  id: string
  brand_id: string
  campaign_id: string
  campaign_name?: string
  campaign_objective?: string
  channel: string
  status: 'generating' | 'completed' | 'failed'
  generation_model?: string
  error_message?: string
  variants: AdCopyVariant[]
  created_at: string
}

const GenerationsList = () => {
  const { currentBrand } = useBrand()
  const [creatives, setCreatives] = useState<GeneratedCreative[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (currentBrand) {
      loadCampaigns()
      loadCreatives()
    }
  }, [currentBrand])

  useEffect(() => {
    if (currentBrand) {
      loadCreatives()
    }
  }, [selectedCampaign, currentBrand])

  const loadCampaigns = async () => {
    if (!currentBrand) return

    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/campaigns`, {
        params: { brand_id: currentBrand.id }
      })

      if (response.data.success) {
        setCampaigns(response.data.data)
      }
    } catch (err) {
      console.error('Failed to load campaigns:', err)
    }
  }

  const loadCreatives = async () => {
    if (!currentBrand) return

    setIsLoading(true)
    setError('')

    try {
      const params: any = { brand_id: currentBrand.id }
      if (selectedCampaign) {
        params.campaign_id = selectedCampaign
      }

      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/generated-creatives`, {
        params
      })

      if (response.data.success) {
        setCreatives(response.data.data)
      }
    } catch (err: any) {
      console.error('Failed to load generated creatives:', err)
      setError(err.response?.data?.error || 'Failed to load generated creatives')
    } finally {
      setIsLoading(false)
    }
  }

  if (!currentBrand) {
    return (
      <div className="generations-list">
        <div className="empty-state">
          <p className="empty-text">No brand selected</p>
          <p className="empty-subtext">Select a brand to view generated creatives</p>
        </div>
      </div>
    )
  }

  return (
    <div className="generations-list">
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Generated Creatives</h2>
          <div className="header-actions">
            {campaigns.length > 0 && (
              <select
                className="filter-select"
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
              >
                <option value="">All Campaigns</option>
                {campaigns.map(campaign => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p className="loading-text">Loading generated creatives...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p className="error-text">{error}</p>
            <button className="button button-secondary" onClick={loadCreatives}>
              Retry
            </button>
          </div>
        ) : creatives.length > 0 ? (
          <div className="creatives-grid">
            {creatives.map(creative => (
              <AdCopyCard key={creative.id} creative={creative} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p className="empty-text">No generated creatives yet</p>
            <p className="empty-subtext">
              {selectedCampaign
                ? 'This campaign has no generated ad copy yet. Create a new campaign with Meta or Display channels to generate ad copy.'
                : 'Create a new campaign with Meta or Display channels to automatically generate ad copy variants.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default GenerationsList
