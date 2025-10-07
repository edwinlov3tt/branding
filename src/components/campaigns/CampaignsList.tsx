import { useState } from 'react'
import CampaignCard from './CampaignCard'
import type { Campaign } from '@/types'
import './CampaignsList.css'

const CampaignsList = () => {
  const [campaigns] = useState<Campaign[]>([])

  return (
    <div className="campaigns-list">
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Campaigns</h2>
          <button className="button button-primary">
            Add Campaign
          </button>
        </div>

        <div className="campaigns-grid">
          {campaigns.map(campaign => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>

        {campaigns.length === 0 && (
          <div className="empty-state">
            <p className="empty-text">No campaigns created yet</p>
            <p className="empty-subtext">Click "Add Campaign" above to plan and launch your first marketing campaign.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CampaignsList
