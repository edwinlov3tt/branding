import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Package, Plus, ExternalLink } from 'lucide-react'
import { useBrand } from '@/contexts/BrandContext'
import axios from 'axios'
import './ProductsServices.css'

interface Offer {
  id?: string
  offer_text: string
  expiration_date?: string
}

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

const ProductsServices = () => {
  const navigate = useNavigate()
  const { currentBrand } = useBrand()
  const { slug, shortId } = useParams()
  const [products, setProducts] = useState<ProductService[]>([])

  useEffect(() => {
    if (currentBrand) {
      loadProducts()
    }
  }, [currentBrand])

  const loadProducts = async () => {
    if (!currentBrand) return
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products-services`, {
        params: { brand_id: currentBrand.id }
      })

      if (response.data.success) {
        setProducts(response.data.data)
      }
    } catch (error) {
      console.error('Failed to load products/services:', error)
    }
  }

  const handleAddProduct = () => {
    navigate(`/products/${slug}/${shortId}/new`)
  }

  return (
    <div className="products-services">
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Products & Services</h2>
          <button className="button button-primary" onClick={handleAddProduct}>
            <Plus size={18} />
            Add Product/Service
          </button>
        </div>

        {products.length > 0 ? (
          <div className="products-grid">
            {products.map(product => {
              const displayImage = product.default_image_url || product.image_url

              // Calculate active offers
              const now = new Date()
              const activeOffers = product.offers?.filter(offer =>
                !offer.expiration_date || new Date(offer.expiration_date) >= now
              ) || []

              // Check if all offers are expired
              const hasExpiredOffers = product.offers && product.offers.length > 0 &&
                product.offers.every(offer => offer.expiration_date && new Date(offer.expiration_date) < now)

              return (
                <div key={product.id} className={`product-card card ${hasExpiredOffers ? 'card-expired' : ''}`}>
                  <div className="product-image">
                    {displayImage ? (
                      <img src={displayImage} alt={product.name} />
                    ) : (
                      <Package size={48} />
                    )}
                    {activeOffers.length > 0 && (
                      <div className="offers-chip">
                        Offers: {activeOffers.length}
                      </div>
                    )}
                  </div>
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-category">{product.category}</p>
                  <p className="product-description">{product.description}</p>
                  <div className="product-meta">
                    {product.price && (
                      <span className="product-price">{product.price}</span>
                    )}
                  </div>
                  <div className="product-features">
                    {product.features.slice(0, 3).map((feature, index) => (
                      <span key={index} className="feature-chip">{feature}</span>
                    ))}
                  </div>
                  <div className="product-actions">
                    <button
                      className="button button-primary"
                      onClick={() => navigate(`/products/${slug}/${shortId}/${product.id}`)}
                    >
                      View Details
                    </button>
                    {product.cturl && (
                      <a
                        href={product.cturl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="button button-secondary"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink size={16} />
                        Visit CTURL
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="empty-state">
            <p className="empty-text">No products or services added yet</p>
            <p className="empty-subtext">Click "Add Product/Service" above to catalog your offerings and showcase them to your audience.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductsServices
