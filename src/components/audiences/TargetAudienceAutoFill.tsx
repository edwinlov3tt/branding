import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Sparkles, Check, Edit2, Trash2 } from 'lucide-react'
import { useBrand } from '@/contexts/BrandContext'
import axios from 'axios'
import './TargetAudienceAutoFill.css'

interface GeneratedAudience {
  id: string
  name: string
  age_range: string
  gender: string
  location: string
  income_level: string
  education: string
  occupation: string
  interests: string[]
  values: string[]
  lifestyle: string
  pain_points: string[]
  goals: string[]
  buying_behavior: string
}

const TargetAudienceAutoFill = () => {
  const navigate = useNavigate()
  const { currentBrand } = useBrand()
  const { slug, shortId } = useParams()

  const [description, setDescription] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedAudiences, setGeneratedAudiences] = useState<GeneratedAudience[]>([])
  const [selectedAudiences, setSelectedAudiences] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleGenerate = async () => {
    if (!currentBrand) {
      setError('No brand selected')
      return
    }

    if (!description.trim()) {
      setError('Please enter an audience description')
      return
    }

    setIsGenerating(true)
    setError('')

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/ai/generate-audiences`, {
        brand_id: currentBrand.id,
        audience_description: description
      })

      if (response.data.success) {
        const audiences = response.data.data.map((audience: any, index: number) => ({
          ...audience,
          id: `generated-${index}`
        }))
        setGeneratedAudiences(audiences)
        // Select all by default
        setSelectedAudiences(new Set(audiences.map((a: GeneratedAudience) => a.id)))
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate audiences')
      console.error('Failed to generate audiences:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleAudienceSelection = (audienceId: string) => {
    const newSelected = new Set(selectedAudiences)
    if (newSelected.has(audienceId)) {
      newSelected.delete(audienceId)
    } else {
      newSelected.add(audienceId)
    }
    setSelectedAudiences(newSelected)
  }

  const handleEdit = (audienceId: string) => {
    // Navigate to manual form with pre-filled data
    const audience = generatedAudiences.find(a => a.id === audienceId)
    if (audience) {
      navigate(`/audiences/${slug}/${shortId}/new/manual`, {
        state: { prefillData: audience }
      })
    }
  }

  const handleRemove = (audienceId: string) => {
    setGeneratedAudiences(generatedAudiences.filter(a => a.id !== audienceId))
    const newSelected = new Set(selectedAudiences)
    newSelected.delete(audienceId)
    setSelectedAudiences(newSelected)
  }

  const handleSave = async () => {
    if (!currentBrand) return

    const selectedAudiencesData = generatedAudiences.filter(a => selectedAudiences.has(a.id))

    if (selectedAudiencesData.length === 0) {
      setError('Please select at least one audience to save')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      // Save each selected audience
      for (const audience of selectedAudiencesData) {
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/target-audiences`, {
          brand_id: currentBrand.id,
          name: audience.name,
          age_range: audience.age_range,
          gender: audience.gender,
          location: audience.location,
          income_level: audience.income_level,
          education: audience.education,
          occupation: audience.occupation,
          interests: audience.interests,
          values: audience.values,
          lifestyle: audience.lifestyle,
          pain_points: audience.pain_points,
          goals: audience.goals,
          buying_behavior: audience.buying_behavior,
          budget_range: (audience as any).budget_range || null,
          channels: (audience as any).channels || []
        })
      }

      // Navigate back to list
      navigate(`/audiences/${slug}/${shortId}`)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save audiences')
      console.error('Failed to save audiences:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleGoBack = () => {
    navigate(`/audiences/${slug}/${shortId}/new`)
  }

  return (
    <div className="audience-autofill-page">
      <div className="autofill-header">
        <button className="back-button" onClick={handleGoBack}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <h1 className="autofill-title">AI Auto-Fill Target Audience</h1>
      </div>

      {generatedAudiences.length === 0 ? (
        <div className="input-section">
          <div className="input-card">
            <div className="input-icon">
              <Sparkles size={40} />
            </div>
            <h2 className="input-card-title">Describe Your Target Audience</h2>
            <p className="input-card-description">
              Enter a brief description of your target audience. Our AI will use your brand profile, products/services, and competitor insights to generate detailed personas.
            </p>

            <div className="form-group">
              <label className="form-label">Audience Description *</label>
              <textarea
                className="form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Tech-savvy millennials interested in sustainable living, or Busy professionals who value convenience and quality"
                rows={4}
                disabled={isGenerating}
              />
              <p className="form-hint">Be as specific or general as you'd like - AI will fill in the details</p>
            </div>

            {error && (
              <div className="form-error">
                {error}
              </div>
            )}

            <div className="input-actions">
              <button
                className="button button-secondary"
                onClick={handleGoBack}
                disabled={isGenerating}
              >
                Cancel
              </button>
              <button
                className="button button-primary"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                <Sparkles size={18} />
                {isGenerating ? 'Generating...' : 'Generate Audiences'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="results-section">
          <div className="results-header">
            <h2 className="results-title">Generated Audiences ({generatedAudiences.length})</h2>
            <p className="results-subtitle">Select the audiences you want to save. You can edit or remove them before saving.</p>
          </div>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <div className="audiences-grid">
            {generatedAudiences.map((audience) => (
              <div
                key={audience.id}
                className={`audience-card ${selectedAudiences.has(audience.id) ? 'selected' : ''}`}
              >
                <div className="audience-card-header">
                  <input
                    type="checkbox"
                    checked={selectedAudiences.has(audience.id)}
                    onChange={() => toggleAudienceSelection(audience.id)}
                    className="audience-checkbox"
                  />
                  <h3 className="audience-name">{audience.name}</h3>
                  <div className="audience-actions">
                    <button
                      className="icon-button"
                      onClick={() => handleEdit(audience.id)}
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className="icon-button danger"
                      onClick={() => handleRemove(audience.id)}
                      title="Remove"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="audience-details">
                  <div className="detail-row">
                    <strong>Demographics:</strong>
                    <span>{audience.age_range} • {audience.gender} • {audience.location}</span>
                  </div>
                  <div className="detail-row">
                    <strong>Income:</strong>
                    <span>{audience.income_level}</span>
                  </div>
                  <div className="detail-row">
                    <strong>Education:</strong>
                    <span>{audience.education}</span>
                  </div>
                  <div className="detail-row">
                    <strong>Occupation:</strong>
                    <span>{audience.occupation}</span>
                  </div>
                  {audience.interests && audience.interests.length > 0 && (
                    <div className="detail-row">
                      <strong>Interests:</strong>
                      <span>{audience.interests.join(', ')}</span>
                    </div>
                  )}
                  {audience.pain_points && audience.pain_points.length > 0 && (
                    <div className="detail-row">
                      <strong>Pain Points:</strong>
                      <span>{audience.pain_points.join(', ')}</span>
                    </div>
                  )}
                  {audience.goals && audience.goals.length > 0 && (
                    <div className="detail-row">
                      <strong>Goals:</strong>
                      <span>{audience.goals.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="results-actions">
            <button
              className="button button-secondary"
              onClick={() => setGeneratedAudiences([])}
              disabled={isSaving}
            >
              Start Over
            </button>
            <button
              className="button button-primary"
              onClick={handleSave}
              disabled={isSaving || selectedAudiences.size === 0}
            >
              <Check size={18} />
              {isSaving ? 'Saving...' : `Save Selected (${selectedAudiences.size})`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TargetAudienceAutoFill
