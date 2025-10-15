import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Search } from 'lucide-react'
import { useBrand } from '@/contexts/BrandContext'
import axios from 'axios'
import './CompetitorForm.css'

type DateRange = '3-months' | '6-months' | 'year-to-date' | 'all-time'

const CompetitorForm = () => {
  const navigate = useNavigate()
  const { currentBrand } = useBrand()
  const { slug, shortId } = useParams()

  const [formData, setFormData] = useState({
    competitor_name: '',
    facebook_page: '',
    date_range: '6-months' as DateRange
  })

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState('')

  const getDateRangeValues = (range: DateRange) => {
    const now = new Date()
    const endDate = now.toISOString().split('T')[0]
    let startDate: string

    switch (range) {
      case '3-months':
        const threeMonthsAgo = new Date(now)
        threeMonthsAgo.setMonth(now.getMonth() - 3)
        startDate = threeMonthsAgo.toISOString().split('T')[0]
        break
      case '6-months':
        const sixMonthsAgo = new Date(now)
        sixMonthsAgo.setMonth(now.getMonth() - 6)
        startDate = sixMonthsAgo.toISOString().split('T')[0]
        break
      case 'year-to-date':
        startDate = `${now.getFullYear()}-01-01`
        break
      case 'all-time':
        startDate = '2020-01-01' // Arbitrary old date
        break
      default:
        startDate = endDate
    }

    return { start_date: startDate, end_date: endDate }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentBrand) {
      setError('No brand selected')
      return
    }

    if (!formData.competitor_name) {
      setError('Competitor name is required')
      return
    }

    if (!formData.facebook_page) {
      setError('Facebook page is required')
      return
    }

    setIsAnalyzing(true)
    setError('')

    try {
      const { start_date, end_date } = getDateRangeValues(formData.date_range)

      // Use dedicated endpoint for local dev, unified for production (Vercel)
      const isLocalDev = import.meta.env.VITE_API_BASE_URL?.includes('localhost') ||
                        import.meta.env.VITE_API_BASE_URL?.includes('192.168');

      const endpoint = isLocalDev
        ? `${import.meta.env.VITE_API_BASE_URL}/api/ai/analyze-competitor`
        : `${import.meta.env.VITE_API_BASE_URL}/api/ai`;

      const payload = isLocalDev
        ? {
            brand_id: currentBrand.id,
            competitor_name: formData.competitor_name,
            facebook_page: formData.facebook_page,
            analysis_start_date: start_date,
            analysis_end_date: end_date
          }
        : {
            action: 'analyze-competitor',
            brand_id: currentBrand.id,
            competitor_name: formData.competitor_name,
            facebook_page: formData.facebook_page,
            analysis_start_date: start_date,
            analysis_end_date: end_date
          };

      const response = await axios.post(endpoint, payload)

      if (response.data.success) {
        navigate(`/competitors/${slug}/${shortId}`)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to analyze competitor ads')
      console.error('Failed to analyze competitor ads:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleGoBack = () => {
    navigate(`/competitors/${slug}/${shortId}`)
  }

  return (
    <div className="competitor-form-page">
      <div className="form-header">
        <button className="back-button" onClick={handleGoBack}>
          <ArrowLeft size={20} />
          <span>Back to Competitor Analysis</span>
        </button>
        <h1 className="form-title">Analyze Competitor Ads</h1>
      </div>

      <form onSubmit={handleSubmit} className="competitor-form">
        <div className="form-section">
          <div className="form-group">
            <label className="form-label">Competitor Name *</label>
            <input
              type="text"
              className="form-input"
              value={formData.competitor_name}
              onChange={(e) => setFormData({ ...formData, competitor_name: e.target.value })}
              placeholder="e.g., Acme Corp"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Facebook Page *</label>
            <input
              type="text"
              className="form-input"
              value={formData.facebook_page}
              onChange={(e) => setFormData({ ...formData, facebook_page: e.target.value })}
              placeholder="e.g., facebook.com/acmecorp or Acme Corp"
              required
            />
            <p className="form-hint">Enter the Facebook page URL or page name</p>
          </div>

          <div className="form-group">
            <label className="form-label">Time Period *</label>
            <div className="date-range-selector">
              <button
                type="button"
                className={`date-range-option ${formData.date_range === '3-months' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, date_range: '3-months' })}
              >
                Last 3 Months
              </button>
              <button
                type="button"
                className={`date-range-option ${formData.date_range === '6-months' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, date_range: '6-months' })}
              >
                Last 6 Months
              </button>
              <button
                type="button"
                className={`date-range-option ${formData.date_range === 'year-to-date' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, date_range: 'year-to-date' })}
              >
                Year to Date
              </button>
              <button
                type="button"
                className={`date-range-option ${formData.date_range === 'all-time' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, date_range: 'all-time' })}
              >
                All Time
              </button>
            </div>
          </div>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={handleGoBack}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button button-primary"
              disabled={isAnalyzing}
            >
              <Search size={18} />
              {isAnalyzing ? 'Analyzing...' : 'Analyze Competitor Ads'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default CompetitorForm
