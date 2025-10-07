import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import BrandProfile from './components/brand/BrandProfile'
import TargetAudienceList from './components/audiences/TargetAudienceList'
import CompetitorAnalysis from './components/competitors/CompetitorAnalysis'
import InspirationLibrary from './components/inspiration/InspirationLibrary'
import ProductsServices from './components/products/ProductsServices'
import CampaignsList from './components/campaigns/CampaignsList'
import GenerationsList from './components/generations/GenerationsList'
import Settings from './components/settings/Settings'
import AllBrands from './components/brands/AllBrands'
import BrandOnboarding from './components/onboard/BrandOnboarding'
import { BrandProvider } from './contexts/BrandContext'

function App() {
  return (
    <Router>
      <BrandProvider>
        <Routes>
          {/* Onboarding route (outside layout) */}
          <Route path="/onboard/new-brand" element={<BrandOnboarding />} />

          <Route path="/" element={<Layout />}>
            {/* Root redirect to brands page */}
            <Route index element={<Navigate to="/brands" replace />} />

            {/* All Brands page (no brand selected) */}
            <Route path="brands" element={<AllBrands />} />

            {/* Brand-scoped routes with slug and short ID */}
            <Route path="brand/:slug/:shortId" element={<BrandProfile />} />
            <Route path="audiences/:slug/:shortId" element={<TargetAudienceList />} />
            <Route path="competitors/:slug/:shortId" element={<CompetitorAnalysis />} />
            <Route path="inspiration/:slug/:shortId" element={<InspirationLibrary />} />
            <Route path="products/:slug/:shortId" element={<ProductsServices />} />
            <Route path="campaigns/:slug/:shortId" element={<CampaignsList />} />
            <Route path="generations/:slug/:shortId" element={<GenerationsList />} />
            <Route path="settings/:slug/:shortId" element={<Settings />} />

            {/* Legacy routes (redirect to brands page) */}
            <Route path="brand" element={<Navigate to="/brands" replace />} />
            <Route path="audiences" element={<Navigate to="/brands" replace />} />
            <Route path="competitors" element={<Navigate to="/brands" replace />} />
            <Route path="inspiration" element={<Navigate to="/brands" replace />} />
            <Route path="products" element={<Navigate to="/brands" replace />} />
            <Route path="campaigns" element={<Navigate to="/brands" replace />} />
            <Route path="generations" element={<Navigate to="/brands" replace />} />
            <Route path="settings" element={<Navigate to="/brands" replace />} />
          </Route>
        </Routes>
      </BrandProvider>
    </Router>
  )
}

export default App