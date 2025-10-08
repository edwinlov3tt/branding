import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Package, Plus } from 'lucide-react'
import { useBrand } from '@/contexts/BrandContext'
import axios from 'axios'
import './ProductsServices.css'

interface ProductService {
  id: string
  brand_id: string
  name: string
  category: string
  description: string
  price: string
  features: string[]
  image_url: string
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
            {products.map(product => (
              <div key={product.id} className="product-card card">
                <div className="product-image">
                  <Package size={48} />
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
                <button className="button button-primary product-action">
                  View Details
                </button>
              </div>
            ))}
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
