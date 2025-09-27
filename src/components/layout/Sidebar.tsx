import { NavLink } from 'react-router-dom'
import {
  Building2,
  Users,
  Swords,
  Lightbulb,
  Palette,
  Bot,
  Settings
} from 'lucide-react'
import './Sidebar.css'

const Sidebar = () => {
  const navItems = [
    { path: '/brand', label: 'Brand Profile', icon: Building2 },
    { path: '/personas', label: 'Customer Personas', icon: Users },
    { path: '/competitors', label: 'Competitor Analysis', icon: Swords },
    { path: '/inspiration', label: 'Inspiration Library', icon: Lightbulb },
    { path: '/generations', label: 'Generated Creatives', icon: Palette },
    { path: '/models', label: 'AI Models & Actors', icon: Bot },
    { path: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <aside className="sidebar">
      <div className="logo">Creative AI</div>
      <nav className="nav">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon className="nav-icon" size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar