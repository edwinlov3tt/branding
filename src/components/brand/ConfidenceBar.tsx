interface ConfidenceBarProps {
  confidence: number;
  size?: 'small' | 'medium' | 'large';
  showPercentage?: boolean;
  className?: string;
}

const ConfidenceBar = ({
  confidence,
  size = 'medium',
  showPercentage = true,
  className = ''
}: ConfidenceBarProps) => {
  const percentage = Math.round(confidence * 100);

  const getColorClass = (conf: number) => {
    if (conf >= 0.8) return 'confidence-high';
    if (conf >= 0.6) return 'confidence-medium';
    return 'confidence-low';
  };

  const getSizeClass = (s: string) => {
    switch (s) {
      case 'small': return 'confidence-bar-small';
      case 'large': return 'confidence-bar-large';
      default: return 'confidence-bar-medium';
    }
  };

  return (
    <div className={`confidence-container ${className}`}>
      <div className={`confidence-bar ${getSizeClass(size)}`}>
        <div
          className={`confidence-fill ${getColorClass(confidence)}`}
          style={{ width: `${percentage}%` }}
          aria-label={`Confidence: ${percentage}%`}
        />
      </div>
      {showPercentage && (
        <span className="confidence-text" aria-hidden="true">
          {percentage}%
        </span>
      )}
    </div>
  );
};

export default ConfidenceBar;