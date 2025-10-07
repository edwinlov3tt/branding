import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import type { BrandExtractResponse } from '@/types';
import { extractBrandData } from '@/services/api/brandService';
import './BrandExtraction.css';

interface BrandExtractionProps {
  method: 'automatic' | 'manual';
  onExtracted: (data: BrandExtractResponse) => void;
  onManualSubmit: (name: string, website: string, description: string) => void;
  onBack: () => void;
}

const BrandExtraction = ({ method, onExtracted, onManualSubmit, onBack }: BrandExtractionProps) => {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (method === 'automatic') {
      if (!url) {
        setError('Please enter a website URL');
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const response = await extractBrandData(url, true);
        onExtracted(response);
      } catch (err: any) {
        setError(err.message || 'Failed to extract brand data. Please try again.');
        console.error('Brand extraction error:', err);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Manual mode
      if (!name) {
        setError('Please enter a brand name');
        return;
      }
      onManualSubmit(name, website, description);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleAnalyze();
    }
  };

  return (
    <div className="brand-extraction">
      <div className="step-header">
        <h2 className="step-title">
          {method === 'automatic' ? 'Extract Brand Assets' : 'Enter Brand Information'}
        </h2>
        <p className="step-description">
          {method === 'automatic'
            ? 'Enter your brand website URL to automatically extract logos, colors, and typography.'
            : 'Manually enter your brand details to create a new brand profile.'}
        </p>
      </div>

      <div className="extraction-form">
        {method === 'automatic' ? (
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
                disabled={isLoading}
              />
              <button
                className="button button-primary"
                onClick={handleAnalyze}
                disabled={isLoading || !url}
              >
                {isLoading ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="form-group">
              <label className="form-label">Brand Name *</label>
              <input
                type="text"
                className="input"
                placeholder="Enter brand name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Website URL (Optional)</label>
              <input
                type="url"
                className="input"
                placeholder="https://example.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Brand Description (Optional)</label>
              <textarea
                className="textarea"
                placeholder="Brief description of your brand..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
          </>
        )}

        {error && (
          <div className="error-message">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {isLoading && (
          <div className="loading-container">
            <div className="loading"></div>
            <p className="loading-text">
              Analyzing website and extracting brand assets... This may take a few moments.
            </p>
          </div>
        )}
      </div>

      <div className="step-actions">
        <button className="button button-secondary" onClick={onBack}>
          Back
        </button>
        {method === 'manual' && (
          <button
            className="button button-primary"
            onClick={handleAnalyze}
            disabled={!name}
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
};

export default BrandExtraction;
