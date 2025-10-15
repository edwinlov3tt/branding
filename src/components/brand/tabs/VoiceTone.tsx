import type { BrandProfile } from '@/types';
import './VoiceTone.css';

interface VoiceToneProps {
  profile: BrandProfile | null;
  isLoading?: boolean;
}

const VoiceTone = ({ profile, isLoading }: VoiceToneProps) => {
  if (isLoading) {
    return (
      <div className="voice-tone-loading">
        <div className="loading"></div>
        <p className="loading-text">Loading voice & tone data...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="voice-tone-empty">
        <p>No voice & tone data available yet.</p>
        <p className="hint">Complete onboarding to generate voice & tone analysis.</p>
      </div>
    );
  }

  return (
    <div className="voice-tone">
      {/* Personality Traits */}
      {profile.personality && profile.personality.length > 0 && (
        <div className="voice-tone-section">
          <h3 className="section-title">Brand Personality</h3>
          <div className="personality-tags">
            {profile.personality.map((trait, index) => (
              <span key={index} className="personality-tag">
                {trait}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tone Sliders */}
      {profile.tone_sliders && (
        <div className="voice-tone-section">
          <h3 className="section-title">Tone Spectrum</h3>
          <div className="tone-sliders">
            {Object.entries(profile.tone_sliders).map(([key, value]) => (
              <div key={key} className="tone-slider">
                <div className="slider-header">
                  <span className="slider-label">{formatToneLabel(key)}</span>
                  <span className="slider-value">{value}/100</span>
                </div>
                <div className="slider-track">
                  <div
                    className="slider-fill"
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lexicon */}
      <div className="voice-tone-section lexicon-section">
        <div className="lexicon-grid">
          {/* Preferred Words */}
          {profile.lexicon_preferred && profile.lexicon_preferred.length > 0 && (
            <div className="lexicon-column">
              <h3 className="section-title preferred">Preferred Language</h3>
              <div className="lexicon-description">
                Words and phrases that align with the brand voice:
              </div>
              <ul className="lexicon-list">
                {profile.lexicon_preferred.map((word, index) => (
                  <li key={index} className="lexicon-item preferred">
                    {word}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Avoid Words */}
          {profile.lexicon_avoid && profile.lexicon_avoid.length > 0 && (
            <div className="lexicon-column">
              <h3 className="section-title avoid">Avoid</h3>
              <div className="lexicon-description">
                Words and phrases to avoid using:
              </div>
              <ul className="lexicon-list">
                {profile.lexicon_avoid.map((word, index) => (
                  <li key={index} className="lexicon-item avoid">
                    {word}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to format tone label
function formatToneLabel(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

export default VoiceTone;
