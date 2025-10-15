import { Target, Calendar, Package } from 'lucide-react'
import './CampaignCard.css'

interface Campaign {
  id: string
  brand_id: string
  name: string
  objective: string
  product_service_id?: string
  marketing_objectives: string[]
  other_objective?: string
  target_audience_ids: string[]
  start_date?: string
  end_date?: string
  channels: string[]
  status: 'draft' | 'active' | 'paused' | 'completed'
  created_at: string
  updated_at: string
}

interface Props {
  campaign: Campaign
}

const MARKETING_OBJECTIVES_LABELS: Record<string, string> = {
  'awareness': 'Awareness',
  'engagement': 'Engagement',
  'lead_generation': 'Lead Generation',
  'purchase_conversion': 'Purchase/Conversion',
  'retention_loyalty': 'Retention/Loyalty',
  'other': 'Other'
}

const CampaignCard = ({ campaign }: Props) => {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'draft': 'status-draft',
      'active': 'status-active',
      'paused': 'status-paused',
      'completed': 'status-completed'
    }
    return colors[status] || 'status-draft'
  }

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const formatDate = (date?: string) => {
    if (!date) return 'Not set'
    return new Date(date).toLocaleDateString()
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
            <span className={`campaign-chip ${getStatusColor(campaign.status)}`}>
              {getStatusLabel(campaign.status)}
            </span>
          </div>
        </div>
      </div>

      <div className="campaign-section">
        <h4 className="campaign-section-title">Objective</h4>
        <p className="campaign-context">{campaign.objective}</p>
      </div>

      {campaign.marketing_objectives && campaign.marketing_objectives.length > 0 && (
        <div className="campaign-section">
          <h4 className="campaign-section-title">Marketing Objectives</h4>
          <div className="campaign-objectives">
            {campaign.marketing_objectives.map((obj, index) => (
              <span key={index} className="objective-chip">
                {MARKETING_OBJECTIVES_LABELS[obj] || obj}
              </span>
            ))}
            {campaign.other_objective && (
              <span className="objective-chip">{campaign.other_objective}</span>
            )}
          </div>
        </div>
      )}

      {campaign.channels && campaign.channels.length > 0 && (
        <div className="campaign-section">
          <h4 className="campaign-section-title">Channels</h4>
          <div className="campaign-channels">
            {campaign.channels.map((channel, index) => (
              <span key={index} className="channel-chip">{channel}</span>
            ))}
          </div>
        </div>
      )}

      <div className="campaign-section">
        <h4 className="campaign-section-title">Campaign Period</h4>
        <p className="campaign-dates">
          <Calendar size={14} />
          {formatDate(campaign.start_date)} - {formatDate(campaign.end_date)}
        </p>
      </div>
    </div>
  )
}

export default CampaignCard
