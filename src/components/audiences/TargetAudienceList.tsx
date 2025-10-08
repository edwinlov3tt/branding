import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useBrand } from '@/contexts/BrandContext'
import TargetAudienceCard from './TargetAudienceCard'
import type { TargetAudience } from '@/types'
import axios from 'axios'
import './TargetAudienceList.css'

const TargetAudienceList = () => {
  const navigate = useNavigate()
  const { currentBrand } = useBrand()
  const { slug, shortId } = useParams()
  const [audiences, setAudiences] = useState<TargetAudience[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (currentBrand) {
      loadAudiences()
    }
  }, [currentBrand])

  const loadAudiences = async () => {
    if (!currentBrand) return

    setIsLoading(true)
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/target-audiences`, {
        params: { brand_id: currentBrand.id }
      })

      if (response.data.success) {
        setAudiences(response.data.data)
      }
    } catch (error) {
      console.error('Failed to load target audiences:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddAudience = () => {
    navigate(`/audiences/${slug}/${shortId}/new`)
  }

  return (
    <div className="audience-list">
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Target Audiences</h2>
          <button className="button button-primary" onClick={handleAddAudience}>
            <Plus size={18} />
            Add Target Audience
          </button>
        </div>

        {isLoading ? (
          <div className="empty-state">
            <p className="empty-text">Loading audiences...</p>
          </div>
        ) : audiences.length > 0 ? (
          <div className="audiences-grid">
            {audiences.map(audience => (
              <TargetAudienceCard key={audience.id} audience={audience} />
            ))}
          </div>
        ) : (
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
