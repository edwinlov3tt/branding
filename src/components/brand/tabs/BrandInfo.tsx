import type { BrandProfile } from '@/types';
import './BrandInfo.css';

interface BrandInfoProps {
  profile: BrandProfile | null;
  isLoading?: boolean;
}

const BrandInfo = ({ profile, isLoading }: BrandInfoProps) => {
  if (isLoading) {
    return (
      <div className="brand-info-loading">
        <div className="loading"></div>
        <p className="loading-text">Loading brand profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="brand-info-empty">
        <p>No brand profile data available yet.</p>
        <p className="hint">Complete onboarding to generate a comprehensive brand profile.</p>
      </div>
    );
  }

  return (
    <div className="brand-info">
      {/* Brand Name & Tagline */}
      {(profile.brand_name || profile.tagline) && (
        <div className="brand-info-section">
          <div className="brand-header">
            {profile.brand_name && <h2 className="brand-name">{profile.brand_name}</h2>}
            {profile.tagline && <p className="brand-tagline">"{profile.tagline}"</p>}
          </div>
        </div>
      )}

      {/* Positioning */}
      {profile.positioning && (
        <div className="brand-info-section">
          <h3 className="section-title">Brand Positioning</h3>
          <p className="section-content">{profile.positioning}</p>
        </div>
      )}

      {/* Mission */}
      {profile.mission && (
        <div className="brand-info-section">
          <h3 className="section-title">Mission</h3>
          <p className="section-content">{profile.mission}</p>
        </div>
      )}

      {/* Story */}
      {profile.story && (
        <div className="brand-info-section">
          <h3 className="section-title">Brand Story</h3>
          <p className="section-content">{profile.story}</p>
        </div>
      )}

      {/* Value Propositions */}
      {profile.value_props && profile.value_props.length > 0 && (
        <div className="brand-info-section">
          <h3 className="section-title">Value Propositions</h3>
          <ul className="value-props-list">
            {profile.value_props.map((prop, index) => (
              <li key={index} className="value-prop-item">
                {prop}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Analysis Metadata */}
      {(profile.pages_crawled > 0 || profile.confidence_score) && (
        <div className="brand-info-section analysis-meta">
          <h3 className="section-title">Analysis Details</h3>
          <div className="meta-grid">
            {profile.pages_crawled > 0 && (
              <div className="meta-item">
                <span className="meta-label">Pages Analyzed</span>
                <span className="meta-value">{profile.pages_crawled}</span>
              </div>
            )}
            {profile.reviews_analyzed > 0 && (
              <div className="meta-item">
                <span className="meta-label">Reviews Analyzed</span>
                <span className="meta-value">{profile.reviews_analyzed}</span>
              </div>
            )}
            {profile.confidence_score && (
              <div className="meta-item">
                <span className="meta-label">Confidence Score</span>
                <span className="meta-value">{Math.round(profile.confidence_score * 100)}%</span>
              </div>
            )}
            {profile.analysis_duration && (
              <div className="meta-item">
                <span className="meta-label">Analysis Duration</span>
                <span className="meta-value">{profile.analysis_duration}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandInfo;
