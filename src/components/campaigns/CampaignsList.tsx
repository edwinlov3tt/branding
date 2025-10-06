import { useState } from 'react'
import CampaignCard from './CampaignCard'
import type { Campaign } from '@/types'
import './CampaignsList.css'

const CampaignsList = () => {
  const [campaigns] = useState<Campaign[]>([
    {
      id: '1',
      name: 'Summer Product Launch',
      marketingObjective: 'Awareness',
      launchDate: '2025-06-15',
      budget: '$25,000 - $50,000',
      objective: 'Launch new AI-powered marketing platform to B2B SaaS market',
      targetAudience: 'Marketing Directors and VPs at mid-market B2B companies (50-500 employees)',
      status: 'active'
    },
    {
      id: '2',
      name: 'Q4 Lead Generation',
      marketingObjective: 'Leads',
      launchDate: '2025-10-01',
      budget: '$15,000 - $30,000',
      objective: 'Generate qualified leads for enterprise sales team',
      targetAudience: 'Enterprise marketing leaders at companies with 500+ employees',
      status: 'draft'
    },
    {
      id: '3',
      name: 'Black Friday Promotion',
      marketingObjective: 'Sales',
      launchDate: '2025-11-25',
      budget: '$50,000 - $100,000',
      objective: 'Drive year-end sales with exclusive Black Friday discount campaign',
      targetAudience: 'Small business owners and marketing teams looking for affordable marketing tools',
      status: 'draft'
    }
  ])

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
            <p className="empty-text">No campaigns created yet.</p>
            <p className="empty-subtext">Click "Add Campaign" to create your first marketing campaign.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CampaignsList
