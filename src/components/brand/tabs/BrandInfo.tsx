import { useState } from 'react';
import { Edit2, Save, X } from 'lucide-react';
import type { BrandProfile } from '@/types';
import { updateBrandProfile } from '@/services/api/brandService';
import './BrandInfo.css';

interface BrandInfoProps {
  profile: BrandProfile | null;
  isLoading?: boolean;
  brandId: string;
  onUpdate: () => void;
}

const BrandInfo = ({ profile, isLoading, brandId, onUpdate }: BrandInfoProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedValues, setEditedValues] = useState({
    brand_name: profile?.brand_name || '',
    tagline: profile?.tagline || '',
    positioning: profile?.positioning || '',
    mission: profile?.mission || '',
    story: profile?.story || '',
    value_props: profile?.value_props || []
  });

  const handleEdit = () => {
    // Initialize edited values with current profile data
    setEditedValues({
      brand_name: profile?.brand_name || '',
      tagline: profile?.tagline || '',
      positioning: profile?.positioning || '',
      mission: profile?.mission || '',
      story: profile?.story || '',
      value_props: profile?.value_props || []
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!brandId) {
      alert('Brand ID is missing');
      return;
    }

    setIsSaving(true);
    try {
      await updateBrandProfile(brandId, editedValues);
      setIsEditing(false);
      onUpdate(); // Reload profile data
    } catch (error) {
      console.error('Failed to save brand profile:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleValuePropChange = (index: number, value: string) => {
    const updated = [...editedValues.value_props];
    updated[index] = value;
    setEditedValues({ ...editedValues, value_props: updated });
  };

  const handleAddValueProp = () => {
    setEditedValues({
      ...editedValues,
      value_props: [...editedValues.value_props, '']
    });
  };

  const handleRemoveValueProp = (index: number) => {
    const updated = editedValues.value_props.filter((_, i) => i !== index);
    setEditedValues({ ...editedValues, value_props: updated });
  };

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
      {/* Edit Controls */}
      <div className="edit-controls">
        {!isEditing ? (
          <button className="edit-button" onClick={handleEdit}>
            <Edit2 size={16} />
            Edit
          </button>
        ) : (
          <div className="edit-actions">
            <button className="cancel-button" onClick={handleCancel} disabled={isSaving}>
              <X size={16} />
              Cancel
            </button>
            <button className="save-button" onClick={handleSave} disabled={isSaving}>
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {/* Brand Name & Tagline */}
      {(profile.brand_name || profile.tagline || isEditing) && (
        <div className="brand-info-section">
          <div className="brand-header">
            {isEditing ? (
              <>
                <input
                  type="text"
                  className="brand-name-input"
                  value={editedValues.brand_name}
                  onChange={(e) => setEditedValues({ ...editedValues, brand_name: e.target.value })}
                  placeholder="Brand Name"
                />
                <input
                  type="text"
                  className="brand-tagline-input"
                  value={editedValues.tagline}
                  onChange={(e) => setEditedValues({ ...editedValues, tagline: e.target.value })}
                  placeholder="Brand Tagline"
                />
              </>
            ) : (
              <>
                {profile.brand_name && <h2 className="brand-name">{profile.brand_name}</h2>}
                {profile.tagline && <p className="brand-tagline">"{profile.tagline}"</p>}
              </>
            )}
          </div>
        </div>
      )}

      {/* Positioning */}
      {(profile.positioning || isEditing) && (
        <div className="brand-info-section">
          <h3 className="section-title">Brand Positioning</h3>
          {isEditing ? (
            <textarea
              className="section-input"
              value={editedValues.positioning}
              onChange={(e) => setEditedValues({ ...editedValues, positioning: e.target.value })}
              placeholder="Describe your brand positioning..."
              rows={3}
            />
          ) : (
            <p className="section-content">{profile.positioning}</p>
          )}
        </div>
      )}

      {/* Mission */}
      {(profile.mission || isEditing) && (
        <div className="brand-info-section">
          <h3 className="section-title">Mission</h3>
          {isEditing ? (
            <textarea
              className="section-input"
              value={editedValues.mission}
              onChange={(e) => setEditedValues({ ...editedValues, mission: e.target.value })}
              placeholder="Describe your mission..."
              rows={3}
            />
          ) : (
            <p className="section-content">{profile.mission}</p>
          )}
        </div>
      )}

      {/* Story */}
      {(profile.story || isEditing) && (
        <div className="brand-info-section">
          <h3 className="section-title">Brand Story</h3>
          {isEditing ? (
            <textarea
              className="section-input"
              value={editedValues.story}
              onChange={(e) => setEditedValues({ ...editedValues, story: e.target.value })}
              placeholder="Tell your brand story..."
              rows={5}
            />
          ) : (
            <p className="section-content">{profile.story}</p>
          )}
        </div>
      )}

      {/* Value Propositions */}
      {(profile.value_props && profile.value_props.length > 0) || isEditing ? (
        <div className="brand-info-section">
          <h3 className="section-title">Value Propositions</h3>
          {isEditing ? (
            <div className="value-props-edit">
              {editedValues.value_props.map((prop, index) => (
                <div key={index} className="value-prop-edit-item">
                  <input
                    type="text"
                    className="value-prop-input"
                    value={prop}
                    onChange={(e) => handleValuePropChange(index, e.target.value)}
                    placeholder="Value proposition..."
                  />
                  <button
                    className="remove-value-prop"
                    onClick={() => handleRemoveValueProp(index)}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button className="add-value-prop" onClick={handleAddValueProp}>
                + Add Value Proposition
              </button>
            </div>
          ) : (
            <ul className="value-props-list">
              {profile.value_props.map((prop, index) => (
                <li key={index} className="value-prop-item">
                  {prop}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {/* Analysis Metadata - Read-only */}
      {!isEditing && (profile.pages_crawled > 0 || profile.confidence_score) && (
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
