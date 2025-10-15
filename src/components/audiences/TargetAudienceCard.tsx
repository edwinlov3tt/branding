import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { TargetAudience } from '@/types'
import axios from 'axios'
import './TargetAudienceCard.css'

interface Props {
  audience: TargetAudience
  onDelete?: () => void
}

const TargetAudienceCard = ({ audience, onDelete }: Props) => {
  const navigate = useNavigate()
  const { slug, shortId } = useParams()
  const [isDeleting, setIsDeleting] = useState(false)

  const interests = Array.isArray(audience.interests) ? audience.interests : []
  const painPoints = Array.isArray(audience.pain_points) ? audience.pain_points : []
  const goals = Array.isArray(audience.goals) ? audience.goals : []

  const handleEdit = () => {
    navigate(`/audiences/${slug}/${shortId}/edit/${audience.id}`)
  }

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${audience.name}"? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/api/target-audiences?id=${audience.id}`
      )

      if (response.data.success) {
        if (onDelete) {
          onDelete()
        }
      }
    } catch (error) {
      console.error('Failed to delete target audience:', error)
      alert('Failed to delete target audience. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="audience-card card">
      <div className="audience-header">
        <div className="audience-header-content">
          <h3 className="audience-name">{audience.name}</h3>
          {audience.demographics && (
            <p className="audience-subtitle">{audience.demographics}</p>
          )}
        </div>
        <div className="audience-actions">
          <button
            className="action-button edit-button"
            onClick={handleEdit}
            title="Edit audience"
            aria-label="Edit audience"
          >
            Edit
          </button>
          <button
            className="action-button delete-button"
            onClick={handleDelete}
            disabled={isDeleting}
            title="Delete audience"
            aria-label="Delete audience"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      {audience.description && (
        <div className="audience-section">
          <h4 className="audience-section-title">Business Context:</h4>
          <p className="audience-description">{audience.description}</p>
        </div>
      )}

      {painPoints.length > 0 && (
        <div className="audience-section">
          <h4 className="audience-section-title">Key Pain Points:</h4>
          <ul className="audience-list">
            {painPoints.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
        </div>
      )}

      {interests.length > 0 && (
        <div className="audience-section">
          <h4 className="audience-section-title">Behaviors:</h4>
          <ul className="audience-list">
            {interests.map((interest, index) => (
              <li key={index}>{interest}</li>
            ))}
          </ul>
        </div>
      )}

      {goals.length > 0 && (
        <div className="audience-section">
          <h4 className="audience-section-title">Goals:</h4>
          <ul className="audience-list goal-list">
            {goals.map((goal, index) => (
              <li key={index}>{goal}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default TargetAudienceCard
