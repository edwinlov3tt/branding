import { useState, useEffect } from 'react';
import type { BrandProfile } from '@/types';
import './WritingGuide.css';

interface WritingGuideProps {
  profile: BrandProfile | null;
  isLoading?: boolean;
}

interface Guidelines {
  brand: string;
  creative: string;
  adCopy: string;
}

const WritingGuide = ({ profile, isLoading }: WritingGuideProps) => {
  const [guidelines, setGuidelines] = useState<Guidelines>({
    brand: '',
    creative: '',
    adCopy: ''
  });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Load guidelines from localStorage on mount
    const saved = localStorage.getItem('guidelines');
    if (saved) {
      try {
        setGuidelines(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load guidelines:', e);
      }
    }
  }, []);

  const handleGuidelineChange = (field: keyof Guidelines, value: string) => {
    setGuidelines(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    localStorage.setItem('guidelines', JSON.stringify(guidelines));
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <div className="writing-guide-loading">
        <div className="loading"></div>
        <p className="loading-text">Loading writing guide...</p>
      </div>
    );
  }

  return (
    <div className="writing-guide">
      {/* Sentence Length */}
      {profile && profile.sentence_length && (
        <div className="guide-section">
          <h3 className="section-title">Sentence Length</h3>
          <div className="sentence-length-badge">
            {profile.sentence_length.toUpperCase()}
          </div>
        </div>
      )}

      {/* Paragraph Style */}
      {profile && profile.paragraph_style && (
        <div className="guide-section">
          <h3 className="section-title">Paragraph Style</h3>
          <p className="section-content">{profile.paragraph_style}</p>
        </div>
      )}

      {/* Formatting Guidelines */}
      {profile && profile.formatting_guidelines && (
        <div className="guide-section">
          <h3 className="section-title">Formatting Guidelines</h3>
          <p className="section-content">{profile.formatting_guidelines}</p>
        </div>
      )}

      {/* Things to Avoid */}
      {profile && profile.writing_avoid && profile.writing_avoid.length > 0 && (
        <div className="guide-section avoid-section">
          <h3 className="section-title">Things to Avoid</h3>
          <ul className="avoid-list">
            {profile.writing_avoid.map((item, index) => (
              <li key={index} className="avoid-item">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Custom Guidelines Section */}
      <div className="custom-guidelines-section">
        <div className="section-header-with-save">
          <h2 className="guidelines-main-title">Custom Guidelines</h2>
          {hasChanges && (
            <button className="save-guidelines-button" onClick={handleSave}>
              Save Guidelines
            </button>
          )}
        </div>

        <div className="guide-section">
          <h3 className="section-title">Brand Guidelines</h3>
          <textarea
            className="guideline-textarea"
            placeholder="Define your brand identity, voice, and visual standards..."
            rows={6}
            value={guidelines.brand}
            onChange={(e) => handleGuidelineChange('brand', e.target.value)}
          />
        </div>

        <div className="guide-section">
          <h3 className="section-title">Creative Guidelines</h3>
          <textarea
            className="guideline-textarea"
            placeholder="Specify creative direction, imagery style, and design principles..."
            rows={6}
            value={guidelines.creative}
            onChange={(e) => handleGuidelineChange('creative', e.target.value)}
          />
        </div>

        <div className="guide-section">
          <h3 className="section-title">Ad Copy Guidelines</h3>
          <textarea
            className="guideline-textarea"
            placeholder="Define tone of voice, messaging style, and copywriting standards..."
            rows={6}
            value={guidelines.adCopy}
            onChange={(e) => handleGuidelineChange('adCopy', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default WritingGuide;
