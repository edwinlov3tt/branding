import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, TrendingUp } from 'lucide-react'
import { useBrand } from '@/contexts/BrandContext'
import CompetitorAnalysisCard from './CompetitorAnalysisCard'
import axios from 'axios'
import './CompetitorAnalysis.css'

interface CompetitorAnalysis {
  id: string
  competitor_name: string
  facebook_page: string
  total_ads_analyzed: number
  analysis_start_date: string
  analysis_end_date: string
  created_at: string
}

const CompetitorAnalysis = () => {
  const navigate = useNavigate()
  const { currentBrand } = useBrand()
  const { slug, shortId } = useParams()
  const [analyses, setAnalyses] = useState<CompetitorAnalysis[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (currentBrand) {
      loadAnalyses()
    }
  }, [currentBrand])

  const loadAnalyses = async () => {
    if (!currentBrand) return
    setIsLoading(true)
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/competitor-analyses`, {
        params: { brand_id: currentBrand.id }
      })

      if (response.data.success) {
        setAnalyses(response.data.data)
      }
    } catch (error) {
      console.error('Failed to load competitor analyses:', error)
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
            <p className="empty-text">Loading analyses...</p>
          </div>
        ) : analyses.length > 0 ? (
          <div className="analyses-grid">
            {analyses.map(analysis => (
              <CompetitorAnalysisCard key={analysis.id} analysis={analysis} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <TrendingUp size={48} />
            <p className="empty-text">No competitor analyses yet</p>
            <p className="empty-subtext">
              Click "Add Competitor" above to analyze a competitor's Facebook ads and gain insights into their advertising strategy.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CompetitorAnalysis
