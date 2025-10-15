import { useNavigate, useParams } from 'react-router-dom'
import { Calendar, TrendingUp } from 'lucide-react'

interface CompetitorAnalysis {
  id: string
  competitor_name: string
  facebook_page: string
  total_ads_analyzed: number
  analysis_start_date: string
  analysis_end_date: string
  created_at: string
}

interface CompetitorAnalysisCardProps {
  analysis: CompetitorAnalysis
}

const CompetitorAnalysisCard = ({ analysis }: CompetitorAnalysisCardProps) => {
  const navigate = useNavigate()
  const { slug, shortId } = useParams()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleViewAnalysis = () => {
    navigate(`/competitors/${slug}/${shortId}/${analysis.id}`)
  }

  return (
    <div className="card competitor-analysis-card">
      <h3 className="competitor-name">{analysis.competitor_name}</h3>

      {analysis.facebook_page && (
        <p className="facebook-page">{analysis.facebook_page}</p>
      )}

      <div className="analysis-meta">
        <div className="meta-item">
          <Calendar size={16} />
          <span>
            {formatDate(analysis.analysis_start_date)} - {formatDate(analysis.analysis_end_date)}
          </span>
        </div>
        <div className="meta-item">
          <TrendingUp size={16} />
          <span>{analysis.total_ads_analyzed} ads analyzed</span>
        </div>
      </div>

      <button
        className="button button-primary view-analysis-btn"
        onClick={handleViewAnalysis}
      >
        View Analysis
      </button>
    </div>
  )
}

export default CompetitorAnalysisCard
