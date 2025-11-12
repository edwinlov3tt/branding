import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react';
import type {
  OnboardingProgress,
  OnboardingResults,
  BrandExtractResponse,
  BrandProfilerResponse,
  DiscoverPagesResponse
} from '@/types';
import {
  extractBrandData,
  generateBrandProfile,
  discoverBrandPages
} from '@/services/api/brandService';
import './ConsolidatedLoadingScreen.css';

interface ConsolidatedLoadingScreenProps {
  url: string;
  onComplete: (results: OnboardingResults) => void;
  onError: (error: string) => void;
}

const ConsolidatedLoadingScreen = ({ url, onComplete, onError }: ConsolidatedLoadingScreenProps) => {
  const [progress, setProgress] = useState<OnboardingProgress>({
    extraction: { status: 'pending' },
    brandProfile: { status: 'pending' },
    pageDiscovery: { status: 'pending' },
    overallProgress: 0
  });

  // Calculate weighted overall progress
  const calculateOverallProgress = (currentProgress: OnboardingProgress): number => {
    const weights = {
      extraction: 30,    // 30% weight (30-60s)
      brandProfile: 55,  // 55% weight (60-100s)
      pageDiscovery: 15  // 15% weight (15-30s)
    };

    let total = 0;

    // Extraction
    if (currentProgress.extraction.status === 'completed') total += weights.extraction;
    else if (currentProgress.extraction.status === 'processing') total += weights.extraction * 0.5;
    else if (currentProgress.extraction.status === 'retrying') total += weights.extraction * 0.25;

    // Brand Profile
    if (currentProgress.brandProfile.status === 'completed') total += weights.brandProfile;
    else if (currentProgress.brandProfile.status === 'processing') total += weights.brandProfile * 0.5;
    else if (currentProgress.brandProfile.status === 'retrying') total += weights.brandProfile * 0.25;

    // Page Discovery
    if (currentProgress.pageDiscovery.status === 'completed') total += weights.pageDiscovery;
    else if (currentProgress.pageDiscovery.status === 'processing') total += weights.pageDiscovery * 0.5;
    else if (currentProgress.pageDiscovery.status === 'retrying') total += weights.pageDiscovery * 0.25;

    return Math.min(Math.round(total), 100);
  };

  // Update progress for a specific step
  const updateProgress = (
    step: keyof Omit<OnboardingProgress, 'overallProgress'>,
    status: OnboardingProgress[keyof Omit<OnboardingProgress, 'overallProgress'>]['status'],
    message?: string,
    error?: string
  ) => {
    setProgress(prev => {
      const updated = {
        ...prev,
        [step]: {
          status,
          message,
          error,
          retryCount: status === 'retrying' ? (prev[step].retryCount || 0) + 1 : prev[step].retryCount
        }
      };
      updated.overallProgress = calculateOverallProgress(updated);
      return updated;
    });
  };

  // Retry wrapper for API calls
  const withRetry = async <T,>(
    fn: () => Promise<T>,
    stepName: keyof Omit<OnboardingProgress, 'overallProgress'>,
    operationName: string
  ): Promise<T | null> => {
    try {
      updateProgress(stepName, 'processing', `${operationName}...`);
      const result = await fn();
      updateProgress(stepName, 'completed', 'Complete');
      return result;
    } catch (error: any) {
      console.warn(`[ConsolidatedLoading] ${operationName} failed, retrying:`, error.message);

      // Retry once
      try {
        updateProgress(stepName, 'retrying', 'Retrying...');
        const result = await fn();
        updateProgress(stepName, 'completed', 'Complete');
        return result;
      } catch (retryError: any) {
        console.error(`[ConsolidatedLoading] ${operationName} failed after retry:`, retryError.message);
        updateProgress(stepName, 'failed', 'Failed', retryError.message);
        return null;
      }
    }
  };

  // Execute all 3 API calls in parallel
  useEffect(() => {
    const executeParallelAPIs = async () => {
      console.log('[ConsolidatedLoading] Starting parallel API execution for:', url);

      // Create temporary brand ID for Brand Profiler
      const tempBrandId = `temp-${Date.now()}`;

      // Execute all 3 operations in parallel
      const [extractionResult, profileResult, discoveryResult] = await Promise.all([
        // 1. Brand Extraction
        withRetry<BrandExtractResponse>(
          () => extractBrandData(url, true),
          'extraction',
          'Analyzing website and extracting brand assets'
        ),

        // 2. Brand Profiler (returns wrapped response)
        withRetry<{
          success: boolean;
          data: {
            jobId: string;
            brandProfile: BrandProfilerResponse['brandProfile'];
            insights: BrandProfilerResponse['insights'];
          };
        }>(
          () => generateBrandProfile(tempBrandId, url, {
            includeReviews: false,
            maxPages: 10
          }),
          'brandProfile',
          'Generating brand profile from website content'
        ),

        // 3. Page Discovery
        withRetry<DiscoverPagesResponse>(
          () => discoverBrandPages(url, {
            maxPages: 15,
            includeScraping: true,
            includeImages: false
          }),
          'pageDiscovery',
          'Discovering product and service pages'
        )
      ]);

      console.log('[ConsolidatedLoading] All operations completed:', {
        extraction: extractionResult ? 'success' : 'failed',
        profile: profileResult ? 'success' : 'failed',
        discovery: discoveryResult ? 'success' : 'failed'
      });

      // Check if extraction failed (critical)
      if (!extractionResult) {
        onError('Brand extraction failed. Please check the URL and try again.');
        return;
      }

      // Build results object
      const results: OnboardingResults = {
        extraction: extractionResult,
        brandProfile: profileResult || undefined,
        pageDiscovery: discoveryResult || undefined,
        errors: {
          extraction: undefined,
          brandProfile: profileResult ? undefined : 'Brand profile generation failed',
          pageDiscovery: discoveryResult ? undefined : 'Page discovery failed'
        }
      };

      console.log('[ConsolidatedLoading] Calling onComplete with results');
      onComplete(results);
    };

    executeParallelAPIs();
  }, [url]);

  // Get status icon
  const getStatusIcon = (status: OnboardingProgress[keyof Omit<OnboardingProgress, 'overallProgress'>]['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="status-icon status-icon-completed" size={24} />;
      case 'failed':
        return <XCircle className="status-icon status-icon-failed" size={24} />;
      case 'processing':
      case 'retrying':
        return <Loader2 className="status-icon status-icon-processing spin" size={24} />;
      case 'pending':
      default:
        return <Clock className="status-icon status-icon-pending" size={24} />;
    }
  };

  // Get status text
  const getStatusText = (stepProgress: OnboardingProgress[keyof Omit<OnboardingProgress, 'overallProgress'>]) => {
    if (stepProgress.message) return stepProgress.message;

    switch (stepProgress.status) {
      case 'completed':
        return 'Complete';
      case 'failed':
        return stepProgress.error || 'Failed';
      case 'processing':
        return 'In Progress';
      case 'retrying':
        return `Retrying... (Attempt ${(stepProgress.retryCount || 0) + 1})`;
      case 'pending':
      default:
        return 'Pending';
    }
  };

  return (
    <div className="consolidated-loading-screen">
      <div className="loading-header">
        <h2 className="loading-title">Creating Your Brand Profile</h2>
        <p className="loading-subtitle">
          This will take 5-10 minutes. Grab a coffee! ☕
        </p>
      </div>

      <div className="progress-section">
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{ width: `${progress.overallProgress}%` }}
          />
        </div>
        <div className="progress-percentage">{progress.overallProgress}%</div>
      </div>

      <div className="operations-list">
        <div className={`operation-step operation-step-${progress.extraction.status}`}>
          <div className="operation-icon">
            {getStatusIcon(progress.extraction.status)}
          </div>
          <div className="operation-content">
            <div className="operation-title">Brand Asset Extraction</div>
            <div className="operation-subtitle">30-60 seconds</div>
            <div className="operation-status">{getStatusText(progress.extraction)}</div>
          </div>
        </div>

        <div className={`operation-step operation-step-${progress.brandProfile.status}`}>
          <div className="operation-icon">
            {getStatusIcon(progress.brandProfile.status)}
          </div>
          <div className="operation-content">
            <div className="operation-title">Brand Profile Analysis</div>
            <div className="operation-subtitle">60-100 seconds</div>
            <div className="operation-status">{getStatusText(progress.brandProfile)}</div>
          </div>
        </div>

        <div className={`operation-step operation-step-${progress.pageDiscovery.status}`}>
          <div className="operation-icon">
            {getStatusIcon(progress.pageDiscovery.status)}
          </div>
          <div className="operation-content">
            <div className="operation-title">Page Discovery</div>
            <div className="operation-subtitle">15-30 seconds</div>
            <div className="operation-status">{getStatusText(progress.pageDiscovery)}</div>
          </div>
        </div>
      </div>

      <div className="loading-footer">
        <p className="loading-hint">
          We're analyzing your website to extract brand colors, fonts, logos, and creating a detailed brand profile.
          This process runs once and saves everything for future use.
        </p>
      </div>
    </div>
  );
};

export default ConsolidatedLoadingScreen;
