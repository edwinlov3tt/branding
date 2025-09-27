import { useState } from 'react'
import { Layout } from 'lucide-react'
import type { Template } from '@/types'
import './InspirationLibrary.css'

const InspirationLibrary = () => {
  const [templates] = useState<Template[]>([
    {
      id: '1',
      name: 'E-commerce Hero',
      category: 'Landing Page',
      description: 'High-converting hero section for e-commerce',
      thumbnail: '',
      isPremium: false
    },
    {
      id: '2',
      name: 'SaaS Feature',
      category: 'Product Showcase',
      description: 'Feature highlight for SaaS products',
      thumbnail: '',
      isPremium: true
    },
    {
      id: '3',
      name: 'Social Proof',
      category: 'Testimonial',
      description: 'Customer testimonial showcase',
      thumbnail: '',
      isPremium: false
    }
  ])

  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = ['all', 'Landing Page', 'Product Showcase', 'Testimonial', 'Banner', 'Social Media']

  const filteredTemplates = selectedCategory === 'all'
    ? templates
    : templates.filter(t => t.category === selectedCategory)

  return (
    <div className="inspiration-library">
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Inspiration Library</h2>
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
      </div>
    </div>
  )
}

export default InspirationLibrary