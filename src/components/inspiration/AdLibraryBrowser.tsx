import { useState, useEffect } from 'react'
import { Search, Filter, X, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { AdInspiration } from '@/types'
import { getCuratedAds, saveAdInspiration } from '@/services/api/inspirationService'
import { useBrand } from '@/contexts/BrandContext'
import AdCard from './AdCard'
import './AdLibraryBrowser.css'

const AdLibraryBrowser = () => {
  const navigate = useNavigate()
  const { currentBrand } = useBrand()

  const [ads, setAds] = useState<AdInspiration[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all')
  const [selectedNiche, setSelectedNiche] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  const platforms = ['all', 'Facebook', 'Instagram', 'TikTok', 'YouTube', 'LinkedIn', 'Pinterest']
  const niches = [
    'all',
    'Fashion',
    'Sustainable Fashion',
    'Productivity',
    'Design Tools',
    'Food & Beverage',
    'Meal Kits',
    'Fitness',
    'Health',
    'Beauty',
    'Finance',
    'Payments',
    'Travel',
    'Education',
    'Home',
    'Home Decor',
    'Gaming',
    'Music'
  ]

  useEffect(() => {
    loadCuratedAds()
  }, [selectedPlatform, selectedNiche])

  const loadCuratedAds = async () => {
    setIsLoading(true)
    setError('')

    try {
      const params: any = {}
      if (selectedPlatform !== 'all') params.platform = selectedPlatform
      if (selectedNiche !== 'all') params.niche = selectedNiche

      const curatedAds = await getCuratedAds(params)
      setAds(curatedAds)
    } catch (err: any) {
      setError(err.message || 'Failed to load ad inspirations')
      console.error('Failed to load curated ads:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveAd = async (ad: AdInspiration) => {
    if (!currentBrand) {
      alert('Please select a brand first')
      return
    }

    try {
      await saveAdInspiration({
        brand_id: currentBrand.id,
        foreplay_ad_id: ad.foreplay_ad_id,
        ad_data: ad.ad_data,
        thumbnail_url: ad.thumbnail_url,
        video_url: ad.video_url,
        platform: ad.platform,
        advertiser_name: ad.advertiser_name,
        niche: ad.niche,
        ad_copy: ad.ad_copy
      })

      // Show success message
      alert('Ad saved to inspiration!')
    } catch (err: any) {
      alert(err.message || 'Failed to save ad')
    }
  }

  const filteredAds = ads.filter(ad => {
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()
    return (
      ad.advertiser_name.toLowerCase().includes(query) ||
      ad.ad_copy?.toLowerCase().includes(query) ||
      ad.niche?.toLowerCase().includes(query)
    )
  })

  const handleGoBack = () => {
    if (currentBrand) {
      navigate(`/inspiration/${currentBrand.slug}/${currentBrand.shortId}`)
    } else {
      navigate('/brands')
    }
  }

  return (
    <div className="ad-library-browser">
      <div className="ad-library-header">
        <button className="back-button" onClick={handleGoBack}>
          <ArrowLeft size={20} />
          <span>Back to Inspiration</span>
        </button>

        <h1 className="ad-library-title">Ad Inspiration Library</h1>
        <p className="ad-library-subtitle">
          Browse curated ad creatives from top brands. Search to explore with Foreplay API.
        </p>
      </div>

      <div className="ad-library-controls">
        <div className="search-section">
          <div className="search-bar-large">
            <Search size={20} />
            <input
              type="text"
              className="search-input-large"
              placeholder="Search by brand, copy, or niche..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="search-clear"
                onClick={() => setSearchQuery('')}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            <span>Filters</span>
          </button>
        </div>

        {showFilters && (
          <div className="filters-panel">
            <div className="filter-group">
              <label className="filter-label">Platform</label>
              <div className="filter-options">
                {platforms.map(platform => (
                  <button
                    key={platform}
                    className={`filter-option ${selectedPlatform === platform ? 'active' : ''}`}
                    onClick={() => setSelectedPlatform(platform)}
                  >
                    {platform}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">Niche</label>
              <div className="filter-options">
                {niches.map(niche => (
                  <button
                    key={niche}
                    className={`filter-option ${selectedNiche === niche ? 'active' : ''}`}
                    onClick={() => setSelectedNiche(niche)}
                  >
                    {niche}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="ad-library-loading">
          <div className="loading"></div>
          <p>Loading ad inspirations...</p>
        </div>
      )}

      {error && (
        <div className="ad-library-error">
          <p>{error}</p>
          <button onClick={loadCuratedAds}>Try Again</button>
        </div>
      )}

      {!isLoading && !error && filteredAds.length > 0 && (
        <div className="ads-grid-masonry">
          {filteredAds.map(ad => (
            <AdCard
              key={ad.id}
              ad={ad}
              onSave={handleSaveAd}
              showSaveButton={!!currentBrand}
            />
          ))}
        </div>
      )}

      {!isLoading && !error && filteredAds.length === 0 && (
        <div className="ad-library-empty">
          <p>No ads found matching your criteria</p>
          <p className="empty-subtext">Try adjusting your filters or search query</p>
        </div>
      )}
    </div>
  )
}

export default AdLibraryBrowser
