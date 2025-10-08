import { useState } from 'react';
import { X, Download, ExternalLink, ImageOff } from 'lucide-react';
import type { PageImage } from '@/types';
import './ImageCard.css';

interface ImageCardProps {
  image: PageImage;
  onRemove: (imageUrl: string) => void;
}

const ImageCard = ({ image, onRemove }: ImageCardProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

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
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = image.url.split('/').pop() || `image-${Date.now()}.jpg`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  const openInNewTab = () => {
    window.open(image.url, '_blank');
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="image-card">
      <div className="image-card-header">
        <div className="image-info">
          <span className="image-score">Score: {image.finalScore}</span>
          {image.width && image.height && (
            <span className="image-dimensions">
              {image.width} × {image.height}
            </span>
          )}
          <span className="image-size">{formatFileSize(image.size)}</span>
        </div>
        <div className="image-controls">
          <button
            className="control-button download-button"
            onClick={handleDownload}
            title="Download image"
            aria-label="Download image"
          >
            <Download size={14} />
          </button>
          <button
            className="control-button external-button"
            onClick={openInNewTab}
            title="Open in new tab"
            aria-label="Open image in new tab"
          >
            <ExternalLink size={14} />
          </button>
          <button
            className="control-button remove-button"
            onClick={() => onRemove(image.url)}
            title="Remove image"
            aria-label="Remove image"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="image-container">
        {!imageLoaded && !imageError && (
          <div className="image-loading">
            <div className="loading-spinner" />
            <span>Loading...</span>
          </div>
        )}

        {imageError && (
          <div className="image-error">
            <ImageOff size={48} />
            <span>Failed to load image</span>
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

        {image.url && (
          <img
            src={image.url}
            alt={image.alt || 'Brand image'}
            className={`image-preview ${imageLoaded ? 'loaded' : ''}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain'
            }}
          />
        )}
      </div>

      {image.alt && (
        <div className="image-footer">
          <span className="image-alt" title={image.alt}>
            {image.alt}
          </span>
        </div>
      )}
    </div>
  );
};

export default ImageCard;