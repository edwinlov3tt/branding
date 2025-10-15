import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { useBrand } from '@/contexts/BrandContext'
import axios from 'axios'
import './TargetAudienceForm.css'

const TargetAudienceEdit = () => {
  const navigate = useNavigate()
  const { currentBrand } = useBrand()
  const { slug, shortId, audienceId } = useParams()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    demographics: '',
    interests: '',
    pain_points: '',
    goals: '',
    budget_range: '',
    channels: ''
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (audienceId) {
      loadAudience()
    }
  }, [audienceId])

  const loadAudience = async () => {
    console.log('🔄 Loading audience with ID:', audienceId)

    try {
      const url = `${import.meta.env.VITE_API_BASE_URL}/api/target-audiences`
      console.log('📡 Making request to:', url, 'with params:', { id: audienceId })

      const response = await axios.get(url, {
        params: { id: audienceId }
      })

      console.log('📥 Response:', response.data)

      if (response.data.success && response.data.data) {
        const audience = response.data.data
        console.log('✅ Audience loaded successfully:', audience.name)

        setFormData({
          name: audience.name || '',
          description: audience.description || '',
          demographics: audience.demographics || '',
          interests: Array.isArray(audience.interests) ? audience.interests.join(', ') : '',
          pain_points: Array.isArray(audience.pain_points) ? audience.pain_points.join(', ') : '',
          goals: Array.isArray(audience.goals) ? audience.goals.join(', ') : '',
          budget_range: audience.budget_range || '',
          channels: Array.isArray(audience.channels) ? audience.channels.join(', ') : ''
        })
      } else {
        console.warn('⚠️ No audience data in response')
        setError('Audience not found')
      }
    } catch (err: any) {
      console.error('❌ Failed to load target audience:', err)
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      })
      setError(err.response?.data?.error || 'Failed to load target audience. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentBrand) {
      setError('No brand selected')
      return
    }

    if (!formData.name) {
      setError('Audience name is required')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // Convert comma-separated strings to arrays
      const interests = formData.interests ? formData.interests.split(',').map(s => s.trim()).filter(Boolean) : []
      const pain_points = formData.pain_points ? formData.pain_points.split(',').map(s => s.trim()).filter(Boolean) : []
      const goals = formData.goals ? formData.goals.split(',').map(s => s.trim()).filter(Boolean) : []
      const channels = formData.channels ? formData.channels.split(',').map(s => s.trim()).filter(Boolean) : []

      const response = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/target-audiences`, {
        id: audienceId,
        name: formData.name,
        description: formData.description,
        demographics: formData.demographics,
        interests,
        pain_points,
        goals,
        budget_range: formData.budget_range,
        channels
      })

      if (response.data.success) {
        navigate(`/audiences/${slug}/${shortId}`)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update target audience')
      console.error('Failed to update target audience:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoBack = () => {
    navigate(`/audiences/${slug}/${shortId}`)
  }

  if (isLoading) {
    return (
      <div className="target-audience-form-page">
        <div className="empty-state">
          <p className="empty-text">Loading audience...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="target-audience-form-page">
      <div className="form-header">
        <button className="back-button" onClick={handleGoBack}>
          <ArrowLeft size={20} />
          <span>Back to Audiences</span>
        </button>
        <h1 className="form-title">Edit Target Audience</h1>
      </div>

      <form onSubmit={handleSubmit} className="target-audience-form">
        <div className="form-section">
          <div className="form-group">
            <label className="form-label">Audience Name *</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Tech-Savvy Millennials"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe this target audience..."
              rows={4}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Demographics</label>
            <textarea
              className="form-textarea"
              value={formData.demographics}
              onChange={(e) => setFormData({ ...formData, demographics: e.target.value })}
              placeholder="e.g., Age 25-40, Urban professionals, Bachelor's degree or higher, $50k-$100k income"
              rows={3}
            />
            <p className="form-hint">Describe the demographic characteristics of this audience</p>
          </div>

          <div className="form-group">
            <label className="form-label">Interests</label>
            <input
              type="text"
              className="form-input"
              value={formData.interests}
              onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
              placeholder="e.g., Technology, Innovation, Design, Sustainability"
            />
            <p className="form-hint">Comma-separated list of interests</p>
          </div>

          <div className="form-group">
            <label className="form-label">Pain Points</label>
            <input
              type="text"
              className="form-input"
              value={formData.pain_points}
              onChange={(e) => setFormData({ ...formData, pain_points: e.target.value })}
              placeholder="e.g., Time constraints, Budget limitations, Complex solutions"
            />
            <p className="form-hint">Comma-separated list of pain points</p>
          </div>

          <div className="form-group">
            <label className="form-label">Goals</label>
            <input
              type="text"
              className="form-input"
              value={formData.goals}
              onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
              placeholder="e.g., Career advancement, Better work-life balance, Save time"
            />
            <p className="form-hint">Comma-separated list of goals</p>
          </div>

          <div className="form-group">
            <label className="form-label">Budget Range</label>
            <input
              type="text"
              className="form-input"
              value={formData.budget_range}
              onChange={(e) => setFormData({ ...formData, budget_range: e.target.value })}
              placeholder="e.g., $1,000 - $5,000"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Preferred Channels</label>
            <input
              type="text"
              className="form-input"
              value={formData.channels}
              onChange={(e) => setFormData({ ...formData, channels: e.target.value })}
              placeholder="e.g., Instagram, LinkedIn, Email, YouTube"
            />
            <p className="form-hint">Comma-separated list of channels</p>
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
              disabled={isSubmitting}
            >
              <Save size={18} />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default TargetAudienceEdit
