import { useLocation } from 'react-router-dom'
import './Header.css'

const Header = () => {
  const location = useLocation()

  const getPageTitle = () => {
    const path = location.pathname.substring(1)
    const titles: Record<string, string> = {
      brand: 'Branding AI',
      personas: 'Customer Personas',
      competitors: 'Competitor Analysis',
      inspiration: 'Inspiration Library',
      generations: 'Generated Creatives',
      models: 'AI Models & Actors',
      settings: 'Settings',
    }
    return titles[path] || 'Branding AI'
  }

  return (
    <header className="header">
      <div className="header-content">
        <div className="brand-header">
          <h1 className="page-title">{getPageTitle()}</h1>
          <p className="tagline">AI-Powered brand details and assets from just a link</p>
        </div>
      </div>
    </header>
  )
}

export default Header