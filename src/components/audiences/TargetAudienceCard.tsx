import { Users } from 'lucide-react'
import type { TargetAudience } from '@/types'
import './TargetAudienceCard.css'

interface Props {
  audience: TargetAudience
}

const TargetAudienceCard = ({ audience }: Props) => {
  return (
    <div className="audience-card card">
      <div className="audience-header">
        <div className="audience-avatar">
          <Users size={24} />
        </div>
        <div>
          <h3 className="audience-name">{audience.name}</h3>
          <p className="audience-demographics">{audience.demographics}</p>
        </div>
      </div>

      <p className="audience-description">{audience.description}</p>

      <div className="audience-section">
        <h4 className="audience-section-title">Interests & Behaviors</h4>
        <ul className="audience-list">
          {audience.interests.slice(0, 3).map((interest, index) => (
            <li key={index}>{interest}</li>
          ))}
        </ul>
      </div>

      <div className="audience-section">
        <h4 className="audience-section-title">Pain Points</h4>
        <ul className="audience-list">
          {audience.painPoints.slice(0, 3).map((point, index) => (
            <li key={index}>{point}</li>
          ))}
        </ul>
      </div>

      <div className="audience-section">
        <h4 className="audience-section-title">Goals</h4>
        <ul className="audience-list">
          {audience.goals.slice(0, 3).map((goal, index) => (
            <li key={index}>{goal}</li>
          ))}
        </ul>
      </div>

      <div className="audience-section">
        <h4 className="audience-section-title">Budget Range</h4>
        <p className="audience-budget">{audience.budgetRange}</p>
      </div>

      <div className="audience-section">
        <h4 className="audience-section-title">Preferred Channels</h4>
        <div className="audience-channels">
          {audience.channels.map((channel, index) => (
            <span key={index} className="channel-chip">{channel}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TargetAudienceCard
