import { Target, Calendar } from 'lucide-react'
import type { Campaign } from '@/types'
import './CampaignCard.css'

interface Props {
  campaign: Campaign
}

const CampaignCard = ({ campaign }: Props) => {
  const getObjectiveColor = (objective: string) => {
    const colors: Record<string, string> = {
      'Awareness': 'objective-awareness',
      'Conversions': 'objective-conversions',
      'Engagement': 'objective-engagement',
      'Leads': 'objective-leads',
      'Traffic': 'objective-traffic',
      'Sales': 'objective-sales'
    }
    return colors[objective] || 'objective-default'
  }

  return (
    <div className="campaign-card card">
      <div className="campaign-header">
        <div className="campaign-avatar">
          <Target size={24} />
        </div>
        <div className="campaign-header-info">
          <h3 className="campaign-name">{campaign.name}</h3>
          <div className="campaign-chips">
            <span className={`campaign-chip ${getObjectiveColor(campaign.marketingObjective)}`}>
              {campaign.marketingObjective}
            </span>
            <span className="campaign-chip campaign-date">
              <Calendar size={12} />
              {new Date(campaign.launchDate).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <div className="campaign-section">
        <h4 className="campaign-section-title">Objective</h4>
        <p className="campaign-context">{campaign.objective}</p>
      </div>

      <div className="campaign-section">
        <h4 className="campaign-section-title">Target Audience</h4>
        <p className="campaign-context">{campaign.targetAudience}</p>
      </div>

      <div className="campaign-section">
        <h4 className="campaign-section-title">Budget</h4>
        <p className="campaign-budget">{campaign.budget}</p>
      </div>

      <div className="campaign-footer">
        <button className="button button-primary campaign-cta">
          View Campaign
        </button>
      </div>
    </div>
  )
}

export default CampaignCard
