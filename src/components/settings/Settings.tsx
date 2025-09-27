import { useState } from 'react'
import './Settings.css'

const Settings = () => {
  const [apiKeys, setApiKeys] = useState({
    claude: '',
    openai: ''
  })

  const [preferences, setPreferences] = useState({
    theme: 'dark',
    autoSave: true
  })

  const handleSave = () => {
    localStorage.setItem('apiKeys', JSON.stringify(apiKeys))
    localStorage.setItem('preferences', JSON.stringify(preferences))
    alert('Settings saved successfully!')
  }

  return (
    <div className="settings">
      <div className="section">
        <h2 className="section-title">API Configuration</h2>
        <div className="settings-group">
          <div className="form-group">
            <label className="form-label">Claude API Key</label>
            <input
              type="password"
              className="input"
              placeholder="sk-ant-..."
              value={apiKeys.claude}
              onChange={(e) => setApiKeys({ ...apiKeys, claude: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">OpenAI API Key</label>
            <input
              type="password"
              className="input"
              placeholder="sk-..."
              value={apiKeys.openai}
              onChange={(e) => setApiKeys({ ...apiKeys, openai: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">Preferences</h2>
        <div className="settings-group">
          <div className="form-group">
            <label className="form-label">Theme</label>
            <select
              className="select"
              value={preferences.theme}
              onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={preferences.autoSave}
                onChange={(e) => setPreferences({ ...preferences, autoSave: e.target.checked })}
              />
              <span>Enable auto-save</span>
            </label>
          </div>
        </div>
      </div>

      <div className="settings-actions">
        <button className="button button-primary" onClick={handleSave}>
          Save Settings
        </button>
      </div>
    </div>
  )
}

export default Settings