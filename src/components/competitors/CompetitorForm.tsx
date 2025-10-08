import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { useBrand } from '@/contexts/BrandContext'
import DynamicListInput from '@/components/common/DynamicListInput'
import axios from 'axios'
import './CompetitorForm.css'

const CompetitorForm = () => {
  const navigate = useNavigate()
  const { currentBrand } = useBrand()
  const { slug, shortId } = useParams()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website_url: '',
    strengths: [''],
    weaknesses: [''],
    market_position: ''
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
      setError('Competitor name is required')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/competitors`, {
        brand_id: currentBrand.id,
        name: formData.name,
        description: formData.description,
        website_url: formData.website_url,
        strengths: formData.strengths.filter(s => s.trim() !== ''),
        weaknesses: formData.weaknesses.filter(w => w.trim() !== ''),
        market_position: formData.market_position
      })

      if (response.data.success) {
        navigate(`/competitors/${slug}/${shortId}`)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create competitor')
      console.error('Failed to create competitor:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoBack = () => {
    navigate(`/competitors/${slug}/${shortId}`)
  }

  return (
    <div className="competitor-form-page">
      <div className="form-header">
        <button className="back-button" onClick={handleGoBack}>
          <ArrowLeft size={20} />
          <span>Back to Competitors</span>
        </button>
        <h1 className="form-title">Add Competitor</h1>
      </div>

      <form onSubmit={handleSubmit} className="competitor-form">
        <div className="form-section">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Competitor Name *</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Acme Corp"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Website URL</label>
              <input
                type="url"
                className="form-input"
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe this competitor..."
              rows={4}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Market Position</label>
            <input
              type="text"
              className="form-input"
              value={formData.market_position}
              onChange={(e) => setFormData({ ...formData, market_position: e.target.value })}
              placeholder="e.g., Market Leader, Challenger, Niche Player"
            />
          </div>

          <DynamicListInput
            label="Strengths"
            items={formData.strengths}
            onChange={(strengths) => setFormData({ ...formData, strengths })}
            placeholder="Add a strength..."
          />

          <DynamicListInput
            label="Weaknesses"
            items={formData.weaknesses}
            onChange={(weaknesses) => setFormData({ ...formData, weaknesses })}
            placeholder="Add a weakness..."
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
              {isSubmitting ? 'Saving...' : 'Save Competitor'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default CompetitorForm
