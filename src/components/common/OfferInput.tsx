import { Plus, X } from 'lucide-react'
import './OfferInput.css'

export interface Offer {
  id?: string
  offer_text: string
  expiration_date?: string
}

interface OfferInputProps {
  label?: string
  offers: Offer[]
  onChange: (offers: Offer[]) => void
}

const OfferInput = ({ label = 'Offers', offers, onChange }: OfferInputProps) => {
  const addOffer = () => {
    onChange([...offers, { offer_text: '', expiration_date: '' }])
  }

  const removeOffer = (index: number) => {
    const newOffers = offers.filter((_, i) => i !== index)
    onChange(newOffers)
  }

  const updateOffer = (index: number, field: 'offer_text' | 'expiration_date', value: string) => {
    const newOffers = [...offers]
    newOffers[index] = { ...newOffers[index], [field]: value }
    onChange(newOffers)
  }

  return (
    <div className="offer-input-container">
      <div className="offer-input-header">
        <label className="form-label">{label}</label>
        <button
          type="button"
          className="button button-secondary button-sm"
          onClick={addOffer}
        >
          <Plus size={16} />
          Add Offer
        </button>
      </div>

      {offers.length > 0 && (
        <div className="offers-list">
          {offers.map((offer, index) => (
            <div key={index} className="offer-item">
              <div className="offer-inputs">
                <input
                  type="text"
                  className="form-input offer-text-input"
                  value={offer.offer_text}
                  onChange={(e) => updateOffer(index, 'offer_text', e.target.value)}
                  placeholder="e.g., 20% off for new customers"
                />
                <input
                  type="date"
                  className="form-input offer-date-input"
                  value={offer.expiration_date || ''}
                  onChange={(e) => updateOffer(index, 'expiration_date', e.target.value)}
                  placeholder="Expiration date (optional)"
                />
              </div>
              <button
                type="button"
                className="remove-offer-btn"
                onClick={() => removeOffer(index)}
                title="Remove offer"
              >
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      {offers.length === 0 && (
        <p className="offer-hint">No offers added yet. Click "Add Offer" to create one.</p>
      )}
    </div>
  )
}

export default OfferInput
