import { useState } from 'react'
import { ChevronDown, ChevronUp, Copy, CheckCircle } from 'lucide-react'
import './AdCopyCard.css'

interface MetaCopyData {
  postText: string
  headline: string
  linkDescription: string
  displayLink: string
  cta: string
  adName: string
  reasoning?: string
}

interface DisplayCopyData {
  shortHeadline: string
  longHeadline: string
  description: string
  displayLink: string
  cta: string
  adName: string
  reasoning?: string
}

interface AdCopyVariant {
  id: string
  variant_number: number
  copy_data: MetaCopyData | DisplayCopyData
  rationale: string
  created_at: string
}

interface GeneratedCreative {
  id: string
  brand_id: string
  campaign_id: string
  campaign_name?: string
  campaign_objective?: string
  channel: string
  status: 'generating' | 'completed' | 'failed'
  generation_model?: string
  error_message?: string
  variants: AdCopyVariant[]
  created_at: string
}

interface AdCopyCardProps {
  creative: GeneratedCreative
}

const AdCopyCard = ({ creative }: AdCopyCardProps) => {
  const [expandedVariant, setExpandedVariant] = useState<number | null>(null)
  const [copiedFields, setCopiedFields] = useState<Record<string, boolean>>({})

  const isMeta = creative.channel === 'Meta'
  const isDisplay = creative.channel.includes('Display')

  const handleCopy = async (text: string, fieldKey: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedFields({ ...copiedFields, [fieldKey]: true })
      setTimeout(() => {
        setCopiedFields(prev => ({ ...prev, [fieldKey]: false }))
      }, 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const toggleVariant = (variantNumber: number) => {
    setExpandedVariant(expandedVariant === variantNumber ? null : variantNumber)
  }

  const getChannelBadgeClass = () => {
    if (isMeta) return 'channel-badge-meta'
    if (isDisplay) return 'channel-badge-display'
    return 'channel-badge-default'
  }

  const renderMetaVariant = (variant: AdCopyVariant) => {
    const data = variant.copy_data as MetaCopyData

    return (
      <div key={variant.id} className="variant-item">
        <div
          className="variant-header"
          onClick={() => toggleVariant(variant.variant_number)}
        >
          <div className="variant-title">
            <span className="variant-number">Variant {variant.variant_number}</span>
            <span className="variant-adname">{data.adName}</span>
          </div>
          {expandedVariant === variant.variant_number ? (
            <ChevronUp size={20} />
          ) : (
            <ChevronDown size={20} />
          )}
        </div>

        {expandedVariant === variant.variant_number && (
          <div className="variant-content">
            <div className="copy-field">
              <div className="field-header">
                <label className="field-label">Primary Text ({data.postText.length}/125)</label>
                <button
                  className="copy-button"
                  onClick={() => handleCopy(data.postText, `${variant.id}-postText`)}
                >
                  {copiedFields[`${variant.id}-postText`] ? (
                    <CheckCircle size={16} />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
              <p className="field-value">{data.postText}</p>
            </div>

            <div className="copy-field">
              <div className="field-header">
                <label className="field-label">Headline ({data.headline.length}/40)</label>
                <button
                  className="copy-button"
                  onClick={() => handleCopy(data.headline, `${variant.id}-headline`)}
                >
                  {copiedFields[`${variant.id}-headline`] ? (
                    <CheckCircle size={16} />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
              <p className="field-value">{data.headline}</p>
            </div>

            <div className="copy-field">
              <div className="field-header">
                <label className="field-label">Link Description ({data.linkDescription.length}/30)</label>
                <button
                  className="copy-button"
                  onClick={() => handleCopy(data.linkDescription, `${variant.id}-linkDesc`)}
                >
                  {copiedFields[`${variant.id}-linkDesc`] ? (
                    <CheckCircle size={16} />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
              <p className="field-value">{data.linkDescription}</p>
            </div>

            <div className="field-row">
              <div className="copy-field">
                <label className="field-label">Display Link</label>
                <p className="field-value">{data.displayLink}</p>
              </div>

              <div className="copy-field">
                <label className="field-label">CTA</label>
                <p className="field-value cta-value">{data.cta}</p>
              </div>
            </div>

            {variant.rationale && (
              <div className="copy-field">
                <label className="field-label">Rationale</label>
                <p className="field-value rationale-text">{variant.rationale}</p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderDisplayVariant = (variant: AdCopyVariant) => {
    const data = variant.copy_data as DisplayCopyData

    return (
      <div key={variant.id} className="variant-item">
        <div
          className="variant-header"
          onClick={() => toggleVariant(variant.variant_number)}
        >
          <div className="variant-title">
            <span className="variant-number">Variant {variant.variant_number}</span>
            <span className="variant-adname">{data.adName}</span>
          </div>
          {expandedVariant === variant.variant_number ? (
            <ChevronUp size={20} />
          ) : (
            <ChevronDown size={20} />
          )}
        </div>

        {expandedVariant === variant.variant_number && (
          <div className="variant-content">
            <div className="copy-field">
              <div className="field-header">
                <label className="field-label">Short Headline ({data.shortHeadline.length}/30)</label>
                <button
                  className="copy-button"
                  onClick={() => handleCopy(data.shortHeadline, `${variant.id}-shortHeadline`)}
                >
                  {copiedFields[`${variant.id}-shortHeadline`] ? (
                    <CheckCircle size={16} />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
              <p className="field-value">{data.shortHeadline}</p>
            </div>

            <div className="copy-field">
              <div className="field-header">
                <label className="field-label">Long Headline ({data.longHeadline.length}/90)</label>
                <button
                  className="copy-button"
                  onClick={() => handleCopy(data.longHeadline, `${variant.id}-longHeadline`)}
                >
                  {copiedFields[`${variant.id}-longHeadline`] ? (
                    <CheckCircle size={16} />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
              <p className="field-value">{data.longHeadline}</p>
            </div>

            <div className="copy-field">
              <div className="field-header">
                <label className="field-label">Description ({data.description.length}/90)</label>
                <button
                  className="copy-button"
                  onClick={() => handleCopy(data.description, `${variant.id}-description`)}
                >
                  {copiedFields[`${variant.id}-description`] ? (
                    <CheckCircle size={16} />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
              <p className="field-value">{data.description}</p>
            </div>

            <div className="field-row">
              <div className="copy-field">
                <label className="field-label">Display Link</label>
                <p className="field-value">{data.displayLink}</p>
              </div>

              <div className="copy-field">
                <label className="field-label">CTA</label>
                <p className="field-value cta-value">{data.cta}</p>
              </div>
            </div>

            {variant.rationale && (
              <div className="copy-field">
                <label className="field-label">Rationale</label>
                <p className="field-value rationale-text">{variant.rationale}</p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="ad-copy-card">
      <div className="card-header">
        <div className="header-top">
          <h3 className="card-title">{creative.campaign_name || 'Untitled Campaign'}</h3>
          <span className={`channel-badge ${getChannelBadgeClass()}`}>
            {creative.channel}
          </span>
        </div>
        {creative.campaign_objective && (
          <p className="card-subtitle">{creative.campaign_objective}</p>
        )}
      </div>

      <div className="card-body">
        {creative.status === 'failed' && (
          <div className="error-state">
            <p className="error-message">
              Generation failed: {creative.error_message || 'Unknown error'}
            </p>
          </div>
        )}

        {creative.status === 'generating' && (
          <div className="loading-state">
            <p className="loading-message">Generating ad copy variants...</p>
          </div>
        )}

        {creative.status === 'completed' && creative.variants.length > 0 && (
          <div className="variants-list">
            {creative.variants.map(variant =>
              isMeta
                ? renderMetaVariant(variant)
                : renderDisplayVariant(variant)
            )}
          </div>
        )}

        {creative.status === 'completed' && creative.variants.length === 0 && (
          <div className="empty-state">
            <p className="empty-message">No variants generated</p>
          </div>
        )}
      </div>

      <div className="card-footer">
        <span className="footer-text">
          Generated {new Date(creative.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
        {creative.generation_model && (
          <span className="footer-text model-text">
            {creative.generation_model}
          </span>
        )}
      </div>
    </div>
  )
}

export default AdCopyCard
