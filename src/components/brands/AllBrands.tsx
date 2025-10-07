import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import BrandCard from './BrandCard'
import type { Brand } from '@/types'
import { getAllBrands } from '@/services/api/brandService'
import { useBrand } from '@/contexts/BrandContext'
import { generateBrandUrl } from '@/utils/brandIdentifiers'
import './AllBrands.css'

const AllBrands = () => {
  const navigate = useNavigate()
  const { setCurrentBrand } = useBrand()
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBrands()
  }, [])

  const loadBrands = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await getAllBrands()

      if (response.success && response.data) {
        // Map database response to Brand type
        const mappedBrands: Brand[] = response.data.map((dbBrand: any) => ({
          id: dbBrand.id,
          name: dbBrand.name,
          website: dbBrand.website || '',
          logo: dbBrand.logo_url,
          primaryColor: dbBrand.primary_color,
          slug: dbBrand.slug,
          shortId: dbBrand.short_id,
          industry: dbBrand.industry,
          faviconUrl: dbBrand.favicon_url,
          createdAt: dbBrand.created_at,
          lastModified: dbBrand.updated_at,
          audiences: Array(parseInt(dbBrand.audience_count || '0')).fill({}),
          products: Array(parseInt(dbBrand.product_count || '0')).fill({}),
          campaigns: Array(parseInt(dbBrand.campaign_count || '0')).fill({}),
          competitors: Array(parseInt(dbBrand.competitor_count || '0')).fill({}),
          templates: Array(parseInt(dbBrand.template_count || '0')).fill({}),
          generations: Array(parseInt(dbBrand.generation_count || '0')).fill({})
        }))
        setBrands(mappedBrands)
      }
    } catch (err: any) {
      console.error('Failed to load brands:', err)
      setError(err.message || 'Failed to load brands')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectBrand = (brandId: string) => {
    const brand = brands.find(b => b.id === brandId)
    if (brand) {
      setCurrentBrand(brand)
      // Navigate to brand profile with brand-scoped URL
      navigate(generateBrandUrl(brand, 'brand'))
    }
  }

  const handleAddBrand = () => {
    // Navigate to onboarding wizard
    navigate('/onboard/new-brand')
  }

  return (
    <div className="all-brands">
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">All Brands</h2>
          <button className="button button-primary" onClick={handleAddBrand}>
            Add New Brand
          </button>
        </div>

        {loading && (
          <div className="empty-state">
            <p className="empty-text">Loading brands...</p>
          </div>
        )}

        {error && (
          <div className="empty-state">
            <p className="empty-text" style={{ color: 'var(--text-error, #ef4444)' }}>
              Error: {error}
            </p>
            <button className="button" onClick={loadBrands} style={{ marginTop: '16px' }}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="brands-grid">
              {brands.map(brand => (
                <BrandCard
                  key={brand.id}
                  brand={brand}
                  onSelect={handleSelectBrand}
                />
              ))}
            </div>

            {brands.length === 0 && (
              <div className="empty-state">
                <p className="empty-text">No brands added yet.</p>
                <p className="empty-subtext">Click "Add New Brand" to get started with the onboarding wizard.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default AllBrands
