import type { BrandProfile } from '@/types';
import './AudienceInfo.css';

interface AudienceInfoProps {
  profile: BrandProfile | null;
  isLoading?: boolean;
}

const AudienceInfo = ({ profile, isLoading }: AudienceInfoProps) => {
  if (isLoading) {
    return (
      <div className="audience-info-loading">
        <div className="loading"></div>
        <p className="loading-text">Loading audience data...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="audience-info-empty">
        <p>No audience data available yet.</p>
        <p className="hint">Complete onboarding to generate audience insights.</p>
      </div>
    );
  }

  return (
    <div className="audience-info">
      {/* Primary Audience */}
      {profile.primary_audience && (
        <div className="audience-section primary-section">
          <h3 className="section-title">Primary Audience</h3>
          <p className="section-content">{profile.primary_audience}</p>
        </div>
      )}

      <div className="audience-grid">
        {/* Audience Needs */}
        {profile.audience_needs && profile.audience_needs.length > 0 && (
          <div className="audience-section">
            <h3 className="section-title">Audience Needs</h3>
            <ul className="audience-list needs">
              {profile.audience_needs.map((need, index) => (
                <li key={index} className="audience-item">
                  {need}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Pain Points */}
        {profile.audience_pain_points && profile.audience_pain_points.length > 0 && (
          <div className="audience-section">
            <h3 className="section-title">Pain Points</h3>
            <ul className="audience-list pain-points">
              {profile.audience_pain_points.map((point, index) => (
                <li key={index} className="audience-item">
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudienceInfo;
