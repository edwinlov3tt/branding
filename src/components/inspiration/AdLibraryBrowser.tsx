import { useState, useEffect } from 'react'
import { Search, Filter, X, ArrowLeft, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { AdInspiration } from '@/types'
import { getCuratedAds, saveAdInspiration, searchAds } from '@/services/api/inspirationService'
import { useBrand } from '@/contexts/BrandContext'
import AdCard from './AdCard'
import './AdLibraryBrowser.css'

const AdLibraryBrowser = () => {
  const navigate = useNavigate()
  const { currentBrand } = useBrand()

  const [ads, setAds] = useState<AdInspiration[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSearchMode, setIsSearchMode] = useState(false)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
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
    setIsSearchMode(false)

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

  const handleSearch = async () => {
    if (!searchInput.trim()) {
      // If search is empty, go back to curated ads
      setSearchQuery('')
      loadCuratedAds()
      return
    }

    setIsLoading(true)
    setError('')
    setIsSearchMode(true)
    setSearchQuery(searchInput)

    try {
      const params: any = {
        query: searchInput,
        limit: 50
      }

      if (selectedPlatform !== 'all') params.platform = selectedPlatform
      if (selectedNiche !== 'all') params.niche = selectedNiche

      const response = await searchAds(params)

      // Convert Foreplay ad format to our AdInspiration format
      const foreplayAds = response.data.map((ad: any) => ({
        id: ad.id || `fp-${Date.now()}-${Math.random()}`,
        foreplay_ad_id: ad.id,
        ad_data: {
          first_seen: ad.first_seen,
          last_seen: ad.last_seen,
          cta: ad.cta,
          landing_page: ad.landing_page,
          is_live: ad.is_live
        },
        thumbnail_url: ad.thumbnail || ad.image_url || '',
        video_url: ad.video,
        platform: ad.platform || 'Facebook',
        advertiser_name: ad.advertiser_name || ad.brand_name || 'Unknown',
        niche: ad.niche,
        ad_copy: ad.copy || ad.ad_copy,
        is_curated: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      setAds(foreplayAds)
    } catch (err: any) {
      setError(err.message || 'Failed to search ads')
      console.error('Failed to search Foreplay API:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setSearchQuery('')
    setIsSearchMode(false)
    loadCuratedAds()
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

  // For curated ads, we can filter locally
  // For Foreplay search results, ads are already filtered by the API
  const displayAds = ads

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
          {isSearchMode ? (
            <>
              <Sparkles size={14} style={{ display: 'inline', marginRight: '4px' }} />
              Showing results from Foreplay's 100M+ ad database
            </>
          ) : (
            'Browse curated ad creatives from top brands. Search to explore with Foreplay API.'
          )}
        </p>
      </div>

      <div className="ad-library-controls">
        <div className="search-section">
          <div className="search-bar-large">
            <Search size={20} />
            <input
              type="text"
              className="search-input-large"
              placeholder="Search Foreplay API (100M+ ads)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            {searchInput && (
              <button
                className="search-clear"
                onClick={handleClearSearch}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            className="search-button"
            onClick={handleSearch}
            disabled={isLoading}
          >
            {isSearchMode ? 'Search Again' : 'Search'}
          </button>

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

      {!isLoading && !error && displayAds.length > 0 && (
        <>
          {isSearchMode && (
            <div className="search-results-header">
              <p>Found {displayAds.length} ads from Foreplay API</p>
              <button className="button-secondary" onClick={handleClearSearch}>
                Back to Curated Ads
              </button>
            </div>
          )}
          <div className="ads-grid-masonry">
            {displayAds.map(ad => (
              <AdCard
                key={ad.id}
                ad={ad}
                onSave={handleSaveAd}
                showSaveButton={!!currentBrand}
              />
            ))}
          </div>
        </>
      )}

      {!isLoading && !error && displayAds.length === 0 && (
        <div className="ad-library-empty">
          <p>No ads found matching your criteria</p>
          <p className="empty-subtext">
            {isSearchMode
              ? 'Try a different search term or adjust your filters'
              : 'Click the search button to explore Foreplay\'s ad database'}
          </p>
        </div>
      )}
    </div>
  )
}

export default AdLibraryBrowser
