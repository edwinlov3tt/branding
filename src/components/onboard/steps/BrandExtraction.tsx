import { useState } from 'react';
import './BrandExtraction.css';

interface BrandExtractionProps {
  onUrlSubmit: (url: string) => void;
  onManualSubmit: (name: string, website: string, description: string) => void;
  onBack: () => void;
}

const BrandExtraction = ({ onUrlSubmit, onManualSubmit, onBack }: BrandExtractionProps) => {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);

  const handleAnalyze = () => {
    if (!url) {
      setError('Please enter a website URL');
      return;
    }

    // Validate URL format
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      setError('Please enter a valid website URL');
      return;
    }

    setError('');
    onUrlSubmit(url);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAnalyze();
    }
  };

  return (
    <div className="brand-extraction">
      <div className="step-header">
        <h2 className="step-title">Extract Brand Assets</h2>
        <p className="step-description">
          Enter your brand website URL to automatically extract logos, colors, and typography.
        </p>
      </div>

      <div className="extraction-form">
        <div className="form-group">
          <label className="form-label">Website URL</label>
          <div className="input-with-button">
            <input
              type="url"
              className="input"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button
              className="button button-primary"
              onClick={handleAnalyze}
              disabled={!url}
            >
              Analyze
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <span>{error}</span>
          </div>
        )}

        {showManualEntry && (
          <div className="manual-entry-form">
            <h3 className="manual-entry-title">Manual Entry</h3>
            <div className="form-group">
              <label className="form-label">Brand Name *</label>
              <input
                type="text"
                className="input"
                placeholder="Enter brand name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Website URL</label>
              <input
                type="url"
                className="input"
                placeholder="https://example.com"
                value={website || url}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description (Optional)</label>
              <textarea
                className="textarea"
                placeholder="Brief description of your brand..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="manual-entry-actions">
              <button
                className="button button-secondary"
                onClick={() => {
                  setShowManualEntry(false);
                  setError('');
                }}
              >
                Back to URL Entry
              </button>
              <button
                className="button button-primary"
                onClick={() => onManualSubmit(name, website || url, description)}
                disabled={!name}
              >
                Continue with Manual Entry
              </button>
            </div>
          </div>
        )}

        {!showManualEntry && (
          <div className="manual-entry-prompt">
            <p className="prompt-text">
              Or{' '}
              <button
                className="link-button"
                onClick={() => setShowManualEntry(true)}
              >
                enter details manually
              </button>
              {' '}if you prefer.
            </p>
          </div>
        )}
      </div>

      <div className="step-actions">
        <button className="button button-secondary" onClick={onBack}>
          Back
        </button>
      </div>
    </div>
  );
};

export default BrandExtraction;
