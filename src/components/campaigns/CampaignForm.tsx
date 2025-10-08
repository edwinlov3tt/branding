import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { useBrand } from '@/contexts/BrandContext'
import DynamicListInput from '@/components/common/DynamicListInput'
import axios from 'axios'
import './CampaignForm.css'

interface TargetAudience {
  id: string
  name: string
}

const CampaignForm = () => {
  const navigate = useNavigate()
  const { currentBrand } = useBrand()
  const { slug, shortId } = useParams()

  const [formData, setFormData] = useState({
    name: '',
    objective: '',
    target_audience_ids: [] as string[],
    start_date: '',
    end_date: '',
    budget: '',
    channels: [''],
    status: 'draft' as 'draft' | 'active' | 'paused' | 'completed'
  })

  const [audiences, setAudiences] = useState<TargetAudience[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (currentBrand) {
      loadAudiences()
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

    setIsSubmitting(true)
    setError('')

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/campaigns`, {
        brand_id: currentBrand.id,
        name: formData.name,
        objective: formData.objective,
        target_audience_ids: formData.target_audience_ids,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        budget: formData.budget,
        channels: formData.channels.filter(c => c.trim() !== ''),
        status: formData.status
      })

      if (response.data.success) {
        navigate(`/campaigns/${slug}/${shortId}`)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create campaign')
      console.error('Failed to create campaign:', err)
    } finally {
      setIsSubmitting(false)
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

          <div className="form-row">
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
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Budget</label>
              <input
                type="text"
                className="form-input"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="e.g., $10,000 or $500/day"
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

          <DynamicListInput
            label="Channels"
            items={formData.channels}
            onChange={(channels) => setFormData({ ...formData, channels })}
            placeholder="e.g., Facebook Ads, Google Ads, Email"
          />

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
              disabled={isSubmitting}
            >
              <Save size={18} />
              {isSubmitting ? 'Saving...' : 'Save Campaign'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default CampaignForm
