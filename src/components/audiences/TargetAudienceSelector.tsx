import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Sparkles, PencilLine } from 'lucide-react'
import './TargetAudienceSelector.css'

const TargetAudienceSelector = () => {
  const navigate = useNavigate()
  const { slug, shortId } = useParams()

  const handleAIAutoFill = () => {
    navigate(`/audiences/${slug}/${shortId}/new/ai`)
  }

  const handleManualEntry = () => {
    navigate(`/audiences/${slug}/${shortId}/new/manual`)
  }

  const handleGoBack = () => {
    navigate(`/audiences/${slug}/${shortId}`)
  }

  return (
    <div className="audience-selector-page">
      <div className="selector-header">
        <button className="back-button" onClick={handleGoBack}>
          <ArrowLeft size={20} />
          <span>Back to Target Audiences</span>
        </button>
        <h1 className="selector-title">Add Target Audience</h1>
      </div>

      <div className="selector-content">
        <div className="selector-cards">
          <div className="selector-card" onClick={handleAIAutoFill}>
            <div className="card-icon ai-icon">
              <Sparkles size={32} />
            </div>
            <h2 className="card-title">AI Auto-Fill</h2>
            <p className="card-description">
              Describe your target audience and let AI generate detailed personas based on your brand profile, products/services, and competitor insights.
            </p>
            <button className="button button-primary card-button">
              <Sparkles size={18} />
              Use AI Auto-Fill
            </button>
          </div>

          <div className="selector-card" onClick={handleManualEntry}>
            <div className="card-icon manual-icon">
              <PencilLine size={32} />
            </div>
            <h2 className="card-title">Manual Entry</h2>
            <p className="card-description">
              Manually enter demographic and psychographic details to create a custom target audience persona.
            </p>
            <button className="button button-secondary card-button">
              <PencilLine size={18} />
              Manual Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TargetAudienceSelector
