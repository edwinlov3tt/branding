import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, TrendingUp, Trash2 } from 'lucide-react'
import { useBrand } from '@/contexts/BrandContext'
import axios from 'axios'
import './CompetitorAnalysisDetail.css'

interface Ad {
  id: string
  image?: string
  thumbnail?: string
  video_url?: string
  ad_copy?: string
  cta_type?: string
  link_url?: string
  advertiser_name?: string
  publisher_platform?: string
}

interface CompetitorAnalysis {
  id: string
  brand_id: string
  competitor_id?: string
  competitor_name: string
  competitor_website?: string
  facebook_page: string
  total_ads_analyzed: number
  ad_ids: string[]
  ads_data: Ad[]
  overview?: string
  positioning?: string
  creative_strategy?: any
  messaging_analysis?: any
  visual_design_elements?: any
  target_audience_insights?: any
  performance_indicators?: any
  recommendations?: string[]
  key_findings?: string[]
  analysis_model?: string
  analysis_confidence?: number
  analysis_start_date: string
  analysis_end_date: string
  created_at: string
}

const CompetitorAnalysisDetail = () => {
  const navigate = useNavigate()
  const { currentBrand } = useBrand()
  const { slug, shortId, analysisId } = useParams()

  const [analysis, setAnalysis] = useState<CompetitorAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (currentBrand && analysisId) {
      loadAnalysis()
    }
  }, [currentBrand, analysisId])

  const loadAnalysis = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/competitor-analyses/${analysisId}`)

      if (response.data.success) {
        setAnalysis(response.data.data)
      } else {
        setError('Analysis not found')
      }
    } catch (err) {
      console.error('Failed to load competitor analysis:', err)
      setError('Failed to load competitor analysis')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!analysis || !currentBrand) return

    if (!confirm('Are you sure you want to delete this competitor analysis?')) {
      return
    }

    try {
      const response = await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/competitor-analyses/${analysis.id}`)

      if (response.data.success) {
        navigate(`/competitors/${slug}/${shortId}`)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete competitor analysis')
      console.error('Failed to delete competitor analysis:', err)
    }
  }

  const handleGoBack = () => {
    navigate(`/competitors/${slug}/${shortId}`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="competitor-analysis-detail">
        <div className="detail-loading">
          <p>Loading analysis...</p>
        </div>
      </div>
    )
  }

  if (error || !analysis) {
    return (
      <div className="competitor-analysis-detail">
        <div className="detail-loading">
          <div className="detail-error">
            <p>{error || 'Analysis not found'}</p>
            <button className="button button-secondary" onClick={handleGoBack}>
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="competitor-analysis-detail">
      <div className="detail-header">
        <button className="back-button" onClick={handleGoBack}>
          <ArrowLeft size={20} />
          <span>Back to Competitor Analysis</span>
        </button>
        <div className="header-actions">
          <button className="button button-danger" onClick={handleDelete}>
            <Trash2 size={18} />
            Delete
          </button>
        </div>
      </div>

      {error && (
        <div className="detail-error-message">
          {error}
        </div>
      )}

      <div className="detail-content">
        {/* Analysis Summary Header */}
        <div className="analysis-summary-header">
          <h1 className="analysis-title">{analysis.competitor_name}</h1>

          {analysis.facebook_page && (
            <p className="facebook-page-link">{analysis.facebook_page}</p>
          )}

          <div className="analysis-meta-row">
            <div className="meta-badge">
              <Calendar size={16} />
              <span>
                {formatDate(analysis.analysis_start_date)} - {formatDate(analysis.analysis_end_date)}
              </span>
            </div>
            <div className="meta-badge">
              <TrendingUp size={16} />
              <span>{analysis.total_ads_analyzed} ads analyzed</span>
            </div>
          </div>
        </div>

        {/* Compact Analysis Summary */}
        <div className="analysis-summary-compact">
          {analysis.overview && (
            <div className="summary-section">
              <h3>Overview</h3>
              <p>{analysis.overview}</p>
            </div>
          )}

          {analysis.positioning && (
            <div className="summary-section">
              <h3>Positioning</h3>
              <p>{analysis.positioning}</p>
            </div>
          )}

          {analysis.key_findings && analysis.key_findings.length > 0 && (
            <div className="summary-section">
              <h3>Key Findings</h3>
              <ul>
                {analysis.key_findings.map((finding, index) => (
                  <li key={index}>{finding}</li>
                ))}
              </ul>
            </div>
          )}

          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div className="summary-section">
              <h3>Recommendations</h3>
              <ul>
                {analysis.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Ads Grid */}
        {analysis.ads_data && analysis.ads_data.length > 0 && (
          <div className="ads-section">
            <h2 className="section-title">Ad Creatives ({analysis.ads_data.length})</h2>
            <div className="ads-grid">
              {analysis.ads_data.map((ad, index) => (
                <div key={ad.id || index} className="ad-card">
                  <div className="ad-media">
                    {ad.video_url ? (
                      <video
                        src={ad.video_url}
                        controls
                        poster={ad.thumbnail || ad.image}
                        className="ad-video"
                      />
                    ) : (
                      <img
                        src={ad.image || ad.thumbnail}
                        alt={`Ad ${index + 1}`}
                        className="ad-image"
                      />
                    )}
                  </div>
                  {ad.ad_copy && (
                    <div className="ad-copy">
                      <p>{ad.ad_copy}</p>
                    </div>
                  )}
                  {ad.cta_type && (
                    <div className="ad-meta">
                      <span className="ad-cta">CTA: {ad.cta_type}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {analysis.analysis_model && (
          <div className="analysis-footer">
            <p className="analysis-model">Analysis generated by {analysis.analysis_model}</p>
            <p className="analysis-date">Created {formatDate(analysis.created_at)}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CompetitorAnalysisDetail
