import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import BrandProfile from './components/brand/BrandProfile'
import TargetAudienceList from './components/audiences/TargetAudienceList'
import TargetAudienceForm from './components/audiences/TargetAudienceForm'
import CompetitorAnalysis from './components/competitors/CompetitorAnalysis'
import CompetitorForm from './components/competitors/CompetitorForm'
import InspirationLibrary from './components/inspiration/InspirationLibrary'
import AdLibraryBrowser from './components/inspiration/AdLibraryBrowser'
import ProductsServices from './components/products/ProductsServices'
import ProductServiceForm from './components/products/ProductServiceForm'
import CampaignsList from './components/campaigns/CampaignsList'
import CampaignForm from './components/campaigns/CampaignForm'
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

            {/* Ad Library Browser (full-page) */}
            <Route path="ad-library" element={<AdLibraryBrowser />} />
            <Route path="ad-library/:slug/:shortId" element={<AdLibraryBrowser />} />

            {/* Brand-scoped routes with slug and short ID */}
            <Route path="brand/:slug/:shortId" element={<BrandProfile />} />
            <Route path="audiences/:slug/:shortId" element={<TargetAudienceList />} />
            <Route path="audiences/:slug/:shortId/new" element={<TargetAudienceForm />} />
            <Route path="competitors/:slug/:shortId" element={<CompetitorAnalysis />} />
            <Route path="competitors/:slug/:shortId/new" element={<CompetitorForm />} />
            <Route path="inspiration/:slug/:shortId" element={<InspirationLibrary />} />
            <Route path="products/:slug/:shortId" element={<ProductsServices />} />
            <Route path="products/:slug/:shortId/new" element={<ProductServiceForm />} />
            <Route path="campaigns/:slug/:shortId" element={<CampaignsList />} />
            <Route path="campaigns/:slug/:shortId/new" element={<CampaignForm />} />
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