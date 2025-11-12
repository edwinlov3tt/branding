import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import BrandExtraction from './steps/BrandExtraction';
import ConsolidatedLoadingScreen from './steps/ConsolidatedLoadingScreen';
import AssetReview, { type RemovedAssets } from './steps/AssetReview';
import AudienceSelection from './steps/AudienceSelection';
import ProductSelection from './steps/ProductSelection';
import BrandDetails, { type BrandDetailsData } from './steps/BrandDetails';
import type { BrandExtractResponse, TargetAudience, OnboardingResults, DiscoverPagesResponse } from '@/types';
import {
  createBrand,
  saveBrandAssets
} from '@/services/api/brandService';
import { apiClient } from '@/services/config/apiConfig';
import { useBrand } from '@/contexts/BrandContext';
import { generateBrandUrl } from '@/utils/brandIdentifiers';
import './BrandOnboarding.css';

type OnboardingStep = 1 | 'loading' | 2 | 3 | 4 | 5;

interface DiscoveredProduct {
  title: string;
  url: string;
  excerpt: string;
  type: 'main' | 'discovered' | 'suggested';
}

const BrandOnboarding = () => {
  const navigate = useNavigate();
  const { setCurrentBrand } = useBrand();

  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [submittedUrl, setSubmittedUrl] = useState<string>('');
  const [extractedData, setExtractedData] = useState<BrandExtractResponse | null>(null);
  const [removedAssets, setRemovedAssets] = useState<RemovedAssets>({
    colors: [],
    logos: [],
    fonts: []
  });
  const [manualBrandData, setManualBrandData] = useState<{
    name: string;
    website: string;
    description: string;
  } | null>(null);
  const [brandProfileData, setBrandProfileData] = useState<{
    name: string;
    description: string;
    tagline?: string;
  } | null>(null);
  const [brandProfileResponse, setBrandProfileResponse] = useState<any>(null);
  const [selectedAudiences, setSelectedAudiences] = useState<Array<Omit<TargetAudience, 'id' | 'brand_id' | 'created_at' | 'updated_at'>>>([]);
  const [discoveredProducts, setDiscoveredProducts] = useState<DiscoveredProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<DiscoveredProduct[]>([]);
  const [createdBrandId, setCreatedBrandId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Step 1: URL submitted - show loading screen
  const handleUrlSubmit = (url: string) => {
    console.log('[Onboarding] URL submitted, showing loading screen:', url);
    setSubmittedUrl(url);
    setCurrentStep('loading');
  };

  // Loading screen completed - process consolidated results
  const handleLoadingComplete = (results: OnboardingResults) => {
    console.log('[Onboarding] Loading complete, processing results:', results);

    // Store extraction data (critical - always present)
    if (results.extraction) {
      setExtractedData(results.extraction);
    }

    // Store brand profile data (if available)
    if (results.brandProfile && results.brandProfile.data?.brandProfile) {
      const profile = results.brandProfile.data.brandProfile;

      console.log('[Onboarding] ✅ Brand profile loaded:', {
        name: profile.brand?.name,
        tagline: profile.brand?.tagline
      });

      // Store full brand profile data for Step 3 (Audiences) and Step 5 (Brand Details)
      setBrandProfileResponse(results.brandProfile.data);

      // Store name/tagline/story for auto-fill in Step 5
      setBrandProfileData({
        name: profile.brand?.name || results.extraction?.brand.metadata?.title || '',
        description: profile.brand?.story || results.extraction?.brand.metadata?.description || '',
        tagline: profile.brand?.tagline || ''
      });
    } else {
      // Fallback to metadata if Brand Profiler failed
      console.warn('[Onboarding] ⚠️ Brand Profiler failed, using metadata');
      setBrandProfileData({
        name: results.extraction?.brand.metadata?.title || '',
        description: results.extraction?.brand.metadata?.description || '',
        tagline: ''
      });
    }

    // Store discovered products (if available)
    if (results.pageDiscovery && results.pageDiscovery.success && results.pageDiscovery.pages) {
      // Filter for service/product pages
      const productPages = results.pageDiscovery.pages.filter((page: any) => {
        const category = page.category?.toLowerCase() || '';
        const url = page.url.toLowerCase();
        const title = page.title?.toLowerCase() || '';

        // Look for service, product, or offerings pages
        return (
          category.includes('service') ||
          category.includes('product') ||
          category.includes('offering') ||
          url.includes('/service') ||
          url.includes('/product') ||
          url.includes('/offering') ||
          title.includes('service') ||
          title.includes('product')
        );
      });

      // Convert to DiscoveredProduct format
      const products: DiscoveredProduct[] = productPages.map((page: any) => ({
        title: page.title || 'Untitled Page',
        url: page.url,
        excerpt: page.textContent?.substring(0, 200) || '',
        type: 'discovered' as const
      }));

      setDiscoveredProducts(products);
      console.log(`[Onboarding] ✅ Discovered ${products.length} product/service pages`);
    } else {
      console.warn('[Onboarding] ⚠️ Page discovery failed, no products found');
    }

    // Move to Step 2 (Asset Review)
    setCurrentStep(2);
  };

  // Handle loading error
  const handleLoadingError = (error: string) => {
    console.error('[Onboarding] Loading failed:', error);
    alert(error);
    setCurrentStep(1); // Go back to URL input
  };

  const handleManualSubmit = (name: string, website: string, description: string) => {
    setManualBrandData({ name, website, description });
    setCurrentStep(5); // Skip asset review, audience selection, and product selection for manual
  };

  // Step 2: Asset review
  const handleAssetReviewContinue = (assets: RemovedAssets) => {
    setRemovedAssets(assets);
    setCurrentStep(3); // Go to Audience Selection
  };

  // Step 3: Audience selection
  const handleAudienceContinue = async (audiences: Array<Omit<TargetAudience, 'id' | 'brand_id' | 'created_at' | 'updated_at'>>) => {
    setSelectedAudiences(audiences);
    setCurrentStep(4); // Go to Product Selection
  };

  const handleAudienceSkip = () => {
    setSelectedAudiences([]);
    setCurrentStep(4); // Go to Product Selection
  };

  // Step 4: Product selection
  const handleProductContinue = async (products: DiscoveredProduct[]) => {
    setSelectedProducts(products);
    setCurrentStep(5); // Go to Brand Details
  };

  const handleProductSkip = () => {
    setSelectedProducts([]);
    setCurrentStep(5); // Go to Brand Details
  };

  // Step 5: Final details and save
  const handleSaveBrand = async (details: BrandDetailsData) => {
    setIsSaving(true);

    const warnings: string[] = [];

    try {
      // ============================================
      // STEP 1: Create Brand (CRITICAL - must succeed)
      // ============================================
      let brandData: any = {
        name: details.name,
        website: details.website,
        industry: details.industry
      };

      // Add extracted data if available
      if (extractedData) {
        // Get primary color from palette (not removed)
        const visibleColors = extractedData.brand.colors.palette.filter(
          c => c && !removedAssets.colors.includes(c.hex)
        );
        const primaryColor = visibleColors[0]?.hex;

        // Get primary logo (not removed)
        const visibleLogos = [
          extractedData.brand.logos.primary,
          ...(extractedData.brand.logos.alternates || [])
        ]
          .filter(logo => logo !== null && logo !== undefined)
          .filter(logo => !removedAssets.logos.includes(logo.src));
        const primaryLogo = visibleLogos[0]?.src;

        // Get favicon URL if available
        const faviconUrl = extractedData.brand.logos.favicons?.[0]?.src;

        brandData = {
          ...brandData,
          primary_color: primaryColor,
          logo_url: primaryLogo,
          favicon_url: faviconUrl
        };
      }

      console.log('[Onboarding] Step 1: Creating brand in database...');
      const response = await createBrand(brandData);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create brand in database');
      }

      const brandId = response.data.id;
      const brandWebsite = response.data.website || details.website;
      console.log(`[Onboarding] ✅ Brand created successfully: ${brandId}`);

      // Map the response to Brand type
      const newBrand = {
        id: response.data.id,
        name: response.data.name,
        website: brandWebsite,
        logo: response.data.logo_url,
        primaryColor: response.data.primary_color,
        slug: response.data.slug,
        shortId: response.data.short_id,
        industry: response.data.industry,
        faviconUrl: response.data.favicon_url,
        createdAt: response.data.created_at,
        lastModified: response.data.updated_at,
        audiences: [],
        products: [],
        campaigns: [],
        competitors: [],
        templates: [],
        generations: []
      };

      // ============================================
      // STEP 2: Save Brand Assets (NON-CRITICAL - can fail)
      // ============================================
      if (extractedData) {
        try {
          console.log('[Onboarding] Step 2: Saving brand assets...');
          await saveBrandAssets(brandId, extractedData);
          console.log('[Onboarding] ✅ Brand assets saved successfully');
        } catch (error: any) {
          console.error('[Onboarding] ⚠️ Failed to save brand assets:', error);
          warnings.push('Brand assets could not be saved. You can re-extract them later.');
        }
      }

      // ============================================
      // STEP 3: Save Brand Profile (already generated in Step 1)
      // ============================================
      if (brandWebsite && brandProfileResponse) {
        // We already have brand profile data from Step 1, just save it to the database
        try {
          console.log('[Onboarding] Step 3: Saving brand profile to database...');

          // Save the brand profile with updated tagline from user input
          const profile = brandProfileResponse.brandProfile;

          await apiClient.post('/api/brand-profile', {
            brand_id: brandId,
            brand_name: profile.brand?.name || details.name,
            tagline: details.tagline || profile.brand?.tagline, // Use user's tagline if provided
            story: profile.brand?.story,
            mission: profile.brand?.mission,
            positioning: profile.brand?.positioning,
            value_props: profile.brand?.valueProps,
            personality: profile.voice?.personality,
            tone_sliders: profile.voice?.toneSliders,
            lexicon_preferred: profile.voice?.lexicon?.preferred,
            lexicon_avoid: profile.voice?.lexicon?.avoid,
            primary_audience: profile.audience?.primary,
            audience_needs: profile.audience?.needs,
            audience_pain_points: profile.audience?.painPoints,
            sentence_length: profile.writingGuide?.sentenceLength,
            paragraph_style: profile.writingGuide?.paragraphStyle,
            formatting_guidelines: profile.writingGuide?.formatting,
            writing_avoid: profile.writingGuide?.avoid,
            pages_crawled: brandProfileResponse.insights?.pagesCrawled,
            reviews_analyzed: brandProfileResponse.insights?.reviewsAnalyzed,
            review_sources: brandProfileResponse.insights?.sources
          });

          console.log('[Onboarding] ✅ Brand profile saved successfully');
        } catch (error: any) {
          console.error('[Onboarding] ⚠️ Failed to save brand profile:', error);

          // Provide helpful error messages based on error type
          if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
            warnings.push('Brand profile generation timed out (this can take 60-100 seconds). You can generate it later from the Brand Profile tab.');
          } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
            warnings.push('Brand Profiler Worker is currently unavailable. You can generate the profile later.');
          } else if (error.response?.status === 404) {
            warnings.push('Brand Profiler Worker not found. Please check worker deployment.');
          } else {
            warnings.push(`Brand profile generation failed: ${error.message || 'Unknown error'}. You can try again later from the Brand Profile tab.`);
          }
        }
      }

      // ============================================
      // STEP 4: Save Brand Images (NON-CRITICAL - can fail)
      // ============================================
      if (extractedData?.brand?.url) {
        try {
          console.log('[Onboarding] Step 4: Saving brand images cache...');
          // Note: This will only save if images were already discovered during extraction
          // If not, images will be discovered on first visit to Brand Profile page
          console.log('[Onboarding] ℹ️ Skipping brand images - will be discovered on-demand');
        } catch (error: any) {
          console.error('[Onboarding] ⚠️ Failed to save brand images:', error);
          // Don't add warning - images will load on-demand anyway
        }
      }

      // ============================================
      // STEP 5: Save Selected Products (NON-CRITICAL - can fail)
      // ============================================
      if (selectedProducts.length > 0) {
        try {
          console.log(`[Onboarding] Step 5: Saving ${selectedProducts.length} selected products...`);

          for (const product of selectedProducts) {
            await apiClient.post('/api/products-services', {
              brand_id: brandId,
              name: product.title,
              category: 'product', // Default to 'product', can be changed later
              description: product.excerpt,
              cturl: product.url
            });
          }

          console.log('[Onboarding] ✅ Products/Services saved successfully');
        } catch (error: any) {
          console.error('[Onboarding] ⚠️ Failed to save products/services:', error);
          warnings.push('Products/Services could not be saved. You can add them later from the Products page.');
        }
      }

      // ============================================
      // STEP 6: Save Selected Audiences (NON-CRITICAL - can fail)
      // ============================================
      if (selectedAudiences.length > 0) {
        try {
          console.log(`[Onboarding] Step 6: Saving ${selectedAudiences.length} selected audiences...`);

          for (const audience of selectedAudiences) {
            await apiClient.post('/api/target-audiences', {
              brand_id: brandId,
              name: audience.name,
              description: audience.description,
              demographics: audience.demographics,
              interests: audience.interests,
              pain_points: audience.pain_points,
              goals: audience.goals,
              budget_range: audience.budget_range,
              channels: audience.channels
            });
          }

          console.log('[Onboarding] ✅ Target audiences saved successfully');
        } catch (error: any) {
          console.error('[Onboarding] ⚠️ Failed to save target audiences:', error);
          warnings.push('Target audiences could not be saved. You can add them later from the Audiences page.');
        }
      }

      // ============================================
      // STEP 7: Complete Onboarding
      // ============================================
      console.log('[Onboarding] ✅ Onboarding complete!');

      // Set as current brand
      setCurrentBrand(newBrand);

      // Navigate to the brand profile immediately (don't block on warnings)
      navigate(generateBrandUrl(newBrand, 'brand'));

      // Show warnings in console only (don't interrupt user flow with alerts)
      if (warnings.length > 0) {
        console.warn('[Onboarding] ⚠️ Non-critical warnings during brand creation:');
        warnings.forEach((warning, i) => console.warn(`  ${i + 1}. ${warning}`));
        console.warn('[Onboarding] These features can be accessed later from the brand page.');
      }
    } catch (error: any) {
      console.error('[Onboarding] ❌ Critical error during onboarding:', error);

      // Provide specific error messages based on error type
      let errorMessage = 'Failed to create brand. Please try again.';

      if (error.message?.includes('database')) {
        errorMessage = 'Database error: Unable to save brand. Please check your connection and try again.';
      } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        errorMessage = 'Network error: Unable to connect to the server. Please check your internet connection and try again.';
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid brand data: ' + (error.response.data?.message || 'Please check your inputs and try again.');
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error: Something went wrong on our end. Please try again in a moment.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // Navigation
  const handleBack = () => {
    if (currentStep === 'loading') {
      // Can't go back during loading
      return;
    } else if (typeof currentStep === 'number' && currentStep > 1) {
      setCurrentStep((currentStep - 1) as OnboardingStep);
    } else {
      navigate('/brands');
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Extract Brand Assets';
      case 2: return 'Review Assets';
      case 3: return 'Target Audiences';
      case 4: return 'Products & Services';
      case 5: return 'Brand Details';
      default: return '';
    }
  };

  return (
    <div className="brand-onboarding">
      {currentStep !== 'loading' && (
        <div className="onboarding-header">
          <button className="back-button" onClick={handleBack}>
            <ArrowLeft size={20} />
            {currentStep === 1 ? 'Back to Brands' : 'Back'}
          </button>

          <div className="onboarding-progress">
            <div className="progress-steps">
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className={`progress-step ${currentStep >= step ? 'active' : ''} ${currentStep === step ? 'current' : ''}`}
                >
                  <div className="progress-circle">{step}</div>
                  {step < 5 && <div className="progress-line" />}
                </div>
              ))}
            </div>
            <div className="progress-title">{getStepTitle()}</div>
          </div>
        </div>
      )}

      <div className="onboarding-content">
        {currentStep === 1 && (
          <BrandExtraction
            onUrlSubmit={handleUrlSubmit}
            onManualSubmit={handleManualSubmit}
            onBack={handleBack}
          />
        )}

        {currentStep === 'loading' && (
          <ConsolidatedLoadingScreen
            url={submittedUrl}
            onComplete={handleLoadingComplete}
            onError={handleLoadingError}
          />
        )}

        {currentStep === 2 && extractedData && (
          <AssetReview
            extractedData={extractedData}
            onContinue={handleAssetReviewContinue}
            onBack={handleBack}
          />
        )}

        {currentStep === 3 && (
          <AudienceSelection
            brandProfile={brandProfileResponse?.brandProfile}
            brandMetadata={{
              name: manualBrandData?.name || brandProfileData?.name || extractedData?.brand.metadata?.title || '',
              industry: '', // Will be filled in Step 5
              description: manualBrandData?.description || brandProfileData?.description || extractedData?.brand.metadata?.description || '',
              website: manualBrandData?.website || extractedData?.brand.url || ''
            }}
            onContinue={handleAudienceContinue}
            onSkip={handleAudienceSkip}
            onBack={handleBack}
          />
        )}

        {currentStep === 4 && (
          <ProductSelection
            discoveredProducts={discoveredProducts}
            onContinue={handleProductContinue}
            onSkip={handleProductSkip}
            onBack={handleBack}
          />
        )}

        {currentStep === 5 && (
          <BrandDetails
            initialName={manualBrandData?.name || brandProfileData?.name || ''}
            initialTagline={brandProfileData?.tagline || ''}
            initialWebsite={manualBrandData?.website || extractedData?.brand.url || ''}
            initialDescription={manualBrandData?.description || brandProfileData?.description || ''}
            onSave={handleSaveBrand}
            onBack={handleBack}
            isSaving={isSaving}
          />
        )}
      </div>
    </div>
  );
};

export default BrandOnboarding;
