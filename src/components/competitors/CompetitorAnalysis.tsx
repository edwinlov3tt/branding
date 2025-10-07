import { useState } from 'react'
import type { Competitor } from '@/types'
import './CompetitorAnalysis.css'

const CompetitorAnalysis = () => {
  const [competitors] = useState<Competitor[]>([])

  return (
    <div className="competitor-analysis">
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Competitor Analysis</h2>
          <button className="button button-primary">Add Competitor</button>
        </div>

        {competitors.length > 0 ? (
          <div className="competitors-grid">
            {competitors.map(competitor => (
              <div key={competitor.id} className="card competitor-card">
                <h3 className="competitor-name">{competitor.name}</h3>
                <p className="competitor-website">{competitor.website}</p>
                <p className="competitor-description">{competitor.description}</p>

                <div className="competitor-details">
                  <div>
                    <h4>Strengths</h4>
                    <ul>
                      {competitor.strengths.map((strength, i) => (
                        <li key={i}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4>Weaknesses</h4>
                    <ul>
                      {competitor.weaknesses.map((weakness, i) => (
                        <li key={i}>{weakness}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="competitor-footer">
                  <span className="status-badge status-warning">{competitor.marketPosition}</span>
                  <span className="competitor-pricing">{competitor.pricing}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p className="empty-text">No competitors added yet</p>
            <p className="empty-subtext">Click "Add Competitor" above to start tracking your competition and analyze their market positioning.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CompetitorAnalysis