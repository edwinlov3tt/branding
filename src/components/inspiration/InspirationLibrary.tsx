import { useState } from 'react'
import { Layout, Search } from 'lucide-react'
import type { Template } from '@/types'
import './InspirationLibrary.css'

const InspirationLibrary = () => {
  const [templates] = useState<Template[]>([])

  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const categories = ['all', 'Social Media', 'Banners', 'Videos', 'Emails']

  const filteredTemplates = templates.filter(t => {
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="inspiration-library">
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Inspiration Library</h2>
          <button className="button button-primary">Add Inspiration</button>
        </div>

        <div className="filters-container">
          <div className="search-bar">
            <Search size={18} />
            <input
              type="text"
              className="search-input"
              placeholder="Search inspiration..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="category-filters">
            {categories.map(category => (
              <button
                key={category}
                className={`filter-button ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {filteredTemplates.length > 0 ? (
          <div className="templates-grid">
            {filteredTemplates.map(template => (
              <div key={template.id} className="template-card card">
                <div className="template-thumbnail">
                  <Layout size={48} />
                </div>
                <h3 className="template-name">{template.name}</h3>
                <p className="template-category">{template.category}</p>
                <p className="template-description">{template.description}</p>
                <div className="template-footer">
                  {template.isPremium && (
                    <span className="status-badge status-warning">Premium</span>
                  )}
                  <button className="button button-primary">Use Template</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p className="empty-text">No inspiration templates added yet</p>
            <p className="empty-subtext">Click "Add Inspiration" above to save creative templates and reference materials for future campaigns.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default InspirationLibrary