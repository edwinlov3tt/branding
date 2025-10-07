import { useState } from 'react'
import TargetAudienceCard from './TargetAudienceCard'
import type { TargetAudience } from '@/types'
import './TargetAudienceList.css'

const TargetAudienceList = () => {
  const [audiences] = useState<TargetAudience[]>([])

  return (
    <div className="audience-list">
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Target Audiences</h2>
          <button className="button button-primary">
            Add Target Audience
          </button>
        </div>

        <div className="audiences-grid">
          {audiences.map(audience => (
            <TargetAudienceCard key={audience.id} audience={audience} />
          ))}
        </div>

        {audiences.length === 0 && (
          <div className="empty-state">
            <p className="empty-text">No target audiences added yet</p>
            <p className="empty-subtext">Click "Add Target Audience" above to define your first audience segment and start building targeted campaigns.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default TargetAudienceList
