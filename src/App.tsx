import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import BrandProfile from './components/brand/BrandProfile'
import PersonaList from './components/personas/PersonaList'
import CompetitorAnalysis from './components/competitors/CompetitorAnalysis'
import InspirationLibrary from './components/inspiration/InspirationLibrary'
import GenerationsList from './components/generations/GenerationsList'
import AIModels from './components/models/AIModels'
import CampaignsList from './components/campaigns/CampaignsList'
import Settings from './components/settings/Settings'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/brand" replace />} />
          <Route path="brand" element={<BrandProfile />} />
          <Route path="personas" element={<PersonaList />} />
          <Route path="competitors" element={<CompetitorAnalysis />} />
          <Route path="inspiration" element={<InspirationLibrary />} />
          <Route path="generations" element={<GenerationsList />} />
          <Route path="models" element={<AIModels />} />
          <Route path="campaigns" element={<CampaignsList />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App