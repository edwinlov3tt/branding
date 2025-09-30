import { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import type { FontData, HeadingData, FontLink } from '@/types';
import { loadFont, generateFontStack, previewText, getFontDisplayName, formatFontWeight } from '@/utils/fontUtils';
import ConfidenceBar from './ConfidenceBar';
import './TypographyPreview.css';

interface TypographyPreviewProps {
  fontData: FontData;
  type: 'display' | 'body';
  fontLinks?: Record<string, FontLink>;
  onRemove?: (family: string) => void;
  showControls?: boolean;
}

const TypographyPreview = ({
  fontData,
  type,
  fontLinks,
  onRemove,
  showControls = true
}: TypographyPreviewProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const fontLink = fontLinks?.[fontData.family];
  const fontStack = generateFontStack(fontData.family);

  useEffect(() => {
    if (fontLink?.url) {
      loadFont(fontData.family, fontLink.url)
        .then(() => setIsLoaded(true))
        .catch(() => {
          setLoadError(true);
          setIsLoaded(true);
        });
    } else {
      setIsLoaded(true);
    }
  }, [fontData.family, fontLink?.url]);

  const previewStyle = {
    fontFamily: fontStack,
    fontSize: type === 'display' ? `${Math.min(fontData.avgSize, 48)}px` : `${fontData.avgSize}px`,
    fontWeight: fontData.weights[0] || '400',
    lineHeight: type === 'display' ? 1.1 : 1.5,
  };

  return (
    <div className={`typography-preview ${type}`}>
      <div className="typography-header">
        <div className="font-info">
          <h4 className="font-name">{getFontDisplayName(fontData)}</h4>
          <div className="font-meta">
            <span className="font-source">{fontData.source}</span>
            <span className="font-coverage">{fontData.coverage}</span>
            <ConfidenceBar
              confidence={fontData.confidence}
              size="small"
              showPercentage={false}
            />
          </div>
        </div>

        <div className="typography-controls">
          {fontLink?.url && (
            <a
              href={fontLink.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-link"
              title="Open font source"
            >
              <ExternalLink size={14} />
            </a>
          )}
          {showControls && onRemove && (
            <button
              className="remove-font-button"
              onClick={() => onRemove(fontData.family)}
              title={`Remove ${fontData.family}`}
              aria-label={`Remove font ${fontData.family}`}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="font-weights">
        {fontData.weights.map((weight) => (
          <span key={weight} className="weight-badge">
            {formatFontWeight(weight)}
          </span>
        ))}
      </div>

      <div className="preview-container">
        {!isLoaded && (
          <div className="loading-indicator">Loading font...</div>
        )}
        {loadError && (
          <div className="error-indicator">
            Font failed to load, showing with fallback
          </div>
        )}
        <div
          className={`preview-text ${type}-preview ${!isLoaded ? 'loading' : ''}`}
          style={previewStyle}
        >
          {previewText(type)}
        </div>
      </div>

      {fontData.examples && fontData.examples.length > 0 && (
        <div className="examples-section">
          <span className="examples-label">Examples from site:</span>
          <div className="examples-list">
            {fontData.examples.slice(0, 2).map((example, index) => (
              <div
                key={index}
                className="example-text"
                style={previewStyle}
              >
                "{example}"
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface HeadingPreviewProps {
  heading: HeadingData;
  level: string;
  fontLinks?: Record<string, FontLink>;
  onRemove?: (level: string) => void;
  showControls?: boolean;
}

export const HeadingPreview = ({
  heading,
  level,
  fontLinks,
  onRemove,
  showControls = true
}: HeadingPreviewProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  const fontLink = fontLinks?.[heading.family];
  const fontStack = generateFontStack(heading.family);

  useEffect(() => {
    if (fontLink?.url) {
      loadFont(heading.family, fontLink.url)
        .then(() => setIsLoaded(true))
        .catch(() => setIsLoaded(true));
    } else {
      setIsLoaded(true);
    }
  }, [heading.family, fontLink?.url]);

  const previewStyle = {
    fontFamily: fontStack,
    fontSize: `${Math.min(heading.size, 32)}px`,
    fontWeight: heading.weight,
    lineHeight: 1.2,
  };

  return (
    <div className="heading-preview">
      <div className="heading-info">
        <span className="heading-level">{level.toUpperCase()}</span>
        <span className="heading-family">{heading.family}</span>
        <span className="heading-weight">{formatFontWeight(heading.weight)}</span>
        <span className="heading-size">{heading.size}px</span>
        {heading.confidence && (
          <ConfidenceBar
            confidence={heading.confidence}
            size="small"
            showPercentage={false}
          />
        )}
        {showControls && onRemove && (
          <button
            className="remove-heading-button"
            onClick={() => onRemove(level)}
            title={`Remove ${level}`}
            aria-label={`Remove heading level ${level}`}
          >
            <X size={12} />
          </button>
        )}
      </div>

      <div
        className={`heading-preview-text ${!isLoaded ? 'loading' : ''}`}
        style={previewStyle}
      >
        {heading.examples?.[0] || previewText('heading')}
      </div>
    </div>
  );
};

export default TypographyPreview;