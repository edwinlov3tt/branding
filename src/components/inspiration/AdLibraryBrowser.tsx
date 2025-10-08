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
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [shownAdIds, setShownAdIds] = useState<Set<string>>(new Set())

  // Filter state
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

  // Shuffle function for randomizing results
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // Deduplicate by brand - limit to 2 ads per brand in initial results
  const deduplicateByBrand = (ads: AdInspiration[]): AdInspiration[] => {
    const brandCount: Record<string, number> = {}
    return ads.filter(ad => {
      const brand = ad.advertiser_name
      brandCount[brand] = (brandCount[brand] || 0) + 1
      return brandCount[brand] <= 2 // Max 2 ads per brand initially
    })
  }

  const loadCuratedAds = async () => {
    setIsLoading(true)
    setError('')
    setIsSearchMode(false)
    setCursor(null)
    setHasMore(false)
    setShownAdIds(new Set())

    try {
      const params: any = {}
      if (selectedPlatform !== 'all') params.platform = selectedPlatform
      if (selectedNiche !== 'all') params.niche = selectedNiche

      const curatedAds = await getCuratedAds(params)

      // Shuffle curated ads for variety
      const shuffled = shuffleArray(curatedAds)
      setAds(shuffled)
    } catch (err: any) {
      setError(err.message || 'Failed to load ad inspirations')
      console.error('Failed to load curated ads:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async (loadMore = false) => {
    if (!searchInput.trim()) {
      // If search is empty, go back to curated ads
      loadCuratedAds()
      return
    }

    setIsLoading(true)
    setError('')

    if (!loadMore) {
      setIsSearchMode(true)
      setCursor(null)
      setShownAdIds(new Set())
    }

    try {
      // Step 1: Check database cache first (only on initial search)
      if (!loadMore) {
        console.log('🔍 Searching database cache first...')
        const cacheParams: any = { search: searchInput, limit: 50 }
        if (selectedPlatform !== 'all') cacheParams.platform = selectedPlatform
        if (selectedNiche !== 'all') cacheParams.niche = selectedNiche

        const cacheResponse = await getCuratedAds(cacheParams)
        const cachedAds = cacheResponse

        console.log(`Found ${cachedAds.length} ads in cache`)

        // Step 2: If we have enough cached results (10+), use those
        if (cachedAds.length >= 10) {
          console.log('✅ Using cached results')
          // Shuffle and deduplicate
          const shuffled = shuffleArray(cachedAds)
          const deduplicated = deduplicateByBrand(shuffled)
          setAds(deduplicated)
          setHasMore(false)
          setIsLoading(false)
          return
        }
      }

      // Step 3: Hit Foreplay API (initial or load more)
      console.log(loadMore ? '📡 Loading more from Foreplay API...' : '📡 Fetching from Foreplay API...')
      const params: any = {
        query: searchInput,
        limit: 50
      }

      if (selectedPlatform !== 'all') params.platform = selectedPlatform
      if (selectedNiche !== 'all') params.niche = selectedNiche
      if (loadMore && cursor) params.cursor = cursor

      const response = await searchAds(params)

      // Convert Foreplay ad format to our AdInspiration format
      const foreplayAds = response.data.map((ad: any) => ({
        id: ad.id || `fp-${Date.now()}-${Math.random()}`,
        foreplay_ad_id: ad.id,
        ad_data: {
          first_seen: ad.started_running ? new Date(ad.started_running).toISOString() : undefined,
          last_seen: undefined,
          cta: ad.cta_type,
          landing_page: ad.link_url,
          is_live: ad.live
        },
        thumbnail_url: ad.image || ad.thumbnail || ad.avatar || '',
        video_url: ad.video || null,
        platform: Array.isArray(ad.publisher_platform)
          ? ad.publisher_platform[0]?.charAt(0).toUpperCase() + ad.publisher_platform[0]?.slice(1) || 'Facebook'
          : 'Facebook',
        advertiser_name: ad.name || 'Unknown',
        niche: Array.isArray(ad.niches) ? ad.niches[0] : ad.niche || null,
        ad_copy: ad.description || ad.copy || '',
        is_curated: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      // Filter out already shown ads
      const newAds = foreplayAds.filter((ad: AdInspiration) => !shownAdIds.has(ad.id))

      // Shuffle new ads for variety
      const shuffled = shuffleArray(newAds)

      // Update shown IDs
      const newShownIds = new Set(shownAdIds)
      shuffled.forEach(ad => newShownIds.add(ad.id))
      setShownAdIds(newShownIds)

      // Update cursor for next page
      setCursor(response.metadata?.cursor || null)
      setHasMore(!!response.metadata?.cursor)

      // Append or replace ads
      setAds(loadMore ? [...ads, ...shuffled] : shuffled)
    } catch (err: any) {
      setError(err.message || 'Failed to search ads')
      console.error('Failed to search ads:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoadMore = () => {
    handleSearch(true)
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setIsSearchMode(false)
    loadCuratedAds()
  }

  const handleSaveAd = async (ad: AdInspiration) => {
    if (!currentBrand) {
      console.error('No brand selected')
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
    } catch (err: any) {
      console.error('Failed to save ad:', err.message)
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
            onClick={() => handleSearch()}
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

          {/* See More Button */}
          {isSearchMode && hasMore && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <button
                className="search-button"
                onClick={handleLoadMore}
                disabled={isLoading}
                style={{ minWidth: '200px' }}
              >
                {isLoading ? 'Loading...' : 'See More Ads'}
              </button>
            </div>
          )}
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
