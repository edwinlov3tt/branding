import { useState, useEffect } from 'react'
import { Search, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { AdInspiration } from '@/types'
import { useBrand } from '@/contexts/BrandContext'
import { getBrandAdInspirations } from '@/services/api/inspirationService'
import AdCard from './AdCard'
import './InspirationLibrary.css'

const InspirationLibrary = () => {
  const navigate = useNavigate()
  const { currentBrand } = useBrand()
  const [ads, setAds] = useState<AdInspiration[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (currentBrand) {
      loadBrandAds()
    }
  }, [currentBrand])

  const loadBrandAds = async () => {
    if (!currentBrand) return

    setIsLoading(true)
    try {
      const brandAds = await getBrandAdInspirations(currentBrand.id)
      setAds(brandAds)
    } catch (error) {
      console.error('Failed to load brand ad inspirations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const categories = ['all', 'Facebook', 'Instagram', 'TikTok', 'YouTube', 'LinkedIn']

  const handleBrowseAdLibrary = () => {
    if (currentBrand) {
      navigate(`/ad-library/${currentBrand.slug}/${currentBrand.shortId}`)
    } else {
      navigate('/ad-library')
    }
  }

  const filteredAds = ads.filter(ad => {
    const matchesCategory = selectedCategory === 'all' || ad.platform === selectedCategory
    const matchesSearch = ad.advertiser_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (ad.ad_copy && ad.ad_copy.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  return (
    <div className="inspiration-library">
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Inspiration Library</h2>
          <button className="button button-primary" onClick={handleBrowseAdLibrary}>
            <Sparkles size={18} />
            Browse Ad Library
          </button>
        </div>

        <div className="filters-container">
          <div className="search-bar">
            <Search size={18} />
            <input
              type="text"
              className="search-input"
              placeholder="Search inspiration..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="category-filters">
            {categories.map(category => (
              <button
                key={category}
                className={`filter-button ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="empty-state">
            <p className="empty-text">Loading your saved ads...</p>
          </div>
        ) : filteredAds.length > 0 ? (
          <div className="ads-grid-masonry">
            {filteredAds.map(ad => (
              <AdCard
                key={ad.id}
                ad={ad}
                isSaved={true}
                showSaveButton={false}
              />
            ))}
          </div>
        ) : ads.length > 0 ? (
          <div className="empty-state">
            <p className="empty-text">No ads match your filters</p>
            <p className="empty-subtext">Try adjusting your search or category filters.</p>
          </div>
        ) : (
          <div className="empty-state">
            <p className="empty-text">No inspiration templates added yet</p>
            <p className="empty-subtext">Click "Browse Ad Library" above to discover and save ad creatives from top brands.</p>
            <button className="button button-primary empty-cta" onClick={handleBrowseAdLibrary}>
              <Sparkles size={18} />
              Browse Ad Library
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default InspirationLibrary