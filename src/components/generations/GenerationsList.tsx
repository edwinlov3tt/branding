import { useState } from 'react'
import { Image, Video, Target } from 'lucide-react'
import type { Generation } from '@/types'
import './GenerationsList.css'

const GenerationsList = () => {
  const [generations] = useState<Generation[]>([])

  return (
    <div className="generations-list">
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Generated Creatives</h2>
          <button className="button button-primary">New Generation</button>
        </div>

        {generations.length > 0 ? (
          <div className="generations-grid">
            {generations.map(generation => (
              <div key={generation.id} className="generation-card card">
                <div className="generation-preview">
                  {generation.type === 'image' ? (
                    <Image size={48} />
                  ) : generation.type === 'video' ? (
                    <Video size={48} />
                  ) : (
                    <Target size={48} />
                  )}
                </div>
                <h3 className="generation-type">
                  {generation.type.charAt(0).toUpperCase() + generation.type.slice(1)} Creative
                </h3>
                <p className="generation-prompt">{generation.prompt}</p>
                <div className="generation-meta">
                  <span className={`status-badge ${generation.status === 'completed' ? 'status-success' : 'status-warning'}`}>
                    {generation.status}
                  </span>
                  <span className="generation-model">{generation.model}</span>
                </div>
                <div className="generation-actions">
                  <button className="button button-secondary">Remix</button>
                  <button className="button button-secondary">Download</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p className="empty-text">No generated creatives yet</p>
            <p className="empty-subtext">Click "New Generation" above to create AI-powered images, videos, and banners for your campaigns.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default GenerationsList