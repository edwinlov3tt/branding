import { useState } from 'react'
import PersonaCard from './PersonaCard'
import PersonaGenerator from './PersonaGenerator'
import type { Persona } from '@/types'
import './PersonaList.css'

const PersonaList = () => {
  const [personas, setPersonas] = useState<Persona[]>([
    {
      id: '1',
      name: 'Sarah Chen',
      role: 'Product Marketing Manager',
      businessContext: 'Manages go-to-market for B2B software products',
      painPoints: [
        'Complex feature communication to non-technical buyers',
        'Long sales cycles with multiple stakeholders',
        'Proving ROI for marketing spend'
      ],
      behaviors: [
        'Checks analytics daily, especially Monday mornings',
        'Active on LinkedIn and industry forums',
        'Prefers email communication during business hours'
      ],
      motivations: [
        'Career advancement and recognition',
        'Team efficiency and growth',
        'Measurable business impact'
      ],
      budgetRange: '$5,000 - $15,000/month',
      objections: [
        'Concerned about learning curve for team',
        'Needs approval from leadership',
        'Worried about implementation time'
      ],
      benefits: [
        'Streamlined workflow saves 10+ hours per week',
        'Better ROI tracking and reporting',
        'Professional results without expensive agency'
      ],
      pitch: 'Simplify your product marketing with data-driven creative tools that speak to technical and business buyers alike.',
      cta: 'Start Free Trial'
    }
  ])

  const [isGenerating, setIsGenerating] = useState(false)

  const handleGeneratePersonas = (newPersonas: Persona[]) => {
    setPersonas([...personas, ...newPersonas])
  }

  return (
    <div className="persona-list">
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Customer Personas</h2>
          <button
            className="button button-primary"
            onClick={() => setIsGenerating(!isGenerating)}
          >
            {isGenerating ? 'Cancel' : 'Generate Personas'}
          </button>
        </div>

        {isGenerating && (
          <PersonaGenerator
            onPersonasGenerated={handleGeneratePersonas}
            onClose={() => setIsGenerating(false)}
          />
        )}

        <div className="personas-grid">
          {personas.map(persona => (
            <PersonaCard key={persona.id} persona={persona} />
          ))}
        </div>

        {personas.length === 0 && (
          <div className="empty-state">
            <p className="empty-text">No personas created yet.</p>
            <p className="empty-subtext">Click "Generate Personas" to create customer personas based on your brand profile.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default PersonaList