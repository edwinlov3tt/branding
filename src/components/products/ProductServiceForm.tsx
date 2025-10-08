import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { useBrand } from '@/contexts/BrandContext'
import DynamicListInput from '@/components/common/DynamicListInput'
import axios from 'axios'
import './ProductServiceForm.css'

const ProductServiceForm = () => {
  const navigate = useNavigate()
  const { currentBrand } = useBrand()
  const { slug, shortId } = useParams()

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    features: [''],
    image_url: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

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
        features: formData.features.filter(f => f.trim() !== ''),
        image_url: formData.image_url
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

          <div className="form-row">
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
              <label className="form-label">Image URL</label>
              <input
                type="url"
                className="form-input"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          <DynamicListInput
            label="Features"
            items={formData.features}
            onChange={(features) => setFormData({ ...formData, features })}
            placeholder="Add a feature..."
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
