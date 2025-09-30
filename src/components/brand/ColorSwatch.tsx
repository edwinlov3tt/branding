import { useState } from 'react';
import { X, Check, ChevronDown } from 'lucide-react';
import type { ColorPalette } from '@/types';
import { getBestContrastColor, getAccessibilityInfo } from '@/utils/colorUtils';
import ConfidenceBar from './ConfidenceBar';
import './ColorSwatch.css';

interface ColorSwatchProps {
  color: ColorPalette;
  onRemove: (hex: string) => void;
  onRoleChange: (hex: string, role: string) => void;
  size?: 'small' | 'medium' | 'large';
  showControls?: boolean;
}

const ColorSwatch = ({
  color,
  onRemove,
  onRoleChange,
  size = 'medium',
  showControls = true
}: ColorSwatchProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(color.role);

  const contrastColor = getBestContrastColor(color.hex);
  const accessibilityInfo = getAccessibilityInfo(color.hex, '#ffffff');
  const accessibilityInfoDark = getAccessibilityInfo(color.hex, '#000000');

  const roles = ['primary', 'secondary', 'accent', 'light', 'dark', 'neutral'];

  const handleRoleChange = (newRole: string) => {
    setSelectedRole(newRole);
    onRoleChange(color.hex, newRole);
    setIsDropdownOpen(false);
  };

  const getAccessibilityBadge = (info: typeof accessibilityInfo, label: string) => {
    const { level } = info;
    return (
      <div className={`accessibility-badge ${level.toLowerCase()}`}>
        <span className="badge-text">{level}</span>
        <span className="badge-label">{label}</span>
      </div>
    );
  };

  return (
    <div className={`color-swatch-container ${size}`}>
      <div className="color-swatch-main">
        <div
          className="color-swatch"
          style={{
            backgroundColor: color.hex,
            color: contrastColor
          }}
        >
          <div className="swatch-overlay">
            {color.inLogo && (
              <div className="logo-indicator" title="Used in logo">
                <Check size={12} />
              </div>
            )}
            {showControls && (
              <button
                className="remove-button"
                onClick={() => onRemove(color.hex)}
                title="Remove color"
                aria-label={`Remove color ${color.hex}`}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="color-info">
          <div className="color-header">
            <span className="color-hex">{color.hex}</span>
            <ConfidenceBar
              confidence={color.confidence}
              size="small"
              showPercentage={false}
            />
          </div>

          <div className="color-metadata">
            <div className="role-selector">
              {showControls ? (
                <div className="dropdown-container">
                  <button
                    className="role-button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    aria-expanded={isDropdownOpen}
                  >
                    <span className="role-text">{selectedRole}</span>
                    <ChevronDown size={12} />
                  </button>
                  {isDropdownOpen && (
                    <div className="dropdown-menu">
                      {roles.map((role) => (
                        <button
                          key={role}
                          className={`dropdown-item ${role === selectedRole ? 'selected' : ''}`}
                          onClick={() => handleRoleChange(role)}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <span className="role-display">{selectedRole}</span>
              )}
            </div>

            <div className="usage-info">
              <span className="coverage">{color.coverage}</span>
              <span className="frequency">Used {color.frequency}×</span>
            </div>
          </div>

          <div className="accessibility-badges">
            {getAccessibilityBadge(accessibilityInfo, 'vs White')}
            {getAccessibilityBadge(accessibilityInfoDark, 'vs Black')}
          </div>

          {color.usedIn && color.usedIn.length > 0 && (
            <div className="usage-contexts">
              <span className="usage-label">Used in:</span>
              <div className="usage-tags">
                {color.usedIn.slice(0, 3).map((context, index) => (
                  <span key={index} className="usage-tag">
                    {context}
                  </span>
                ))}
                {color.usedIn.length > 3 && (
                  <span className="usage-tag more">
                    +{color.usedIn.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ColorSwatch;