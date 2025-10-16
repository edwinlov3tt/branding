import React from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, ExternalLink, Edit2, Trash2 } from 'lucide-react'
import { generateBrandUrl } from '@/utils/brandIdentifiers'
import type { Brand } from '@/types'
import axios from 'axios'
import './BrandCard.css'

interface Props {
  brand: Brand
  onSelect: (brandId: string) => void
  onDelete?: () => void
}

const BrandCard = ({ brand, onSelect, onDelete }: Props) => {
  const navigate = useNavigate()
  const [imageError, setImageError] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Navigate to brand profile page
    navigate(generateBrandUrl(brand, 'brand'))
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!window.confirm(`Are you sure you want to delete "${brand.name}"? This will permanently delete all associated audiences, products, campaigns, and data. This action cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/api/brands?id=${brand.id}`
      )

      if (response.data.success) {
        if (onDelete) {
          onDelete()
        }
      }
    } catch (error) {
      console.error('Failed to delete brand:', error)
      alert('Failed to delete brand. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleChipClick = (e: React.MouseEvent, path: string) => {
    e.stopPropagation()
    navigate(generateBrandUrl(brand, path))
  }

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
          {brand.industry && (
            <div className="brand-industry">
              <span className="industry-label">Industry:</span>
              <span className="industry-value">{brand.industry}</span>
            </div>
          )}
        </div>
        <div className="brand-card-actions">
          <button
            className="icon-btn"
            onClick={handleEdit}
            title="Edit brand"
            aria-label="Edit brand"
          >
            <Edit2 size={16} />
          </button>
          <button
            className="icon-btn"
            onClick={handleDelete}
            disabled={isDeleting}
            title="Delete brand"
            aria-label="Delete brand"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="brand-card-chips">
        <button
          className="brand-chip"
          onClick={(e) => handleChipClick(e, 'audiences')}
          title={`${brand.audiences?.length || 0} audiences`}
        >
          Audiences ({brand.audiences?.length || 0})
        </button>
        <button
          className="brand-chip"
          onClick={(e) => handleChipClick(e, 'products')}
          title={`${brand.products?.length || 0} products`}
        >
          Products ({brand.products?.length || 0})
        </button>
        <button
          className="brand-chip"
          onClick={(e) => handleChipClick(e, 'campaigns')}
          title={`${brand.campaigns?.length || 0} campaigns`}
        >
          Campaigns ({brand.campaigns?.length || 0})
        </button>
      </div>

      <div className="brand-card-body">
        {brand.description && (
          <div className="brand-card-meta">
            <div className="brand-meta-item">
              <span className="meta-label">Description:</span>
              <span className="meta-value">{brand.description}</span>
            </div>
          </div>
        )}
      </div>

      <div className="brand-card-footer">
        <span className="brand-card-date">
          Created {new Date(brand.createdAt).toLocaleDateString()}
        </span>
        <button className="button button-primary button-sm" onClick={(e) => { e.stopPropagation(); onSelect(brand.id); }}>
          Manage Brand
        </button>
      </div>
    </div>
  )
}

export default BrandCard
