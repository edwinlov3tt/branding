import { Globe, Edit3 } from 'lucide-react';
import './MethodSelection.css';

interface MethodSelectionProps {
  selectedMethod: 'automatic' | 'manual' | null;
  onMethodSelect: (method: 'automatic' | 'manual') => void;
  onContinue: () => void;
}

const MethodSelection = ({ selectedMethod, onMethodSelect, onContinue }: MethodSelectionProps) => {
  return (
    <div className="method-selection">
      <div className="step-header">
        <h2 className="step-title">How would you like to add your brand?</h2>
        <p className="step-description">
          Choose whether to automatically extract brand assets from a website or manually enter brand information.
        </p>
      </div>

      <div className="method-options">
        <div
          className={`method-card ${selectedMethod === 'automatic' ? 'selected' : ''}`}
          onClick={() => onMethodSelect('automatic')}
        >
          <div className="method-icon">
            <Globe size={32} />
          </div>
          <h3 className="method-title">Automatic Extraction</h3>
          <p className="method-description">
            Extract brand colors, logos, and typography automatically from a website URL.
          </p>
          <div className="method-badge">Recommended</div>
        </div>

        <div
          className={`method-card ${selectedMethod === 'manual' ? 'selected' : ''}`}
          onClick={() => onMethodSelect('manual')}
        >
          <div className="method-icon">
            <Edit3 size={32} />
          </div>
          <h3 className="method-title">Manual Entry</h3>
          <p className="method-description">
            Manually enter your brand name, description, and other details.
          </p>
        </div>
      </div>

      <div className="step-actions">
        <button
          className="button button-primary"
          onClick={onContinue}
          disabled={!selectedMethod}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default MethodSelection;
