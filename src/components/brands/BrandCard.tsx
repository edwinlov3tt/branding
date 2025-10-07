import React from 'react'
import { Building2, ExternalLink } from 'lucide-react'
import type { Brand } from '@/types'
import './BrandCard.css'

interface Props {
  brand: Brand
  onSelect: (brandId: string) => void
}

const BrandCard = ({ brand, onSelect }: Props) => {
  const [imageError, setImageError] = React.useState(false);

  return (
    <div className="brand-card card" onClick={() => onSelect(brand.id)}>
      <div className="brand-card-header">
        {brand.logo && !imageError ? (
          <img
            src={brand.logo}
            alt={brand.name}
            className="brand-card-logo"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="brand-card-logo-placeholder" style={{ backgroundColor: brand.primaryColor || '#dc2626' }}>
            <Building2 size={32} color="#fff" />
          </div>
        )}
        <div className="brand-card-info">
          <h3 className="brand-card-name">{brand.name}</h3>
          <a
            href={brand.website}
            target="_blank"
            rel="noopener noreferrer"
            className="brand-card-website"
            onClick={(e) => e.stopPropagation()}
          >
            {brand.website}
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      <div className="brand-card-meta">
        <div className="brand-card-stat">
          <span className="stat-label">Audiences</span>
          <span className="stat-value">{brand.audiences?.length || 0}</span>
        </div>
        <div className="brand-card-stat">
          <span className="stat-label">Products</span>
          <span className="stat-value">{brand.products?.length || 0}</span>
        </div>
        <div className="brand-card-stat">
          <span className="stat-label">Campaigns</span>
          <span className="stat-value">{brand.campaigns?.length || 0}</span>
        </div>
      </div>

      <div className="brand-card-footer">
        <span className="brand-card-date">
          Created {new Date(brand.createdAt).toLocaleDateString()}
        </span>
        <button className="button button-primary button-sm">
          Manage Brand
        </button>
      </div>
    </div>
  )
}

export default BrandCard
