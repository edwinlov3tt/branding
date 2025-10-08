import { NavLink } from 'react-router-dom'
import {
  Building2,
  Users,
  Swords,
  Lightbulb,
  Package,
  Target,
  Palette,
  Settings
} from 'lucide-react'
import BrandProfile from './BrandProfile'
import { useBrand } from '@/contexts/BrandContext'
import { generateBrandUrl } from '@/utils/brandIdentifiers'
import './Sidebar.css'

const Sidebar = () => {
  const { currentBrand } = useBrand()

  // Generate brand-scoped URLs if a brand is selected
  const getBrandPath = (basePath: string) => {
    if (currentBrand) {
      return generateBrandUrl(currentBrand, basePath)
    }
    // Fallback to root paths if no brand selected
    return `/${basePath}`
  }

  const navItems = [
    { path: 'brand', label: 'Brand Profile', icon: Building2 },
    { path: 'products', label: 'Products & Services', icon: Package },
    { path: 'competitors', label: 'Competitor Analysis', icon: Swords },
    { path: 'inspiration', label: 'Inspiration Library', icon: Lightbulb },
    { path: 'audiences', label: 'Target Audiences', icon: Users },
    { path: 'campaigns', label: 'Campaigns', icon: Target },
    { path: 'generations', label: 'Generated Creatives', icon: Palette },
    { path: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <aside className="sidebar">
      <div className="logo">Branding AI</div>
      <nav className="nav">
        {currentBrand ? (
          navItems.map((item, index) => (
            <NavLink
              key={item.path}
              to={getBrandPath(item.path)}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${index === navItems.length - 1 ? 'last-nav-item' : ''}`}
            >
              <item.icon className="nav-icon" size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))
        ) : (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
            Select or create a brand to access features
          </div>
        )}
      </nav>
      <BrandProfile />
    </aside>
  )
}

export default Sidebar