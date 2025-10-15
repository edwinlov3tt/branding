import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import MethodSelection from './steps/MethodSelection';
import BrandExtraction from './steps/BrandExtraction';
import AssetReview, { type RemovedAssets } from './steps/AssetReview';
import BrandDetails, { type BrandDetailsData } from './steps/BrandDetails';
import type { BrandExtractResponse } from '@/types';
import {
  createBrand,
  saveBrandAssets,
  createBrandProfile
} from '@/services/api/brandService';
import { useBrand } from '@/contexts/BrandContext';
import { generateBrandUrl } from '@/utils/brandIdentifiers';
import './BrandOnboarding.css';

type OnboardingStep = 1 | 2 | 3 | 4;
type ExtractionMethod = 'automatic' | 'manual' | null;

const BrandOnboarding = () => {
  const navigate = useNavigate();
  const { setCurrentBrand } = useBrand();

  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [method, setMethod] = useState<ExtractionMethod>(null);
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
  const [isSaving, setIsSaving] = useState(false);

  // Step 1: Method selection
  const handleMethodSelect = (selectedMethod: 'automatic' | 'manual') => {
    setMethod(selectedMethod);
  };

  const handleMethodContinue = () => {
    if (method) {
      setCurrentStep(2);
    }
  };

  // Step 2: Brand extraction/entry
  const handleBrandExtracted = (data: BrandExtractResponse) => {
    setExtractedData(data);
    setCurrentStep(3);
  };

  const handleManualSubmit = (name: string, website: string, description: string) => {
    setManualBrandData({ name, website, description });
    setCurrentStep(4); // Skip asset review for manual
  };

  // Step 3: Asset review
  const handleAssetReviewContinue = (assets: RemovedAssets) => {
    setRemovedAssets(assets);
    setCurrentStep(4);
  };

  // Step 4: Final details and save
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
      // STEP 3: Create Brand Profile (NON-CRITICAL - can fail)
      // ============================================
      if (brandWebsite) {
        try {
          console.log('[Onboarding] Step 3: Creating brand profile...');
          // Use sync mode for faster onboarding (25-30s instead of 60s)
          const profileResponse = await createBrandProfile(brandId, brandWebsite, {
            includeReviews: false, // Skip reviews for faster onboarding
            maxPages: 5,
            mode: 'sync'
          });

          if (profileResponse.success) {
            console.log('[Onboarding] ✅ Brand profile created successfully');
          } else {
            console.log('[Onboarding] ⚠️ Brand profile creation returned non-success:', profileResponse);
            warnings.push('Brand profile could not be generated. You can generate it later from the Brand Profile tab.');
          }
        } catch (error: any) {
          console.error('[Onboarding] ⚠️ Failed to create brand profile:', error);
          // Check if it's a timeout or API unavailable
          if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
            warnings.push('Brand profile generation timed out. You can generate it later from the Brand Profile tab.');
          } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
            warnings.push('Brand Profiler API is currently unavailable. You can generate the profile later.');
          } else {
            warnings.push('Brand profile could not be generated. You can try again later from the Brand Profile tab.');
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
      // STEP 5: Complete Onboarding
      // ============================================
      console.log('[Onboarding] ✅ Onboarding complete!');

      // Set as current brand
      setCurrentBrand(newBrand);

      // Show warnings if any
      if (warnings.length > 0) {
        const warningMessage = 'Brand created successfully!\n\nNote:\n' + warnings.join('\n');
        alert(warningMessage);
      }

      // Navigate to the brand profile
      navigate(generateBrandUrl(newBrand, 'brand'));
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
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as OnboardingStep);
    } else {
      navigate('/brands');
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Choose Method';
      case 2: return method === 'automatic' ? 'Extract Assets' : 'Enter Information';
      case 3: return 'Review Assets';
      case 4: return 'Brand Details';
      default: return '';
    }
  };

  return (
    <div className="brand-onboarding">
      <div className="onboarding-header">
        <button className="back-button" onClick={handleBack}>
          <ArrowLeft size={20} />
          {currentStep === 1 ? 'Back to Brands' : 'Back'}
        </button>

        <div className="onboarding-progress">
          <div className="progress-steps">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`progress-step ${currentStep >= step ? 'active' : ''} ${currentStep === step ? 'current' : ''}`}
              >
                <div className="progress-circle">{step}</div>
                {step < 4 && <div className="progress-line" />}
              </div>
            ))}
          </div>
          <div className="progress-title">{getStepTitle()}</div>
        </div>
      </div>

      <div className="onboarding-content">
        {currentStep === 1 && (
          <MethodSelection
            selectedMethod={method}
            onMethodSelect={handleMethodSelect}
            onContinue={handleMethodContinue}
          />
        )}

        {currentStep === 2 && method && (
          <BrandExtraction
            method={method}
            onExtracted={handleBrandExtracted}
            onManualSubmit={handleManualSubmit}
            onBack={handleBack}
          />
        )}

        {currentStep === 3 && extractedData && (
          <AssetReview
            extractedData={extractedData}
            onContinue={handleAssetReviewContinue}
            onBack={handleBack}
          />
        )}

        {currentStep === 4 && (
          <BrandDetails
            initialName={manualBrandData?.name || ''}
            initialWebsite={manualBrandData?.website || extractedData?.brand.url || ''}
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
