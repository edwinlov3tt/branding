import { useState } from 'react';
import { X, Download, ExternalLink, Palette } from 'lucide-react';
import type { LogoItem, LogoColor } from '@/types';
import { getBestContrastColor, getOptimalLogoBackgrounds } from '@/utils/colorUtils';
import './LogoPreview.css';

interface LogoPreviewProps {
  logo: LogoItem;
  logoColors?: LogoColor[];
  isPrimary?: boolean;
  onRemove?: (src: string) => void;
  showControls?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const LogoPreview = ({
  logo,
  logoColors = [],
  isPrimary = false,
  onRemove,
  showControls = true,
  size = 'medium'
}: LogoPreviewProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [backgroundMode, setBackgroundMode] = useState<'auto' | 'light' | 'dark' | 'neutral'>('auto');

  // Return early if logo is null or invalid
  if (!logo || !logo.src) {
    return null;
  }

  const backgrounds = getOptimalLogoBackgrounds(logoColors.map(c => c.hex));
  const backgroundHex = backgrounds[backgroundMode];
  const contrastColor = getBestContrastColor(backgroundHex);

  const cycleBackground = () => {
    const modes: Array<'auto' | 'light' | 'dark' | 'neutral'> = ['auto', 'light', 'dark', 'neutral'];
    const currentIndex = modes.indexOf(backgroundMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setBackgroundMode(modes[nextIndex]);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(logo.src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logo-${Date.now()}.${blob.type.split('/')[1] || 'png'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download logo:', error);
    }
  };

  const openInNewTab = () => {
    window.open(logo.src, '_blank');
  };

  return (
    <div className={`logo-preview ${size} ${isPrimary ? 'primary' : ''}`}>
      <div className="logo-header">
        <div className="logo-info">
          {isPrimary && <span className="primary-badge">Primary</span>}
          <span className="logo-score">Score: {logo.score}</span>
          <span className="logo-dimensions">
            {logo.width} × {logo.height}
          </span>
        </div>

        {showControls && (
          <div className="logo-controls">
            <button
              className="control-button background-button"
              onClick={cycleBackground}
              title={`Background: ${backgroundMode}`}
              aria-label="Toggle background color"
            >
              <Palette size={14} />
            </button>
            <button
              className="control-button download-button"
              onClick={handleDownload}
              title="Download logo"
              aria-label="Download logo"
            >
              <Download size={14} />
            </button>
            <button
              className="control-button external-button"
              onClick={openInNewTab}
              title="Open in new tab"
              aria-label="Open logo in new tab"
            >
              <ExternalLink size={14} />
            </button>
            {onRemove && !isPrimary && (
              <button
                className="control-button remove-button"
                onClick={() => onRemove(logo.src)}
                title="Remove logo"
                aria-label="Remove logo"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      <div
        className="logo-container"
        style={{
          backgroundColor: backgroundHex,
          color: contrastColor
        }}
      >
        {!imageLoaded && !imageError && (
          <div className="logo-loading">
            <div className="loading-spinner" />
            <span>Loading...</span>
          </div>
        )}

        {imageError && (
          <div className="logo-error">
            <span>Failed to load</span>
            <button
              className="retry-button"
              onClick={() => {
                setImageError(false);
                setImageLoaded(false);
              }}
            >
              Retry
            </button>
          </div>
        )}

        <img
          src={logo.src}
          alt={isPrimary ? 'Primary logo' : 'Logo'}
          className={`logo-image ${imageLoaded ? 'loaded' : ''}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain'
          }}
        />
      </div>

      {logoColors.length > 0 && (
        <div className="logo-colors">
          <span className="colors-label">Colors:</span>
          <div className="color-chips">
            {logoColors.slice(0, 5).map((color, index) => (
              <div
                key={index}
                className="color-chip"
                style={{ backgroundColor: color.hex }}
                title={`${color.hex} (used ${color.frequency}×)`}
              />
            ))}
            {logoColors.length > 5 && (
              <span className="more-colors">+{logoColors.length - 5}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface LogoGridProps {
  logos: LogoItem[];
  logoColors?: LogoColor[];
  onRemove?: (src: string) => void;
  showControls?: boolean;
  maxItems?: number;
}

export const LogoGrid = ({
  logos,
  logoColors = [],
  onRemove,
  showControls = true,
  maxItems = 6
}: LogoGridProps) => {
  const displayLogos = logos.slice(0, maxItems);
  const hasMore = logos.length > maxItems;

  return (
    <div className="logo-grid">
      {displayLogos.map((logo, index) => (
        <LogoPreview
          key={`${logo.src}-${index}`}
          logo={logo}
          logoColors={logoColors}
          isPrimary={index === 0}
          onRemove={onRemove}
          showControls={showControls}
          size="small"
        />
      ))}
      {hasMore && (
        <div className="logo-more">
          <span>+{logos.length - maxItems} more</span>
        </div>
      )}
    </div>
  );
};

export default LogoPreview;