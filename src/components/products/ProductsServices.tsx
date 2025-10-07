import { useState } from 'react'
import { Package } from 'lucide-react'
import type { ProductService } from '@/types'
import './ProductsServices.css'

const ProductsServices = () => {
  const [products] = useState<ProductService[]>([])

  return (
    <div className="products-services">
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Products & Services</h2>
          <button className="button button-primary">Add Product/Service</button>
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
