import { useState } from 'react'
import { generatePersonas } from '@/services/api/personaService'
import type { Persona } from '@/types'
import './PersonaGenerator.css'

interface Props {
  onPersonasGenerated: (personas: Persona[]) => void
  onClose: () => void
}

const PersonaGenerator = ({ onPersonasGenerated, onClose }: Props) => {
  const [companyProfile, setCompanyProfile] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    if (!companyProfile.trim()) {
      setError('Please enter your company profile')
      return
    }

    setIsGenerating(true)
    setError('')

    try {
      const personas = await generatePersonas(companyProfile)
      onPersonasGenerated(personas)
      onClose()
    } catch (err) {
      setError('Failed to generate personas. Please try again.')
      console.error('Generation error:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="persona-generator">
      <div className="generator-header">
        <h3 className="generator-title">Generate Customer Personas</h3>
        <button className="close-button" onClick={onClose}>×</button>
      </div>

      <div className="form-group">
        <label className="form-label">Company Profile</label>
        <textarea
          className="textarea"
          placeholder="Describe your company, products, services, target market, and value proposition..."
          value={companyProfile}
          onChange={(e) => setCompanyProfile(e.target.value)}
          rows={6}
          disabled={isGenerating}
        />
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {isGenerating && (
        <div className="loading-container">
          <div className="loading"></div>
          <p className="loading-text">Generating personas based on your profile...</p>
        </div>
      )}

      <div className="generator-actions">
        <button
          className="button button-secondary"
          onClick={onClose}
          disabled={isGenerating}
        >
          Cancel
        </button>
        <button
          className="button button-primary"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Generate Personas'}
        </button>
      </div>
    </div>
  )
}

export default PersonaGenerator