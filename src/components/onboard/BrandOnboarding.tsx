import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import MethodSelection from './steps/MethodSelection';
import BrandExtraction from './steps/BrandExtraction';
import AssetReview, { type RemovedAssets } from './steps/AssetReview';
import BrandDetails, { type BrandDetailsData } from './steps/BrandDetails';
import type { BrandExtractResponse } from '@/types';
import { createBrand, saveBrandAssets } from '@/services/api/brandService';
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

    try {
      let brandData: any = {
        name: details.name,
        website: details.website,
        industry: details.industry
      };

      // Add extracted data if available
      if (extractedData) {
        // Get primary color from palette (not removed)
        const visibleColors = extractedData.brand.colors.palette.filter(
          c => !removedAssets.colors.includes(c.hex)
        );
        const primaryColor = visibleColors[0]?.hex;

        // Get primary logo (not removed)
        const visibleLogos = [
          extractedData.brand.logos.primary,
          ...(extractedData.brand.logos.alternates || [])
        ].filter(logo => !removedAssets.logos.includes(logo.src));
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

      // Create the brand in the database
      const response = await createBrand(brandData);

      if (response.success && response.data) {
        // Map the response to Brand type
        const newBrand = {
          id: response.data.id,
          name: response.data.name,
          website: response.data.website || '',
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

        // Save extracted brand assets if available
        if (extractedData) {
          await saveBrandAssets(response.data.id, extractedData);
        }

        // Set as current brand
        setCurrentBrand(newBrand);

        // Navigate to the brand profile
        navigate(generateBrandUrl(newBrand, 'brand'));
      } else {
        throw new Error('Failed to create brand');
      }
    } catch (error: any) {
      console.error('Failed to save brand:', error);
      alert(error.message || 'Failed to create brand. Please try again.');
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
            initialName={manualBrandData?.name || extractedData?.brand.metadata?.title || ''}
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
