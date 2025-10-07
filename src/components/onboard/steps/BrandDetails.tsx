import { useState } from 'react';
import './BrandDetails.css';

interface BrandDetailsProps {
  initialName?: string;
  initialWebsite?: string;
  onSave: (details: BrandDetailsData) => void;
  onBack: () => void;
  isSaving: boolean;
}

export interface BrandDetailsData {
  name: string;
  website: string;
  industry: string;
  description: string;
}

const industries = [
  'Technology',
  'E-commerce',
  'Healthcare',
  'Finance',
  'Education',
  'Entertainment',
  'Food & Beverage',
  'Fashion',
  'Travel',
  'Real Estate',
  'Automotive',
  'Sports',
  'Non-profit',
  'Professional Services',
  'Manufacturing',
  'Other'
];

const BrandDetails = ({ initialName = '', initialWebsite = '', onSave, onBack, isSaving }: BrandDetailsProps) => {
  const [name, setName] = useState(initialName);
  const [website, setWebsite] = useState(initialWebsite);
  const [industry, setIndustry] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!name) return;
    onSave({ name, website, industry, description });
  };

  return (
    <div className="brand-details">
      <div className="step-header">
        <h2 className="step-title">Brand Details</h2>
        <p className="step-description">
          Add additional information about your brand. This will help personalize your experience.
        </p>
      </div>

      <div className="details-form">
        <div className="form-group">
          <label className="form-label">
            Brand Name *
          </label>
          <input
            type="text"
            className="input"
            placeholder="Enter brand name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            Website URL
          </label>
          <input
            type="url"
            className="input"
            placeholder="https://example.com"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            Industry
          </label>
          <select
            className="select"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
          >
            <option value="">Select an industry</option>
            {industries.map(ind => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            Brand Description
          </label>
          <textarea
            className="textarea"
            placeholder="Brief description of your brand, products, and target audience..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
          />
          <span className="form-hint">
            This description will help generate better audience insights and creative content.
          </span>
        </div>
      </div>

      <div className="step-actions">
        <button
          className="button button-secondary"
          onClick={onBack}
          disabled={isSaving}
        >
          Back
        </button>
        <button
          className="button button-primary"
          onClick={handleSubmit}
          disabled={!name || isSaving}
        >
          {isSaving ? 'Creating Brand...' : 'Create Brand'}
        </button>
      </div>
    </div>
  );
};

export default BrandDetails;
