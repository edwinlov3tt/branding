import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { useBrand } from '@/contexts/BrandContext'
import axios from 'axios'
import './TargetAudienceForm.css'

const TargetAudienceForm = () => {
  const navigate = useNavigate()
  const { currentBrand } = useBrand()
  const { slug, shortId } = useParams()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    demographics: {
      age_range: '',
      gender: '',
      location: '',
      income_level: '',
      education: '',
      occupation: ''
    },
    psychographics: {
      interests: '',
      values: '',
      lifestyle: '',
      pain_points: '',
      goals: '',
      buying_behavior: ''
    }
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

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
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/target-audiences`, {
        brand_id: currentBrand.id,
        name: formData.name,
        description: formData.description,
        demographics: formData.demographics,
        psychographics: formData.psychographics
      })

      if (response.data.success) {
        navigate(`/audiences/${slug}/${shortId}`)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create target audience')
      console.error('Failed to create target audience:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoBack = () => {
    navigate(`/audiences/${slug}/${shortId}`)
  }

  return (
    <div className="target-audience-form-page">
      <div className="form-header">
        <button className="back-button" onClick={handleGoBack}>
          <ArrowLeft size={20} />
          <span>Back to Audiences</span>
        </button>
        <h1 className="form-title">Add Target Audience</h1>
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

          <div className="section-divider">
            <h3 className="section-subtitle">Demographics</h3>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Age Range</label>
              <input
                type="text"
                className="form-input"
                value={formData.demographics.age_range}
                onChange={(e) => setFormData({
                  ...formData,
                  demographics: { ...formData.demographics, age_range: e.target.value }
                })}
                placeholder="e.g., 25-40"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Gender</label>
              <input
                type="text"
                className="form-input"
                value={formData.demographics.gender}
                onChange={(e) => setFormData({
                  ...formData,
                  demographics: { ...formData.demographics, gender: e.target.value }
                })}
                placeholder="e.g., All, Male, Female, Non-binary"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Location</label>
              <input
                type="text"
                className="form-input"
                value={formData.demographics.location}
                onChange={(e) => setFormData({
                  ...formData,
                  demographics: { ...formData.demographics, location: e.target.value }
                })}
                placeholder="e.g., Urban areas, US/Canada"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Income Level</label>
              <input
                type="text"
                className="form-input"
                value={formData.demographics.income_level}
                onChange={(e) => setFormData({
                  ...formData,
                  demographics: { ...formData.demographics, income_level: e.target.value }
                })}
                placeholder="e.g., $50k-$100k"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Education</label>
              <input
                type="text"
                className="form-input"
                value={formData.demographics.education}
                onChange={(e) => setFormData({
                  ...formData,
                  demographics: { ...formData.demographics, education: e.target.value }
                })}
                placeholder="e.g., Bachelor's degree or higher"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Occupation</label>
              <input
                type="text"
                className="form-input"
                value={formData.demographics.occupation}
                onChange={(e) => setFormData({
                  ...formData,
                  demographics: { ...formData.demographics, occupation: e.target.value }
                })}
                placeholder="e.g., Marketing professionals"
              />
            </div>
          </div>

          <div className="section-divider">
            <h3 className="section-subtitle">Psychographics</h3>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Interests</label>
              <input
                type="text"
                className="form-input"
                value={formData.psychographics.interests}
                onChange={(e) => setFormData({
                  ...formData,
                  psychographics: { ...formData.psychographics, interests: e.target.value }
                })}
                placeholder="e.g., Technology, Innovation, Design"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Values</label>
              <input
                type="text"
                className="form-input"
                value={formData.psychographics.values}
                onChange={(e) => setFormData({
                  ...formData,
                  psychographics: { ...formData.psychographics, values: e.target.value }
                })}
                placeholder="e.g., Sustainability, Quality, Innovation"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Lifestyle</label>
              <input
                type="text"
                className="form-input"
                value={formData.psychographics.lifestyle}
                onChange={(e) => setFormData({
                  ...formData,
                  psychographics: { ...formData.psychographics, lifestyle: e.target.value }
                })}
                placeholder="e.g., Active, Health-conscious, Digital-first"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Pain Points</label>
              <input
                type="text"
                className="form-input"
                value={formData.psychographics.pain_points}
                onChange={(e) => setFormData({
                  ...formData,
                  psychographics: { ...formData.psychographics, pain_points: e.target.value }
                })}
                placeholder="e.g., Time constraints, Budget limitations"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Goals</label>
              <input
                type="text"
                className="form-input"
                value={formData.psychographics.goals}
                onChange={(e) => setFormData({
                  ...formData,
                  psychographics: { ...formData.psychographics, goals: e.target.value }
                })}
                placeholder="e.g., Career advancement, Better work-life balance"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Buying Behavior</label>
              <input
                type="text"
                className="form-input"
                value={formData.psychographics.buying_behavior}
                onChange={(e) => setFormData({
                  ...formData,
                  psychographics: { ...formData.psychographics, buying_behavior: e.target.value }
                })}
                placeholder="e.g., Research-driven, Loyal to brands, Early adopters"
              />
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
              disabled={isSubmitting}
            >
              <Save size={18} />
              {isSubmitting ? 'Saving...' : 'Save Audience'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default TargetAudienceForm
