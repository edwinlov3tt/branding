import { useState } from 'react';
import type { BrandExtractResponse } from '@/types';
import ColorSwatch from '@/components/brand/ColorSwatch';
import LogoPreview from '@/components/brand/LogoPreview';
import ScreenshotPreview from '@/components/brand/ScreenshotPreview';
import ConfidenceBar from '@/components/brand/ConfidenceBar';
import '@/components/brand/ColorSwatch.css';
import '@/components/brand/LogoPreview.css';
import '@/components/brand/ConfidenceBar.css';
import './AssetReview.css';

interface AssetReviewProps {
  extractedData: BrandExtractResponse;
  onContinue: (removedAssets: RemovedAssets) => void;
  onBack: () => void;
}

export interface RemovedAssets {
  colors: string[];
  logos: string[];
  fonts: string[];
}

const AssetReview = ({ extractedData, onContinue, onBack }: AssetReviewProps) => {
  const [removedAssets, setRemovedAssets] = useState<RemovedAssets>({
    colors: [],
    logos: [],
    fonts: []
  });

  const handleColorRemove = (hex: string) => {
    setRemovedAssets(prev => ({
      ...prev,
      colors: [...prev.colors, hex]
    }));
  };

  const handleLogoRemove = (src: string) => {
    setRemovedAssets(prev => ({
      ...prev,
      logos: [...prev.logos, src]
    }));
  };

  const getVisibleColors = () => {
    return extractedData.brand.colors.palette.filter(
      color => !removedAssets.colors.includes(color.hex)
    );
  };

  const getVisibleLogos = () => {
    const allLogos = [
      extractedData.brand.logos.primary,
      ...(extractedData.brand.logos.alternates || [])
    ];
    return allLogos.filter(logo => !removedAssets.logos.includes(logo.src));
  };

  const handleContinue = () => {
    onContinue(removedAssets);
  };

  return (
    <div className="asset-review">
      <div className="step-header">
        <h2 className="step-title">Review Extracted Assets</h2>
        <p className="step-description">
          Review the automatically extracted brand assets. Remove any items that don't match your brand.
        </p>
      </div>

      {/* Summary Section */}
      {extractedData.summary && (
        <div className="review-section">
          <h3 className="review-section-title">Brand Summary</h3>
          <div className="brand-summary-grid">
            <div className="summary-item">
              <div
                className="summary-color-swatch"
                style={{ backgroundColor: extractedData.summary.primaryColor.hex }}
              />
              <div className="summary-info">
                <span className="summary-label">Primary Color</span>
                <span className="summary-value">{extractedData.summary.primaryColor.hex}</span>
                <ConfidenceBar
                  confidence={extractedData.summary.primaryColor.confidence}
                  size="small"
                />
              </div>
            </div>

            <div className="summary-item">
              <div className="summary-font">Aa</div>
              <div className="summary-info">
                <span className="summary-label">Display Font</span>
                <span className="summary-value">{extractedData.summary.displayFont.family}</span>
                <ConfidenceBar
                  confidence={extractedData.summary.displayFont.confidence}
                  size="small"
                />
              </div>
            </div>

            <div className="summary-item">
              <div className="summary-font">Aa</div>
              <div className="summary-info">
                <span className="summary-label">Body Font</span>
                <span className="summary-value">{extractedData.summary.bodyFont.family}</span>
                <ConfidenceBar
                  confidence={extractedData.summary.bodyFont.confidence}
                  size="small"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Section */}
      {extractedData.brand.screenshot && (
        <div className="review-section">
          <h3 className="review-section-title">Website Screenshot</h3>
          <ScreenshotPreview
            screenshot={extractedData.brand.screenshot}
            url={extractedData.brand.url}
          />
        </div>
      )}

      {/* Logos Section */}
      {extractedData.brand.logos && extractedData.brand.logos.primary && getVisibleLogos().length > 0 && (
        <div className="review-section">
          <h3 className="review-section-title">
            Logos ({getVisibleLogos().length})
          </h3>
          <div className="logos-review-grid">
            {getVisibleLogos().map((logo, index) => (
              <LogoPreview
                key={logo.src}
                logo={logo}
                logoColors={extractedData.brand.logos.logoColors || []}
                isPrimary={index === 0}
                onRemove={handleLogoRemove}
                size={index === 0 ? 'large' : 'medium'}
              />
            ))}
          </div>
        </div>
      )}

      {/* Colors Section */}
      {extractedData.brand.colors && getVisibleColors().length > 0 && (
        <div className="review-section">
          <h3 className="review-section-title">
            Color Palette ({getVisibleColors().length})
          </h3>
          <div className="colors-review-grid">
            {getVisibleColors().map(color => (
              <ColorSwatch
                key={color.hex}
                color={color}
                onRemove={handleColorRemove}
                onRoleChange={() => {}} // Not needed in onboarding
                size="medium"
                showControls={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Typography Info */}
      {extractedData.brand.typography && (
        <div className="review-section">
          <h3 className="review-section-title">Typography</h3>
          <div className="typography-info">
            <div className="typography-item">
              <span className="typography-label">Display Font:</span>
              <span className="typography-value">{extractedData.brand.typography.display.family}</span>
            </div>
            <div className="typography-item">
              <span className="typography-label">Body Font:</span>
              <span className="typography-value">{extractedData.brand.typography.body.family}</span>
            </div>
          </div>
        </div>
      )}

      <div className="step-actions">
        <button className="button button-secondary" onClick={onBack}>
          Back
        </button>
        <button className="button button-primary" onClick={handleContinue}>
          Continue
        </button>
      </div>
    </div>
  );
};

export default AssetReview;
