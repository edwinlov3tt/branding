import { useState } from 'react'
import { Image } from 'lucide-react'
import BrandAssetExtractor from './BrandAssetExtractor'
import type { BrandAsset } from '@/types'
import './BrandProfile.css'

const BrandProfile = () => {
  const [brandAssets, setBrandAssets] = useState<BrandAsset>({
    logos: [
      { type: 'Primary Logo', format: 'SVG', url: '#' },
      { type: 'Icon', format: 'PNG', url: '#' },
    ],
    colors: [
      { hex: '#dc2626', name: 'Brand Red' },
      { hex: '#1f2937', name: 'Dark Gray' },
      { hex: '#f3f4f6', name: 'Light Gray' },
    ],
    fonts: [
      { family: 'Inter', category: 'Sans-serif', weight: '400, 500, 600' },
    ],
  })

  const handleAssetsExtracted = (assets: BrandAsset) => {
    setBrandAssets(assets)
  }

  return (
    <div className="brand-profile">
      <div className="section">
        <h2 className="section-title">Extract Brand Assets</h2>
        <BrandAssetExtractor onAssetsExtracted={handleAssetsExtracted} />
      </div>

      <div className="section">
        <h2 className="section-title">Brand Assets</h2>

        <div className="asset-group">
          <h3 className="asset-title">Logos</h3>
          <div className="chips-container">
            {brandAssets.logos.map((logo, index) => (
              <div key={index} className="chip">
                <Image className="chip-icon" size={16} />
                {logo.type} ({logo.format})
              </div>
            ))}
          </div>
        </div>

        <div className="asset-group">
          <h3 className="asset-title">Colors</h3>
          <div className="chips-container">
            {brandAssets.colors.map((color, index) => (
              <div key={index} className="chip">
                <div
                  className="color-swatch"
                  style={{ backgroundColor: color.hex }}
                />
                {color.name} <span className="chip-muted">{color.hex}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="asset-group">
          <h3 className="asset-title">Fonts</h3>
          <div className="chips-container">
            {brandAssets.fonts.map((font, index) => (
              <div key={index} className="chip">
                <span style={{ fontFamily: font.family }}>
                  {font.family}
                </span>
                <span className="chip-muted">({font.weight})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">Brand Guidelines</h2>
        <div className="guidelines-grid">
          <div className="card">
            <h4>Voice & Tone</h4>
            <p className="card-text">Professional, innovative, and customer-focused</p>
          </div>
          <div className="card">
            <h4>Mission</h4>
            <p className="card-text">Empowering businesses with intelligent branding solutions</p>
          </div>
          <div className="card">
            <h4>Values</h4>
            <p className="card-text">Innovation, Quality, Customer Success</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BrandProfile