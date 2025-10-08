import { useState } from 'react'
import { Bookmark, BookmarkCheck, ExternalLink, Play, X } from 'lucide-react'
import type { AdInspiration } from '@/types'
import './AdCard.css'

interface AdCardProps {
  ad: AdInspiration
  onSave?: (ad: AdInspiration) => void
  isSaved?: boolean
  showSaveButton?: boolean
}

const AdCard = ({ ad, onSave, isSaved = false, showSaveButton = true }: AdCardProps) => {
  const [saved, setSaved] = useState(isSaved)
  const [saving, setSaving] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)

  const handleSave = async () => {
    if (saving || !onSave) return

    setSaving(true)
    try {
      await onSave(ad)
      setSaved(true)
    } catch (error) {
      console.error('Failed to save ad:', error)
    } finally {
      setSaving(false)
    }
  }

  const getPlatformColor = (platform: string): string => {
    const colors: Record<string, string> = {
      'Facebook': '#1877f2',
      'Instagram': '#e4405f',
      'TikTok': '#000000',
      'YouTube': '#ff0000',
      'LinkedIn': '#0077b5',
      'Pinterest': '#e60023',
      'Twitter': '#1da1f2'
    }
    return colors[platform] || '#666'
  }

  return (
    <>
      <div className="ad-card">
        <div
          className="ad-thumbnail"
          onClick={() => {
            if (ad.video_url) {
              setShowVideoModal(true)
            } else if (ad.thumbnail_url) {
              setShowImageModal(true)
            }
          }}
          style={{ cursor: (ad.video_url || ad.thumbnail_url) ? 'pointer' : 'default' }}
        >
          {!imageError && ad.thumbnail_url ? (
            <img
              src={ad.thumbnail_url}
              alt={ad.ad_copy || ad.advertiser_name}
              onError={() => setImageError(true)}
              loading="lazy"
            />
          ) : (
            <div className="ad-thumbnail-placeholder">
              <Play size={32} />
            </div>
          )}

          {ad.video_url && (
            <div className="ad-video-badge">
              <Play size={14} />
            </div>
          )}

          {showSaveButton && (
            <button
              className={`ad-save-button ${saved ? 'saved' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                handleSave()
              }}
              disabled={saving || saved}
              title={saved ? 'Saved to inspiration' : 'Save to inspiration'}
            >
              {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
            </button>
          )}
        </div>

      <div className="ad-content">
        <div className="ad-header">
          <h3 className="ad-advertiser">{ad.advertiser_name}</h3>
          <div
            className="ad-platform-badge"
            style={{ backgroundColor: getPlatformColor(ad.platform) }}
          >
            {ad.platform}
          </div>
        </div>

        {ad.ad_copy && (
          <div
            className="ad-copy"
            dangerouslySetInnerHTML={{
              __html: ad.ad_copy.length > 150
                ? `${ad.ad_copy.substring(0, 150)}...`
                : ad.ad_copy
            }}
          />
        )}

        <div className="ad-metadata">
          {ad.niche && (
            <span className="ad-niche">{ad.niche}</span>
          )}
          {ad.ad_data?.cta && (
            <span className="ad-cta">CTA: {ad.ad_data.cta}</span>
          )}
        </div>

        {ad.ad_data?.landing_page && (
          <a
            href={ad.ad_data.landing_page}
            target="_blank"
            rel="noopener noreferrer"
            className="ad-landing-page"
          >
            <ExternalLink size={14} />
            <span>View Landing Page</span>
          </a>
        )}
      </div>
    </div>

      {/* Video Modal */}
      {showVideoModal && ad.video_url && (
        <div className="video-modal-overlay" onClick={() => setShowVideoModal(false)}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="video-modal-close" onClick={() => setShowVideoModal(false)}>
              <X size={24} />
            </button>
            <video
              src={ad.video_url}
              controls
              autoPlay
              className="video-player"
            >
              Your browser does not support video playback.
            </video>
            <div className="video-modal-info">
              <h3>{ad.advertiser_name}</h3>
              {ad.ad_copy && (
                <div dangerouslySetInnerHTML={{ __html: ad.ad_copy }} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && ad.thumbnail_url && (
        <div className="video-modal-overlay" onClick={() => setShowImageModal(false)}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="video-modal-close" onClick={() => setShowImageModal(false)}>
              <X size={24} />
            </button>
            <img
              src={ad.thumbnail_url}
              alt={ad.advertiser_name}
              className="image-viewer"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
            <div className="video-modal-info">
              <h3>{ad.advertiser_name}</h3>
              {ad.ad_copy && (
                <div dangerouslySetInnerHTML={{ __html: ad.ad_copy }} />
              )}
              {ad.ad_data?.cta && (
                <p><strong>CTA:</strong> {ad.ad_data.cta}</p>
              )}
              {ad.ad_data?.landing_page && (
                <a
                  href={ad.ad_data.landing_page}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--brand-red)', textDecoration: 'none', marginTop: '12px', display: 'inline-block' }}
                >
                  View Landing Page →
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AdCard
