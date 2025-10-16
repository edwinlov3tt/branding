import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
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
  const [searchQuery, setSearchQuery] = useState('')

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

  // Filter audiences based on search query
  const filteredAudiences = useMemo(() => {
    if (!searchQuery.trim()) return audiences

    const query = searchQuery.toLowerCase()
    return audiences.filter(audience => {
      // Search in name, demographics, description
      const searchableText = [
        audience.name,
        audience.demographics,
        audience.description,
        ...(Array.isArray(audience.interests) ? audience.interests : []),
        ...(Array.isArray(audience.goals) ? audience.goals : []),
        ...(Array.isArray(audience.pain_points) ? audience.pain_points : [])
      ].filter(Boolean).join(' ').toLowerCase()

      return searchableText.includes(query)
    })
  }, [audiences, searchQuery])

  return (
    <div className="audience-list">
      <div className="app-header">
        <h2 className="section-title">Target Audiences</h2>
        <div className="header-actions">
          <label className="search-box">
            <Search size={16} />
            <input
              type="search"
              placeholder="Search audiences, behaviors, goals…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search audiences"
            />
          </label>
          <button className="button button-primary" onClick={handleAddAudience}>
            <Plus size={18} />
            Add Audience
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="empty-state">
          <p className="empty-text">Loading audiences...</p>
        </div>
      ) : filteredAudiences.length > 0 ? (
        <div className="audiences-grid">
          {filteredAudiences.map(audience => (
            <TargetAudienceCard
              key={audience.id}
              audience={audience}
              onDelete={loadAudiences}
            />
          ))}
        </div>
      ) : searchQuery ? (
        <div className="empty-state">
          <p className="empty-text">No audiences found matching "{searchQuery}"</p>
          <p className="empty-subtext">Try adjusting your search terms</p>
        </div>
      ) : (
        <div className="empty-state">
          <p className="empty-text">No target audiences added yet</p>
          <p className="empty-subtext">Click "Add Audience" above to define your first audience segment and start building targeted campaigns.</p>
        </div>
      )}
    </div>
  )
}

export default TargetAudienceList
