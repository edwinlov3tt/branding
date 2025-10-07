import { useState } from 'react'
import './Settings.css'

const Settings = () => {
  const [guidelines, setGuidelines] = useState({
    creative: '',
    adCopy: '',
    brand: ''
  })

  const handleSave = () => {
    localStorage.setItem('guidelines', JSON.stringify(guidelines))
    alert('Guidelines saved successfully!')
  }

  return (
    <div className="settings">
      <div className="section">
        <h2 className="section-title">Brand Guidelines</h2>
        <div className="settings-group">
          <div className="form-group">
            <label className="form-label">Brand Guidelines</label>
            <textarea
              className="textarea"
              placeholder="Define your brand identity, voice, and visual standards..."
              rows={6}
              value={guidelines.brand}
              onChange={(e) => setGuidelines({ ...guidelines, brand: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">Content Guidelines</h2>
        <div className="settings-group">
          <div className="form-group">
            <label className="form-label">Creative Guidelines</label>
            <textarea
              className="textarea"
              placeholder="Specify creative direction, imagery style, and design principles..."
              rows={6}
              value={guidelines.creative}
              onChange={(e) => setGuidelines({ ...guidelines, creative: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Ad Copy Guidelines</label>
            <textarea
              className="textarea"
              placeholder="Define tone of voice, messaging style, and copywriting standards..."
              rows={6}
              value={guidelines.adCopy}
              onChange={(e) => setGuidelines({ ...guidelines, adCopy: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="settings-actions">
        <button className="button button-primary" onClick={handleSave}>
          Save Guidelines
        </button>
      </div>
    </div>
  )
}

export default Settings