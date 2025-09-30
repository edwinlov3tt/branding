import { useState, useMemo } from 'react';
import { Maximize2, Minimize2, Download } from 'lucide-react';
import type { ScreenshotData } from '@/types';
import './ScreenshotPreview.css';

interface ScreenshotPreviewProps {
  screenshot: ScreenshotData;
  url: string;
}

const ScreenshotPreview = ({ screenshot, url }: ScreenshotPreviewProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Process screenshot data to get the display URL
  const screenshotDisplayUrl = useMemo(() => {
    console.log('Screenshot data:', screenshot);

    if (!screenshot) {
      console.warn('No screenshot data provided');
      return '';
    }

    // If screenshot has a URL, use it directly
    if (screenshot.url) {
      return screenshot.url;
    }

    // Fallback to base64 data if available
    if (screenshot.data) {
      // If data already has data URL prefix, use as is
      if (screenshot.data.startsWith('data:image/')) {
        return screenshot.data;
      }
      // Otherwise, add the data URL prefix
      return `data:image/png;base64,${screenshot.data}`;
    }

    console.warn('No valid screenshot URL or data found');
    return '';
  }, [screenshot]);

  const handleDownload = async () => {
    try {
      if (!screenshotDisplayUrl) {
        throw new Error('No screenshot available to download');
      }

      // If it's a URL, fetch and download
      if (screenshot.url) {
        const response = await fetch(screenshot.url);
        if (!response.ok) {
          throw new Error('Failed to fetch screenshot');
        }

        const blob = await response.blob();
        const url_obj = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url_obj;
        a.download = `screenshot-${new URL(url).hostname}-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url_obj);
        return;
      }

      // Fallback for base64 data
      if (screenshot.data) {
        const base64Data = screenshot.data.includes(',')
          ? screenshot.data.split(',')[1]
          : screenshot.data;

        if (!base64Data) {
          throw new Error('Invalid screenshot data');
        }

        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });

        const url_obj = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url_obj;
        a.download = `screenshot-${new URL(url).hostname}-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url_obj);
      }
    } catch (error) {
      console.error('Failed to download screenshot:', error);
      alert('Failed to download screenshot. Please try again.');
    }
  };

  return (
    <div className={`screenshot-preview ${isExpanded ? 'expanded' : ''}`}>
      <div className="screenshot-header">
        <h4 className="screenshot-title">Website Screenshot</h4>
        <div className="screenshot-controls">
          <button
            className="control-btn"
            onClick={handleDownload}
            title="Download screenshot"
          >
            <Download size={16} />
          </button>
          <button
            className="control-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Minimize' : 'Expand'}
          >
            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      <div className="screenshot-container">
        <div className="screenshot-wrapper">
          {screenshotDisplayUrl ? (
            <img
              src={screenshotDisplayUrl}
              alt={`Screenshot of ${url}`}
              className="screenshot-image"
              onError={(e) => {
                console.error('Failed to load screenshot:', e);
                e.currentTarget.style.display = 'none';
              }}
              onLoad={() => {
                console.log('Screenshot loaded successfully');
              }}
            />
          ) : (
            <div className="screenshot-error">
              <p>Unable to display screenshot</p>
            </div>
          )}
        </div>
      </div>

      <div className="screenshot-info">
        <span className="screenshot-url">{new URL(url).hostname}</span>
        <div className="screenshot-metadata">
          {screenshot.size && (
            <span className="screenshot-size">
              {(screenshot.size / 1024).toFixed(1)}KB
            </span>
          )}
          {screenshot.strategy && (
            <span className="screenshot-strategy">
              {screenshot.strategy}
            </span>
          )}
          <span className="screenshot-timestamp">
            Captured: {new Date().toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ScreenshotPreview;