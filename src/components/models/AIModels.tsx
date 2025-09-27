import { useState } from 'react'
import { Bot } from 'lucide-react'
import type { AIModel } from '@/types'
import './AIModels.css'

const AIModels = () => {
  const [models] = useState<AIModel[]>([
    {
      id: '1',
      type: 'avatar',
      name: 'Professional Avatar',
      description: 'Business-focused digital avatar for corporate presentations',
      voice: 'professional',
      status: 'ready'
    },
    {
      id: '2',
      type: 'spokesperson',
      name: 'Friendly Spokesperson',
      description: 'Warm and approachable spokesperson for customer-facing content',
      voice: 'friendly',
      status: 'creating'
    }
  ])

  return (
    <div className="ai-models">
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">AI Models & Actors</h2>
          <button className="button button-primary">Create Model</button>
        </div>

        <div className="models-grid">
          {models.map(model => (
            <div key={model.id} className="model-card card">
              <div className="model-avatar">
                <Bot size={40} />
              </div>
              <h3 className="model-name">{model.name}</h3>
              <p className="model-type">{model.type.charAt(0).toUpperCase() + model.type.slice(1)}</p>
              <p className="model-description">{model.description}</p>
              <div className="model-meta">
                <span className={`status-badge ${model.status === 'ready' ? 'status-success' : 'status-warning'}`}>
                  {model.status === 'ready' ? 'Ready' : 'Creating'}
                </span>
                {model.voice && (
                  <span className="model-voice">Voice: {model.voice}</span>
                )}
              </div>
              <button className="button button-primary model-action">
                Generate Video
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AIModels