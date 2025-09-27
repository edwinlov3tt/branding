import { useState } from 'react'
import type { Generation } from '@/types'
import './GenerationsList.css'

const GenerationsList = () => {
  const [generations] = useState<Generation[]>([
    {
      id: '1',
      type: 'image',
      prompt: 'Modern e-commerce hero banner with product showcase',
      status: 'completed',
      createdAt: new Date(),
      model: 'dall-e-3'
    },
    {
      id: '2',
      type: 'video',
      prompt: 'SaaS feature demonstration with screen recording',
      status: 'processing',
      createdAt: new Date(),
      model: 'runway'
    }
  ])

  return (
    <div className="generations-list">
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Generated Creatives</h2>
          <button className="button button-primary">New Generation</button>
        </div>

        <div className="generations-grid">
          {generations.map(generation => (
            <div key={generation.id} className="generation-card card">
              <div className="generation-preview">
                <span className="generation-type-icon">
                  {generation.type === 'image' ? '🖼️' : generation.type === 'video' ? '🎬' : '🎯'}
                </span>
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
      </div>
    </div>
  )
}

export default GenerationsList