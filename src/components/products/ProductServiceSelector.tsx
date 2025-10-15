import { useNavigate, useParams } from 'react-router-dom'
import { Sparkles, Edit3 } from 'lucide-react'
import './ProductServiceSelector.css'

const ProductServiceSelector = () => {
  const navigate = useNavigate()
  const { slug, shortId } = useParams()

  const handleManualCreate = () => {
    navigate(`/products/${slug}/${shortId}/new/manual`)
  }

  const handleAICreate = () => {
    navigate(`/products/${slug}/${shortId}/new/ai`)
  }

  return (
    <div className="product-service-selector">
      <div className="selector-container">
        <h1 className="selector-title">Add Product or Service</h1>
        <p className="selector-subtitle">
          Choose how you'd like to create your product or service
        </p>

        <div className="selector-cards">
          <div className="selector-card" onClick={handleAICreate}>
            <div className="selector-icon selector-icon-ai">
              <Sparkles size={32} />
            </div>
            <h2 className="selector-card-title">AI Auto-Fill</h2>
            <p className="selector-card-description">
              Provide a URL to your product or service page. AI will extract images, details, and features automatically.
            </p>
            <div className="selector-card-features">
              <div className="selector-feature">✓ Automatic image extraction</div>
              <div className="selector-feature">✓ Smart content parsing</div>
              <div className="selector-feature">✓ Handles collections</div>
            </div>
            <button className="selector-button selector-button-ai">
              <Sparkles size={18} />
              Use AI Auto-Fill
            </button>
          </div>

          <div className="selector-card" onClick={handleManualCreate}>
            <div className="selector-icon selector-icon-manual">
              <Edit3 size={32} />
            </div>
            <h2 className="selector-card-title">Manual Entry</h2>
            <p className="selector-card-description">
              Create your product or service from scratch with full control over every detail.
            </p>
            <div className="selector-card-features">
              <div className="selector-feature">✓ Complete control</div>
              <div className="selector-feature">✓ Custom fields</div>
              <div className="selector-feature">✓ No automation</div>
            </div>
            <button className="selector-button selector-button-manual">
              <Edit3 size={18} />
              Manual Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductServiceSelector
