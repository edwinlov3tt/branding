import { useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { useBrand } from '@/contexts/BrandContext';
import { getBrandImage } from '@/utils/favicon';
import './BrandProfile.css';

const BrandProfile = () => {
  const { currentBrand } = useBrand();
  const navigate = useNavigate();

  if (!currentBrand) {
    return (
      <div className="brand-profile-card empty" onClick={() => navigate('/brands')}>
        <div className="brand-profile-card-avatar empty-avatar">
          <span>+</span>
        </div>
        <div className="brand-profile-card-info">
          <div className="brand-profile-card-name">Select a brand</div>
          <div className="brand-profile-card-website">Click to browse brands</div>
        </div>
      </div>
    );
  }

  const brandImage = getBrandImage(currentBrand);

  const handleClick = () => {
    navigate('/brands');
  };

  const handleWebsiteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(currentBrand.website, '_blank');
  };

  return (
    <div className="brand-profile-card" onClick={handleClick}>
      <div className="brand-profile-card-avatar">
        {brandImage.type === 'fallback' && brandImage.fallback ? (
          <div
            className="fallback-avatar"
            style={{ backgroundColor: brandImage.fallback.color }}
          >
            <brandImage.fallback.Icon size={20} color="#fff" />
          </div>
        ) : (
          <img
            src={brandImage.url}
            alt={currentBrand.name}
            className="brand-avatar-image"
            onError={(e) => {
              // Fallback to colored circle with initials if image fails
              const fallback = getBrandImage(currentBrand).fallback;
              if (fallback) {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML = `
                    <div class="fallback-avatar" style="background-color: ${fallback.color}">
                      <span style="color: #fff; font-size: 14px; font-weight: 600;">${fallback.initials}</span>
                    </div>
                  `;
                }
              }
            }}
          />
        )}
      </div>

      <div className="brand-profile-card-info">
        <div className="brand-profile-card-name">{currentBrand.name}</div>
        <a
          href={currentBrand.website}
          className="brand-profile-card-website"
          onClick={handleWebsiteClick}
          target="_blank"
          rel="noopener noreferrer"
        >
          {new URL(currentBrand.website.startsWith('http') ? currentBrand.website : `https://${currentBrand.website}`).hostname}
          <ExternalLink size={10} />
        </a>
      </div>
    </div>
  );
};

export default BrandProfile;
