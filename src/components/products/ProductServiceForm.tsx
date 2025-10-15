import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { ArrowLeft, Save, Sparkles } from 'lucide-react'
import { useBrand } from '@/contexts/BrandContext'
import DynamicListInput from '@/components/common/DynamicListInput'
import ImageManager from '@/components/common/ImageManager'
import OfferInput, { Offer } from '@/components/common/OfferInput'
import axios from 'axios'
import './ProductServiceForm.css'

interface ParsedItem {
  name: string
  category: string
  description: string
  price: string
  features: string[]
  image_urls: string[]
  cturl?: string
}

interface LocationState {
  aiGenerated?: boolean
  initialData?: ParsedItem
  items?: ParsedItem[]
  isCollection?: boolean
}

const ProductServiceForm = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentBrand } = useBrand()
  const { slug, shortId } = useParams()

  const state = location.state as LocationState
  const isAIGenerated = state?.aiGenerated || false
  const initialItem = state?.initialData

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    cturl: '',
    features: [''],
    offers: [] as Offer[],
    images: [] as string[],
    defaultImage: undefined as string | undefined
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Pre-fill form with AI-generated data
  useEffect(() => {
    if (initialItem) {
      const images = initialItem.image_urls || []
      setFormData({
        name: initialItem.name || '',
        category: initialItem.category || '',
        description: initialItem.description || '',
        price: initialItem.price || '',
        cturl: initialItem.cturl || '',
        features: initialItem.features?.length > 0 ? initialItem.features : [''],
        offers: [],
        images: images,
        defaultImage: images[0] || undefined
      })
    }
  }, [initialItem])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentBrand) {
      setError('No brand selected')
      return
    }

    if (!formData.name || !formData.category) {
      setError('Name and category are required')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/products-services`, {
        brand_id: currentBrand.id,
        name: formData.name,
        category: formData.category,
        description: formData.description,
        price: formData.price,
        cturl: formData.cturl,
        features: formData.features.filter(f => f.trim() !== ''),
        offers: formData.offers.filter(o => o.offer_text.trim() !== ''),
        image_urls: formData.images,
        default_image_url: formData.defaultImage
      })

      if (response.data.success) {
        navigate(`/products/${slug}/${shortId}`)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create product/service')
      console.error('Failed to create product/service:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoBack = () => {
    navigate(`/products/${slug}/${shortId}`)
  }

  return (
    <div className="product-service-form-page">
      <div className="form-header">
        <button className="back-button" onClick={handleGoBack}>
          <ArrowLeft size={20} />
          <span>Back to Products</span>
        </button>
        <h1 className="form-title">Add Product/Service</h1>
      </div>

      {isAIGenerated && (
        <div className="ai-generated-badge">
          <Sparkles size={16} />
          <span>AI-Generated Content - Review and edit as needed</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="product-service-form">
        <div className="form-section">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Product/Service Name *</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Premium Web Design Package"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category *</label>
              <input
                type="text"
                className="form-input"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Digital Services"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your product or service..."
              rows={4}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Price</label>
            <input
              type="text"
              className="form-input"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="e.g., $2,999 or Starting at $500/mo"
            />
          </div>

          <div className="form-group">
            <label className="form-label">CTA URL</label>
            <input
              type="url"
              className="form-input"
              value={formData.cturl}
              onChange={(e) => setFormData({ ...formData, cturl: e.target.value })}
              placeholder="e.g., https://example.com/product"
            />
            <p className="form-hint">URL for campaign call-to-action buttons</p>
          </div>

          <div className="form-group">
            <label className="form-label">Images</label>
            <ImageManager
              images={formData.images}
              defaultImage={formData.defaultImage}
              onChange={(images, defaultImage) => setFormData({ ...formData, images, defaultImage })}
              maxImages={10}
            />
          </div>

          <DynamicListInput
            label="Features"
            items={formData.features}
            onChange={(features) => setFormData({ ...formData, features })}
            placeholder="Add a feature..."
          />

          <OfferInput
            label="Offers"
            offers={formData.offers}
            onChange={(offers) => setFormData({ ...formData, offers })}
          />

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
              disabled={isSubmitting}
            >
              <Save size={18} />
              {isSubmitting ? 'Saving...' : 'Save Product/Service'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default ProductServiceForm
