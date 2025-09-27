import { useLocation } from 'react-router-dom'
import './Header.css'

const Header = () => {
  const location = useLocation()

  const getPageTitle = () => {
    const path = location.pathname.substring(1)
    const titles: Record<string, string> = {
      brand: 'Brand Profile',
      personas: 'Customer Personas',
      competitors: 'Competitor Analysis',
      inspiration: 'Inspiration Library',
      generations: 'Generated Creatives',
      models: 'AI Models & Actors',
      settings: 'Settings',
    }
    return titles[path] || 'Brand Intelligence Platform'
  }

  return (
    <header className="header">
      <h1 className="page-title">{getPageTitle()}</h1>
      <div className="header-actions">
        <button className="button button-secondary">Export</button>
        <button className="button button-primary">Generate</button>
      </div>
    </header>
  )
}

export default Header