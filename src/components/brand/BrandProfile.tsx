import { useState, useEffect } from 'react'
import { Save, Undo2, Download, AlertCircle, WifiOff } from 'lucide-react'
import BrandAssetExtractor from './BrandAssetExtractor'
import ColorSwatch from './ColorSwatch'
import TypographyPreview, { HeadingPreview } from './TypographyPreview'
import LogoPreview, { LogoGrid } from './LogoPreview'
import ConfidenceBar from './ConfidenceBar'
import ScreenshotPreview from './ScreenshotPreview'
import ImageAssets from './ImageAssets'
import type {
  BrandExtractResponse,
  BrandData,
  EditedBrandData
} from '@/types'
import { saveEditedBrandData, loadEditedBrandData, checkExternalApiHealth } from '@/services/api/brandService'
import { extractBrandDataEnhanced, type SSEEvent } from '@/services/api/enhancedBrandService'
import { loadGoogleFonts } from '@/utils/fontUtils'
import './BrandProfile.css'
import './ConfidenceBar.css'
import './ColorSwatch.css'
import './TypographyPreview.css'
import './LogoPreview.css'

const BrandProfile = () => {
  const [brandData, setBrandData] = useState<BrandData | null>(null)
  const [extractResponse, setExtractResponse] = useState<BrandExtractResponse | null>(null)
  const [editedData, setEditedData] = useState<EditedBrandData>({
    colors: {},
    fonts: {},
    logo: { alternatesKept: [] },
    removed: { colors: [], fonts: [], logos: [] }
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')
  const [extractionProgress, setExtractionProgress] = useState(0)
  const [extractionMessage, setExtractionMessage] = useState('')

  useEffect(() => {
    // Check API status on mount
    checkApiStatus()

    loadEditedBrandData().then(saved => {
      if (saved) {
        setEditedData(saved)
      }
    })
  }, [])

  const checkApiStatus = async () => {
    try {
      // Check the external API (gtm.edwinlovett.com) instead of localhost
      const isHealthy = await checkExternalApiHealth();
      if (isHealthy) {
        setApiStatus('connected')
      } else {
        setApiStatus('disconnected')
      }
    } catch {
      setApiStatus('disconnected')
    }
  }

  useEffect(() => {
    if (brandData?.typography.fontLinks) {
      loadGoogleFonts(brandData.typography.fontLinks).catch(console.error)
    }
  }, [brandData])

  const handleBrandExtracted = async (url: string) => {
    setIsLoading(true)
    setError('')
    setExtractionProgress(0)
    setExtractionMessage('Starting enhanced brand analysis...')

    try {
      const response = await extractBrandDataEnhanced(
        url,
        {
          maxPages: 10,
          includeScreenshots: true,
          includeScraping: false,
          includeImages: false
        },
        (event: SSEEvent) => {
          // Update progress based on SSE events
          if (event.data.progress !== undefined) {
            setExtractionProgress(event.data.progress)
          }
          if (event.data.message) {
            setExtractionMessage(event.data.message)
          }

          // Log interesting events
          console.log(`[${event.event}]`, event.data)
        }
      )

      setExtractResponse(response)
      setBrandData(response.brand)
      setExtractionProgress(100)
      setExtractionMessage('Analysis complete!')
    } catch (err: any) {
      setError(err.message || 'Failed to extract brand data. Please try again.')
      console.error('Brand extraction error:', err)
    } finally {
      setTimeout(() => {
        setIsLoading(false)
        setExtractionProgress(0)
        setExtractionMessage('')
      }, 1000) // Keep progress visible for 1 second after completion
    }
  }


  // Color management
  const handleColorRemove = (hex: string) => {
    setEditedData(prev => ({
      ...prev,
      removed: {
        ...prev.removed,
        colors: [...prev.removed.colors, hex]
      }
    }))
    setHasUnsavedChanges(true)
  }

  const handleColorRoleChange = (hex: string, role: string) => {
    if (!brandData) return

    const color = brandData.colors.palette.find(c => c.hex === hex)
    if (!color) return

    const updatedColor = { ...color, role }
    setEditedData(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [role as keyof typeof prev.colors]: updatedColor
      }
    }))
    setHasUnsavedChanges(true)
  }

  // Font management
  const handleFontRemove = (family: string) => {
    setEditedData(prev => ({
      ...prev,
      removed: {
        ...prev.removed,
        fonts: [...prev.removed.fonts, family]
      }
    }))
    setHasUnsavedChanges(true)
  }

  const handleHeadingRemove = (level: string) => {
    setEditedData(prev => ({
      ...prev,
      removed: {
        ...prev.removed,
        fonts: [...prev.removed.fonts, level]
      }
    }))
    setHasUnsavedChanges(true)
  }

  // Logo management
  const handleLogoRemove = (src: string) => {
    setEditedData(prev => ({
      ...prev,
      removed: {
        ...prev.removed,
        logos: [...prev.removed.logos, src]
      }
    }))
    setHasUnsavedChanges(true)
  }

  // Save and reset functions
  const handleSaveChanges = async () => {
    try {
      await saveEditedBrandData(editedData)
      setHasUnsavedChanges(false)
    } catch (err) {
      setError('Failed to save changes')
      console.error('Save error:', err)
    }
  }

  const handleResetChanges = () => {
    setEditedData({
      colors: {},
      fonts: {},
      logo: { alternatesKept: [] },
      removed: { colors: [], fonts: [], logos: [] }
    })
    setHasUnsavedChanges(false)
  }

  const handleExportBrand = () => {
    if (!brandData || !extractResponse) return

    const exportData = {
      extracted: extractResponse,
      edited: editedData,
      timestamp: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `brand-profile-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Filter functions
  const getVisibleColors = () => {
    if (!brandData) return []
    return brandData.colors.palette.filter(color =>
      !editedData.removed.colors.includes(color.hex)
    )
  }

  const getVisibleLogos = () => {
    if (!brandData) return []
    const allLogos = [brandData.logos.primary, ...(brandData.logos.alternates || [])]
    return allLogos.filter(logo =>
      !editedData.removed.logos.includes(logo.src)
    )
  }

  return (
    <div className="brand-profile">
      {/* API Status Banner - Only show when disconnected */}
      {apiStatus === 'disconnected' && (
        <div className="api-status-banner disconnected">
          <WifiOff size={18} />
          <span>Brand extraction API is currently offline. Please try again later.</span>
          <button
            className="retry-button"
            onClick={() => {
              setApiStatus('checking')
              checkApiStatus()
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Extraction Section */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Extract Brand Assets</h2>
          <div className="header-indicators">
            {hasUnsavedChanges && (
              <div className="unsaved-indicator">
                <span>Unsaved changes</span>
              </div>
            )}
            {apiStatus === 'disconnected' && (
              <div className={`api-indicator ${apiStatus}`}>
                <WifiOff size={16} />
              </div>
            )}
          </div>
        </div>
        <div className="section-content">
          <BrandAssetExtractor
            onBrandExtracted={handleBrandExtracted}
          />
        </div>
      </div>

      {/* Summary Section */}
      {extractResponse?.summary && extractResponse.summary.primaryColor && (
        <div className="section">
          <h2 className="section-title">Brand Summary</h2>
          <div className="section-content">
            <div className="brand-summary">
              <div className="summary-item">
                <div
                  className="summary-color-swatch"
                  style={{ backgroundColor: extractResponse.summary.primaryColor.hex }}
              />
              <div className="summary-info">
                <span className="summary-label">Primary Color</span>
                <span className="summary-value">{extractResponse.summary.primaryColor.hex}</span>
                <ConfidenceBar
                  confidence={extractResponse.summary.primaryColor.confidence}
                  size="small"
                />
              </div>
            </div>

            <div className="summary-item">
              <div className="summary-font">Aa</div>
              <div className="summary-info">
                <span className="summary-label">Display Font</span>
                <span className="summary-value">{extractResponse.summary.displayFont.family}</span>
                <ConfidenceBar
                  confidence={extractResponse.summary.displayFont.confidence}
                  size="small"
                />
              </div>
            </div>

            <div className="summary-item">
              <div className="summary-font">Aa</div>
              <div className="summary-info">
                <span className="summary-label">Body Font</span>
                <span className="summary-value">{extractResponse.summary.bodyFont.family}</span>
                <ConfidenceBar
                  confidence={extractResponse.summary.bodyFont.confidence}
                  size="small"
                />
              </div>
            </div>

            {brandData?.logos.primary && (
              <div className="summary-item">
                <img
                  src={brandData.logos.primary.src}
                  alt="Logo"
                  className="summary-logo"
                />
                <div className="summary-info">
                  <span className="summary-label">Primary Logo</span>
                  <span className="summary-value">Score: {brandData.logos.primary.score}</span>
                </div>
              </div>
            )}

            <div className="summary-confidence">
              <span className="summary-label">Overall Confidence</span>
              <ConfidenceBar
                confidence={extractResponse.summary.confidence}
                size="large"
              />
            </div>
          </div>
          </div>
        </div>
      )}

      {/* Screenshot Section */}
      {brandData?.screenshot && (brandData.screenshot.url || brandData.screenshot.data) && (
        <div className="section">
          <h2 className="section-title">Website Screenshot</h2>
          <div className="section-content">
            <ScreenshotPreview
              screenshot={brandData.screenshot}
              url={brandData.url}
            />
          </div>
        </div>
      )}

      {/* Logos Section */}
      {brandData && brandData.logos && brandData.logos.primary && (
        <div className="section">
          <h2 className="section-title">Logos</h2>

          <div className="logos-section">
            <h3 className="subsection-title">Primary Logo</h3>
            <LogoPreview
              logo={brandData.logos.primary}
              logoColors={brandData.logos.logoColors || []}
              isPrimary={true}
              onRemove={handleLogoRemove}
              size="large"
            />
          </div>

          {brandData.logos.alternates && brandData.logos.alternates.length > 0 && (
            <div className="logos-section">
              <h3 className="subsection-title">Alternative Logos</h3>
              <LogoGrid
                logos={getVisibleLogos().slice(1)}
                logoColors={brandData.logos.logoColors || []}
                onRemove={handleLogoRemove}
              />
            </div>
          )}

          {brandData.logos.favicons && brandData.logos.favicons.length > 0 && (
            <div className="logos-section">
              <h3 className="subsection-title">Favicons</h3>
              <div className="favicons-grid">
                {brandData.logos.favicons
                  .filter(favicon => !editedData.removed.logos.includes(favicon.src))
                  .map((favicon, index) => (
                    <LogoPreview
                      key={`favicon-${index}`}
                      logo={favicon}
                      logoColors={brandData.logos.logoColors}
                      onRemove={handleLogoRemove}
                      size="small"
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Colors Section */}
      {brandData && (
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Colors</h2>
            <div className="section-actions">
              {hasUnsavedChanges && (
                <>
                  <button className="button button-secondary" onClick={handleResetChanges}>
                    <Undo2 size={16} />
                    Reset
                  </button>
                  <button className="button button-primary" onClick={handleSaveChanges}>
                    <Save size={16} />
                    Save Changes
                  </button>
                </>
              )}
              <button className="button button-secondary" onClick={handleExportBrand}>
                <Download size={16} />
                Export
              </button>
            </div>
          </div>

          <div className="colors-grid">
            {getVisibleColors().map((color) => (
              <ColorSwatch
                key={color.hex}
                color={color}
                onRemove={handleColorRemove}
                onRoleChange={handleColorRoleChange}
                size="medium"
              />
            ))}
          </div>

          {brandData.colors.analysis?.meta && (
            <div className="analysis-footnote">
              <span>
                Analysis: {brandData.colors.analysis.meta.clustered} colors clustered,
                {brandData.colors.analysis.meta.filtered} filtered from third-party content
              </span>
            </div>
          )}
        </div>
      )}

      {/* Typography Section */}
      {brandData && (
        <div className="section">
          <h2 className="section-title">Typography</h2>

          <div className="typography-section">
            <h3 className="subsection-title">Display Font</h3>
            <TypographyPreview
              fontData={brandData.typography.display}
              type="display"
              fontLinks={brandData.typography.fontLinks}
              onRemove={handleFontRemove}
            />
          </div>

          <div className="typography-section">
            <h3 className="subsection-title">Body Font</h3>
            <TypographyPreview
              fontData={brandData.typography.body}
              type="body"
              fontLinks={brandData.typography.fontLinks}
              onRemove={handleFontRemove}
            />
          </div>

          {Object.keys(brandData.typography.headings).length > 0 && (
            <div className="typography-section">
              <h3 className="subsection-title">Headings</h3>
              <div className="headings-table">
                {Object.entries(brandData.typography.headings)
                  .filter(([level]) => !editedData.removed.fonts.includes(level))
                  .map(([level, heading]) => (
                    <HeadingPreview
                      key={level}
                      heading={heading}
                      level={level}
                      fontLinks={brandData.typography.fontLinks}
                      onRemove={handleHeadingRemove}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Images & Assets Section */}
      {brandData && (
        <div className="section">
          <h2 className="section-title">Images & Assets</h2>
          <div className="section-content">
            <ImageAssets url={brandData.url} />
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="error-message">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-container">
            <div className="loading"></div>
            <p className="loading-text">{extractionMessage || 'Extracting brand data...'}</p>
            {extractionProgress > 0 && (
              <div className="progress-container">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${extractionProgress}%` }}
                  />
                </div>
                <span className="progress-text">{extractionProgress}%</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default BrandProfile