import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Edit2, Save, Trash2, X, ExternalLink } from 'lucide-react'
import { useBrand } from '@/contexts/BrandContext'
import DynamicListInput from '@/components/common/DynamicListInput'
import ImageManager from '@/components/common/ImageManager'
import OfferInput, { Offer } from '@/components/common/OfferInput'
import axios from 'axios'
import './ProductServiceDetail.css'

interface ProductService {
  id: string
  brand_id: string
  name: string
  category: string
  description: string
  price: string
  cturl?: string
  features: string[]
  offers?: Offer[]
  image_url: string
  image_urls: string[]
  default_image_url: string
  created_at: string
  updated_at: string
}

const ProductServiceDetail = () => {
  const navigate = useNavigate()
  const { currentBrand } = useBrand()
  const { slug, shortId, productId } = useParams()

  const [product, setProduct] = useState<ProductService | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

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

  useEffect(() => {
    if (currentBrand && productId) {
      loadProduct()
    }
  }, [currentBrand, productId])

  const loadProduct = async () => {
    if (!currentBrand) return
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products-services`, {
        params: { brand_id: currentBrand.id }
      })

      if (response.data.success) {
        const foundProduct = response.data.data.find((p: ProductService) => p.id === productId)
        if (foundProduct) {
          setProduct(foundProduct)
          setFormData({
            name: foundProduct.name,
            category: foundProduct.category,
            description: foundProduct.description || '',
            price: foundProduct.price || '',
            cturl: foundProduct.cturl || '',
            features: foundProduct.features?.length > 0 ? foundProduct.features : [''],
            offers: foundProduct.offers || [],
            images: foundProduct.image_urls || (foundProduct.image_url ? [foundProduct.image_url] : []),
            defaultImage: foundProduct.default_image_url || foundProduct.image_url
          })
        } else {
          setError('Product/service not found')
        }
      }
    } catch (err) {
      console.error('Failed to load product/service:', err)
      setError('Failed to load product/service')
    }
  }

  const handleSave = async () => {
    if (!product || !currentBrand) return

    if (!formData.name || !formData.category) {
      setError('Name and category are required')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/products-services`, {
        id: product.id,
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
        setProduct(response.data.data)
        setIsEditing(false)
        loadProduct() // Reload to ensure consistency
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update product/service')
      console.error('Failed to update product/service:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!product || !currentBrand) return

    if (!confirm('Are you sure you want to delete this product/service?')) {
      return
    }

    try {
      const response = await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/products-services`, {
        params: { id: product.id }
      })

      if (response.data.success) {
        navigate(`/products/${slug}/${shortId}`)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete product/service')
      console.error('Failed to delete product/service:', err)
    }
  }

  const handleCancel = () => {
    if (product) {
      setFormData({
        name: product.name,
        category: product.category,
        description: product.description || '',
        price: product.price || '',
        cturl: product.cturl || '',
        features: product.features?.length > 0 ? product.features : [''],
        offers: product.offers || [],
        images: product.image_urls || (product.image_url ? [product.image_url] : []),
        defaultImage: product.default_image_url || product.image_url
      })
    }
    setIsEditing(false)
    setError('')
  }

  const handleGoBack = () => {
    navigate(`/products/${slug}/${shortId}`)
  }

  if (!product) {
    return (
      <div className="product-service-detail">
        <div className="detail-loading">
          {error ? (
            <div className="detail-error">
              <p>{error}</p>
              <button className="button button-secondary" onClick={handleGoBack}>
                Go Back
              </button>
            </div>
          ) : (
            <p>Loading...</p>
          )}
        </div>
      </div>
    )
  }

  const displayImage = formData.defaultImage || formData.images[0]

  // Check if all offers are expired
  const now = new Date()
  const hasExpiredOffers = product.offers && product.offers.length > 0 &&
    product.offers.every(offer => offer.expiration_date && new Date(offer.expiration_date) < now)

  // Filter active offers (non-expired)
  const activeOffers = product.offers?.filter(offer =>
    !offer.expiration_date || new Date(offer.expiration_date) >= now
  ) || []

  const expiredOffers = product.offers?.filter(offer =>
    offer.expiration_date && new Date(offer.expiration_date) < now
  ) || []

  return (
    <div className={`product-service-detail ${hasExpiredOffers ? 'detail-expired' : ''}`}>
      <div className="detail-header">
        <button className="back-button" onClick={handleGoBack}>
          <ArrowLeft size={20} />
          <span>Back to Products</span>
        </button>
        <div className="header-actions">
          {!isEditing ? (
            <>
              <button className="button button-secondary" onClick={() => setIsEditing(true)}>
                <Edit2 size={18} />
                Edit
              </button>
              <button className="button button-danger" onClick={handleDelete}>
                <Trash2 size={18} />
                Delete
              </button>
            </>
          ) : (
            <>
              <button className="button button-secondary" onClick={handleCancel} disabled={isSubmitting}>
                <X size={18} />
                Cancel
              </button>
              <button className="button button-primary" onClick={handleSave} disabled={isSubmitting}>
                <Save size={18} />
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="detail-error-message">
          {error}
        </div>
      )}

      <div className="detail-content">
        <div className="detail-main">
          {isEditing ? (
            <div className="edit-form">
              <div className="form-group">
                <label className="form-label">Product/Service Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Premium Web Design Package"
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
                />
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
            </div>
          ) : (
            <div className="detail-view">
              <div className="detail-image-container">
                {displayImage ? (
                  <img src={displayImage} alt={product.name} className="detail-image" />
                ) : (
                  <div className="detail-image-placeholder">No image</div>
                )}
              </div>

              <div className="detail-info">
                <p className="detail-category">{product.category}</p>
                <h1 className="detail-title">{product.name}</h1>
                {product.price && (
                  <p className="detail-price">{product.price}</p>
                )}
                {product.description && (
                  <p className="detail-description">{product.description}</p>
                )}

                {product.cturl && (
                  <div className="detail-cturl">
                    <a href={product.cturl} target="_blank" rel="noopener noreferrer" className="cturl-link">
                      <ExternalLink size={18} />
                      Visit Product Page
                    </a>
                  </div>
                )}

                {activeOffers.length > 0 && (
                  <div className="detail-offers">
                    <h3>Active Offers</h3>
                    <ul>
                      {activeOffers.map((offer, index) => (
                        <li key={index}>
                          <span className="offer-text">{offer.offer_text}</span>
                          {offer.expiration_date && (
                            <span className="offer-expiration">
                              Expires: {new Date(offer.expiration_date).toLocaleDateString()}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {expiredOffers.length > 0 && (
                  <div className="detail-offers detail-offers-expired">
                    <h3>Expired Offers</h3>
                    <ul>
                      {expiredOffers.map((offer, index) => (
                        <li key={index} className="offer-expired">
                          <span className="offer-text">{offer.offer_text}</span>
                          {offer.expiration_date && (
                            <span className="offer-expiration">
                              Expired: {new Date(offer.expiration_date).toLocaleDateString()}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {product.features && product.features.length > 0 && (
                  <div className="detail-features">
                    <h3>Features</h3>
                    <ul>
                      {product.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {product.image_urls && product.image_urls.length > 1 && (
                  <div className="detail-gallery">
                    <h3>Gallery</h3>
                    <div className="gallery-grid">
                      {product.image_urls.map((url, index) => (
                        <img key={index} src={url} alt={`${product.name} ${index + 1}`} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductServiceDetail
