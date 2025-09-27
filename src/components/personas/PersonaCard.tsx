import { User } from 'lucide-react'
import type { Persona } from '@/types'
import './PersonaCard.css'

interface Props {
  persona: Persona
}

const PersonaCard = ({ persona }: Props) => {
  return (
    <div className="persona-card card">
      <div className="persona-header">
        <div className="persona-avatar">
          <User size={24} /></div>
        <div>
          <h3 className="persona-name">{persona.name}</h3>
          <p className="persona-role">{persona.role}</p>
        </div>
      </div>

      <p className="persona-context">{persona.businessContext}</p>

      <div className="persona-section">
        <h4 className="persona-section-title">Pain Points</h4>
        <ul className="persona-list">
          {persona.painPoints.slice(0, 3).map((point, index) => (
            <li key={index}>{point}</li>
          ))}
        </ul>
      </div>

      <div className="persona-section">
        <h4 className="persona-section-title">Motivations</h4>
        <ul className="persona-list">
          {persona.motivations.slice(0, 3).map((motivation, index) => (
            <li key={index}>{motivation}</li>
          ))}
        </ul>
      </div>

      <div className="persona-section">
        <h4 className="persona-section-title">Budget Range</h4>
        <p className="persona-budget">{persona.budgetRange}</p>
      </div>

      <div className="persona-pitch">
        <p className="persona-pitch-text">{persona.pitch}</p>
        <button className="button button-primary persona-cta">
          {persona.cta}
        </button>
      </div>
    </div>
  )
}

export default PersonaCard