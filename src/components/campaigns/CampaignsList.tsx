import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useBrand } from '@/contexts/BrandContext'
import CampaignCard from './CampaignCard'
import axios from 'axios'
import './CampaignsList.css'

const CampaignsList = () => {
  const navigate = useNavigate()
  const { currentBrand } = useBrand()
  const { slug, shortId } = useParams()
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (currentBrand) {
      loadCampaigns()
    }
  }, [currentBrand])

  const loadCampaigns = async () => {
    if (!currentBrand) return

    setIsLoading(true)
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/campaigns`, {
        params: { brand_id: currentBrand.id }
      })

      if (response.data.success) {
        setCampaigns(response.data.data)
      }
    } catch (error) {
      console.error('Failed to load campaigns:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCampaign = () => {
    navigate(`/campaigns/${slug}/${shortId}/new`)
  }

  return (
    <div className="campaigns-list">
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Campaigns</h2>
          <button className="button button-primary" onClick={handleAddCampaign}>
            <Plus size={18} />
            Add Campaign
          </button>
        </div>

        {isLoading ? (
          <div className="empty-state">
            <p className="empty-text">Loading campaigns...</p>
          </div>
        ) : campaigns.length > 0 ? (
          <div className="campaigns-grid">
            {campaigns.map(campaign => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        ) : (
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
