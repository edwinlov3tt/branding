import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Edit2, Trash2, ChevronDown } from 'lucide-react'
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
  const [overviewOpen, setOverviewOpen] = useState(false)
  const [behaviorsOpen, setBehaviorsOpen] = useState(false)
  const [goalsOpen, setGoalsOpen] = useState(false)

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

  // Parse demographics into chips
  const parseDemographics = () => {
    if (!audience.demographics) return { age: '', gender: '', location: '', income: '' }

    const demo = audience.demographics
    const parts: { age?: string; gender?: string; location?: string; income?: string } = {}

    // Try to extract age (e.g., "Age: 40-60" or just "40-60")
    const ageMatch = demo.match(/(?:Age:\s*)?(\d+[-–]\d+)/i)
    if (ageMatch) parts.age = ageMatch[1]

    // Try to extract gender
    const genderMatch = demo.match(/Gender:\s*([^|,\n]+)/i)
    if (genderMatch) parts.gender = genderMatch[1].trim()
    else if (demo.toLowerCase().includes('all')) parts.gender = 'All'

    // Try to extract location
    const locationMatch = demo.match(/Location:\s*([^|,\n]+)/i)
    if (locationMatch) parts.location = locationMatch[1].trim()

    // Try to extract income
    const incomeMatch = demo.match(/Income:\s*\$?([^|,\n]+)/i)
    if (incomeMatch) parts.income = incomeMatch[1].trim()

    return parts
  }

  const demoChips = parseDemographics()

  return (
    <article className="audience-card">
      <div className="card-header">
        <div className="title-wrap">
          <h2 className="card-title">{audience.name}</h2>
        </div>
        <div className="card-actions">
          <button className="icon-btn" onClick={handleEdit} title="Edit" aria-label="Edit audience">
            <Edit2 size={16} />
          </button>
          <button
            className="icon-btn"
            onClick={handleDelete}
            disabled={isDeleting}
            title="Delete"
            aria-label="Delete audience"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Demographics summary chips */}
      {(demoChips.age || demoChips.gender || demoChips.location || demoChips.income) && (
        <div className="summary-row">
          {demoChips.age && <span className="meta-chip">{demoChips.age}</span>}
          {demoChips.gender && <span className="meta-chip">{demoChips.gender}</span>}
          {demoChips.location && <span className="meta-chip">{demoChips.location}</span>}
          {demoChips.income && <span className="meta-chip">${demoChips.income}</span>}
        </div>
      )}

      {/* Buying Behavior - as description before overview */}
      {audience.description && (
        <p className="buying-behavior">{audience.description}</p>
      )}

      {/* Overview - collapsible */}
      {audience.demographics && (
        <div className="details-section">
          <button
            className="details-summary"
            onClick={() => setOverviewOpen(!overviewOpen)}
            aria-expanded={overviewOpen}
          >
            <span>Overview</span>
            <ChevronDown size={16} className={`chevron ${overviewOpen ? 'open' : ''}`} />
          </button>
          {overviewOpen && (
            <div className="details-content">
              <p className="demographics-text">{audience.demographics}</p>
            </div>
          )}
        </div>
      )}

      {/* Behaviors - collapsible with chips */}
      {interests.length > 0 && (
        <div className="details-section">
          <button
            className="details-summary"
            onClick={() => setBehaviorsOpen(!behaviorsOpen)}
            aria-expanded={behaviorsOpen}
          >
            <span>Behaviors</span>
            <span className="count">{interests.length}</span>
            <ChevronDown size={16} className={`chevron ${behaviorsOpen ? 'open' : ''}`} />
          </button>
          {behaviorsOpen && (
            <div className="details-content">
              <div className="chips">
                {interests.map((interest, index) => (
                  <span key={index} className="chip">{interest}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Goals - collapsible with chips */}
      {goals.length > 0 && (
        <div className="details-section">
          <button
            className="details-summary"
            onClick={() => setGoalsOpen(!goalsOpen)}
            aria-expanded={goalsOpen}
          >
            <span>Goals</span>
            <span className="count">{goals.length}</span>
            <ChevronDown size={16} className={`chevron ${goalsOpen ? 'open' : ''}`} />
          </button>
          {goalsOpen && (
            <div className="details-content">
              <div className="chips">
                {goals.map((goal, index) => (
                  <span key={index} className="chip dot">{goal}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  )
}

export default TargetAudienceCard
