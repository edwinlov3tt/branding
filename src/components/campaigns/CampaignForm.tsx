import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Plus, X } from 'lucide-react'
import { useBrand } from '@/contexts/BrandContext'
import axios from 'axios'
import './CampaignForm.css'

interface TargetAudience {
  id: string
  name: string
}

interface ProductService {
  id: string
  name: string
  category: string
}

const MARKETING_OBJECTIVES = [
  { value: 'awareness', label: 'Awareness (reach, impressions)' },
  { value: 'engagement', label: 'Engagement (clicks, video views, social interactions)' },
  { value: 'lead_generation', label: 'Lead Generation (form fills, registrations)' },
  { value: 'purchase_conversion', label: 'Purchase / Conversion' },
  { value: 'retention_loyalty', label: 'Retention / Loyalty' },
  { value: 'other', label: 'Other' }
]

const CHANNEL_OPTIONS = [
  'Addressable Solutions - Display',
  'Blended Tactics - Display',
  'Email Marketing',
  'Meta',
  'SEM',
  'Spark'
]

const CampaignForm = () => {
  const navigate = useNavigate()
  const { currentBrand } = useBrand()
  const { slug, shortId } = useParams()

  const [formData, setFormData] = useState({
    name: '',
    objective: '',
    product_service_id: '',
    marketing_objectives: [] as string[],
    other_objective: '',
    target_audience_ids: [] as string[],
    start_date: '',
    end_date: '',
    channels: [] as string[],
    status: 'draft' as 'draft' | 'active' | 'paused' | 'completed'
  })

  const [audiences, setAudiences] = useState<TargetAudience[]>([])
  const [products, setProducts] = useState<ProductService[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (currentBrand) {
      loadAudiences()
      loadProducts()
    }
  }, [currentBrand])

  const loadAudiences = async () => {
    if (!currentBrand) return

    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/target-audiences`, {
        params: { brand_id: currentBrand.id }
      })

      if (response.data.success) {
        setAudiences(response.data.data)
      }
    } catch (err) {
      console.error('Failed to load target audiences:', err)
    }
  }

  const loadProducts = async () => {
    if (!currentBrand) return

    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products-services`, {
        params: { brand_id: currentBrand.id }
      })

      if (response.data.success) {
        setProducts(response.data.data)
      }
    } catch (err) {
      console.error('Failed to load products/services:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentBrand) {
      setError('No brand selected')
      return
    }

    if (!formData.name || !formData.objective) {
      setError('Name and objective are required')
      return
    }

    if (formData.marketing_objectives.length === 0) {
      setError('Please select at least one marketing objective')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/campaigns`, {
        brand_id: currentBrand.id,
        name: formData.name,
        objective: formData.objective,
        product_service_id: formData.product_service_id || null,
        marketing_objectives: formData.marketing_objectives,
        other_objective: formData.other_objective || null,
        target_audience_ids: formData.target_audience_ids,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        channels: formData.channels,
        status: formData.status
      })

      if (response.data.success) {
        const campaign = response.data.data

        // Check if Meta or Display channels are selected for generation
        const hasGeneratableChannels = formData.channels.some(
          channel => channel === 'Meta' || channel.includes('Display')
        )

        // Trigger ad copy generation if channels are selected
        if (hasGeneratableChannels && formData.channels.length > 0) {
          setIsSubmitting(false)
          setIsGenerating(true)

          try {
            console.log(`🚀 Triggering ad copy generation for campaign: ${campaign.id}`)
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/campaigns/${campaign.id}/generate-creatives`)
            console.log('✅ Ad copy generation completed')
          } catch (genErr: any) {
            console.error('Ad copy generation failed:', genErr)
            // Don't block navigation on generation failure
            setError('Campaign created, but ad copy generation failed. You can try again from the campaigns list.')
          } finally {
            setIsGenerating(false)
          }
        }

        navigate(`/campaigns/${slug}/${shortId}`)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create campaign')
      console.error('Failed to create campaign:', err)
    } finally {
      setIsSubmitting(false)
      setIsGenerating(false)
    }
  }

  const handleGoBack = () => {
    navigate(`/campaigns/${slug}/${shortId}`)
  }

  const handleAudienceToggle = (audienceId: string) => {
    if (formData.target_audience_ids.includes(audienceId)) {
      setFormData({
        ...formData,
        target_audience_ids: formData.target_audience_ids.filter(id => id !== audienceId)
      })
    } else {
      setFormData({
        ...formData,
        target_audience_ids: [...formData.target_audience_ids, audienceId]
      })
    }
  }

  const handleMarketingObjectiveToggle = (objective: string) => {
    if (formData.marketing_objectives.includes(objective)) {
      setFormData({
        ...formData,
        marketing_objectives: formData.marketing_objectives.filter(o => o !== objective)
      })
    } else {
      setFormData({
        ...formData,
        marketing_objectives: [...formData.marketing_objectives, objective]
      })
    }
  }

  const handleChannelToggle = (channel: string) => {
    if (formData.channels.includes(channel)) {
      setFormData({
        ...formData,
        channels: formData.channels.filter(c => c !== channel)
      })
    } else {
      setFormData({
        ...formData,
        channels: [...formData.channels, channel]
      })
    }
  }

  return (
    <div className="campaign-form-page">
      <div className="form-header">
        <button className="back-button" onClick={handleGoBack}>
          <ArrowLeft size={20} />
          <span>Back to Campaigns</span>
        </button>
        <h1 className="form-title">Add Campaign</h1>
      </div>

      <form onSubmit={handleSubmit} className="campaign-form">
        <div className="form-section">
          <div className="form-group">
            <label className="form-label">Campaign Name *</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Spring Product Launch 2024"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Product/Service</label>
            <select
              className="form-select"
              value={formData.product_service_id}
              onChange={(e) => setFormData({ ...formData, product_service_id: e.target.value })}
            >
              <option value="">Select a product/service (optional)</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} - {product.category}
                </option>
              ))}
            </select>
            {products.length === 0 && (
              <p className="form-hint">No products/services created yet.</p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Campaign Objective *</label>
            <textarea
              className="form-textarea"
              value={formData.objective}
              onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
              placeholder="Describe the main goal of this campaign..."
              rows={4}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Marketing Objective(s) *</label>
            <div className="checkbox-group">
              {MARKETING_OBJECTIVES.map(obj => (
                <label key={obj.value} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.marketing_objectives.includes(obj.value)}
                    onChange={() => handleMarketingObjectiveToggle(obj.value)}
                  />
                  <span>{obj.label}</span>
                </label>
              ))}
            </div>
            {formData.marketing_objectives.includes('other') && (
              <input
                type="text"
                className="form-input"
                style={{ marginTop: '12px' }}
                value={formData.other_objective}
                onChange={(e) => setFormData({ ...formData, other_objective: e.target.value })}
                placeholder="Specify other objective..."
              />
            )}
          </div>

          <div className="form-row form-row-3">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Target Audiences</label>
            {audiences.length > 0 ? (
              <div className="checkbox-group">
                {audiences.map(audience => (
                  <label key={audience.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.target_audience_ids.includes(audience.id)}
                      onChange={() => handleAudienceToggle(audience.id)}
                    />
                    <span>{audience.name}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="form-hint">No target audiences created yet. Create audiences first to select them here.</p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Channels</label>
            <div className="checkbox-group">
              {CHANNEL_OPTIONS.map(channel => (
                <label key={channel} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.channels.includes(channel)}
                    onChange={() => handleChannelToggle(channel)}
                  />
                  <span>{channel}</span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={handleGoBack}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button button-primary"
              disabled={isSubmitting || isGenerating}
            >
              <Save size={18} />
              {isGenerating ? 'Generating Ad Copy...' : isSubmitting ? 'Saving...' : 'Save Campaign'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default CampaignForm
