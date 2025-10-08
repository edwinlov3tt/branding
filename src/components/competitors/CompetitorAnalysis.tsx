import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useBrand } from '@/contexts/BrandContext'
import axios from 'axios'
import './CompetitorAnalysis.css'

interface Competitor {
  id: string
  brand_id: string
  name: string
  description: string
  website_url: string
  strengths: string[]
  weaknesses: string[]
  market_position: string
  created_at: string
  updated_at: string
}

const CompetitorAnalysis = () => {
  const navigate = useNavigate()
  const { currentBrand } = useBrand()
  const { slug, shortId } = useParams()
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (currentBrand) {
      loadCompetitors()
    }
  }, [currentBrand])

  const loadCompetitors = async () => {
    if (!currentBrand) return

    setIsLoading(true)
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/competitors`, {
        params: { brand_id: currentBrand.id }
      })

      if (response.data.success) {
        setCompetitors(response.data.data)
      }
    } catch (error) {
      console.error('Failed to load competitors:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCompetitor = () => {
    navigate(`/competitors/${slug}/${shortId}/new`)
  }

  return (
    <div className="competitor-analysis">
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Competitor Analysis</h2>
          <button className="button button-primary" onClick={handleAddCompetitor}>
            <Plus size={18} />
            Add Competitor
          </button>
        </div>

        {isLoading ? (
          <div className="empty-state">
            <p className="empty-text">Loading competitors...</p>
          </div>
        ) : competitors.length > 0 ? (
          <div className="competitors-grid">
            {competitors.map(competitor => (
              <div key={competitor.id} className="card competitor-card">
                <h3 className="competitor-name">{competitor.name}</h3>
                {competitor.website_url && (
                  <a href={competitor.website_url} target="_blank" rel="noopener noreferrer" className="competitor-website">
                    {competitor.website_url}
                  </a>
                )}
                {competitor.description && (
                  <p className="competitor-description">{competitor.description}</p>
                )}

                <div className="competitor-details">
                  {competitor.strengths && competitor.strengths.length > 0 && (
                    <div>
                      <h4>Strengths</h4>
                      <ul>
                        {competitor.strengths.map((strength, i) => (
                          <li key={i}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {competitor.weaknesses && competitor.weaknesses.length > 0 && (
                    <div>
                      <h4>Weaknesses</h4>
                      <ul>
                        {competitor.weaknesses.map((weakness, i) => (
                          <li key={i}>{weakness}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {competitor.market_position && (
                  <div className="competitor-footer">
                    <span className="status-badge status-warning">{competitor.market_position}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p className="empty-text">No competitors added yet</p>
            <p className="empty-subtext">Click "Add Competitor" above to start tracking your competition and analyze their market positioning.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CompetitorAnalysis