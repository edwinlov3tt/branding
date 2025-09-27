import { useState } from 'react'
import type { BrandAsset } from '@/types'
import { extractBrandAssets } from '@/services/api/brandService'
import './BrandAssetExtractor.css'

interface Props {
  onAssetsExtracted: (assets: BrandAsset) => void
}

const BrandAssetExtractor = ({ onAssetsExtracted }: Props) => {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleExtract = async () => {
    if (!url) {
      setError('Please enter a URL')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const assets = await extractBrandAssets(url)
      onAssetsExtracted(assets)
    } catch (err) {
      setError('Failed to extract brand assets. Please try again.')
      console.error('Extraction error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="extractor">
      <div className="extractor-input-group">
        <input
          type="url"
          className="input"
          placeholder="Enter website URL (e.g., https://example.com)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isLoading}
        />
        <button
          className="button button-primary"
          onClick={handleExtract}
          disabled={isLoading}
        >
          {isLoading ? 'Extracting...' : 'Extract Assets'}
        </button>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {isLoading && (
        <div className="loading-container">
          <div className="loading"></div>
          <p className="loading-text">Analyzing website and extracting brand assets...</p>
        </div>
      )}
    </div>
  )
}

export default BrandAssetExtractor