import type { BrandExtractResponse } from '@/types'
import { calculateWCAGContrast } from '@/utils/colorUtils'

// SSE Event type
export interface SSEEvent {
  event: string;
  data: {
    message?: string;
    progress?: number;
    url?: string;
    count?: number;
    page?: number;
    total?: number;
    colors?: number;
    logos?: number;
    fonts?: number;
    result?: any;
  };
}

// Enhanced brand extraction with SSE streaming
export const extractBrandDataEnhanced = async (
  url: string,
  options: {
    maxPages?: number;
    includeScreenshots?: boolean;
    includeScraping?: boolean;
    includeImages?: boolean;
  } = {},
  onProgress?: (event: SSEEvent) => void
): Promise<BrandExtractResponse> => {
  const {
    maxPages = 10,
    includeScreenshots = true,
    includeScraping = false,
    includeImages = false
  } = options;

  return new Promise(async (resolve, reject) => {
    try {
      // Determine the API base URL (empty for production, localhost for dev)
      const isProduction = import.meta.env.PROD;
      const baseURL = isProduction ? '' : 'http://localhost:3001';

      const response = await fetch(`${baseURL}/api/analyze-brand-enhanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          maxPages,
          includeScreenshots,
          includeScraping,
          includeImages
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalResult: any = null;

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        let currentEvent = '';
        let currentData = '';

        for (const line of lines) {
          if (line.startsWith('event:')) {
            currentEvent = line.substring(6).trim();
          } else if (line.startsWith('data:')) {
            currentData = line.substring(5).trim();

            if (currentEvent && currentData) {
              try {
                const data = JSON.parse(currentData);

                // Call progress callback
                if (onProgress) {
                  onProgress({ event: currentEvent, data });
                }

                // Store final result
                if (currentEvent === 'complete' && data.result) {
                  finalResult = data.result;
                }

                // Reset for next event
                currentEvent = '';
                currentData = '';
              } catch (e) {
                console.error('Failed to parse SSE data:', e);
              }
            }
          }
        }
      }

      // Process the final result
      if (finalResult && finalResult.success && finalResult.brand) {
        // Map the enhanced API response to our existing BrandExtractResponse format
        const primaryLogo = finalResult.brand.logos.primary ? {
          src: finalResult.brand.logos.primary.src,
          alt: finalResult.brand.logos.primary.alt || '',
          width: finalResult.brand.logos.primary.averageSize?.width || 0,
          height: finalResult.brand.logos.primary.averageSize?.height || 0,
          score: finalResult.brand.logos.primary.frequency || 0
        } : {
          src: '',
          alt: '',
          width: 0,
          height: 0,
          score: 0
        };

        const mappedResponse: BrandExtractResponse = {
          success: true,
          brand: {
            url: finalResult.url,
            timestamp: new Date().toISOString(),
            colors: {
              palette: finalResult.brand.colors.all?.map((color: any) => ({
                hex: color.hex,
                frequency: color.frequency,
                wcagContrast: calculateWCAGContrast(color.hex)
              })) || []
            },
            logos: {
              primary: primaryLogo,
              alternates: finalResult.brand.logos.variations?.map((logo: any) => ({
                src: logo.src,
                alt: logo.alt || '',
                width: logo.averageSize?.width || 0,
                height: logo.averageSize?.height || 0,
                score: logo.frequency || 0
              })) || [],
              logoColors: []
            },
            typography: {
              display: {
                family: finalResult.brand.fonts.headings?.[0] || 'Unknown',
                weights: [],
                avgSize: 0,
                coverage: '',
                confidence: 100,
                source: 'enhanced-analysis'
              },
              headings: {},
              body: {
                family: finalResult.brand.fonts.body?.[0] || 'Unknown',
                weights: [],
                avgSize: 0,
                coverage: '',
                confidence: 100,
                source: 'enhanced-analysis'
              },
              fontLinks: {}
            },
            metadata: {
              extractionTime: finalResult.analysisTimeSeconds ? `${finalResult.analysisTimeSeconds}s` : '0s',
              success: true
            },
            screenshot: undefined
          },
          summary: finalResult.brand.colors.primary?.length > 0 ? {
            primaryColor: {
              hex: finalResult.brand.colors.primary[0],
              confidence: finalResult.brand.colors.confidence || 100
            },
            displayFont: {
              family: finalResult.brand.fonts.headings?.[0] || 'Unknown',
              confidence: finalResult.brand.fonts.confidence || 100
            },
            bodyFont: {
              family: finalResult.brand.fonts.body?.[0] || 'Unknown',
              confidence: finalResult.brand.fonts.confidence || 100
            },
            confidence: (finalResult.brand.colors.confidence + finalResult.brand.fonts.confidence) / 2 || 100
          } : {
            primaryColor: {
              hex: '#000000',
              confidence: 0
            },
            displayFont: {
              family: 'Unknown',
              confidence: 0
            },
            bodyFont: {
              family: 'Unknown',
              confidence: 0
            },
            confidence: 0
          }
        };

        resolve(mappedResponse);
      } else {
        reject(new Error('Failed to extract brand data: No result received'));
      }
    } catch (error: any) {
      console.error('Enhanced brand extraction error:', error);

      if (error.message?.includes('HTTP error')) {
        reject(new Error('Server error occurred while extracting brand data. Please try again.'));
      } else if (error.name === 'TypeError') {
        reject(new Error('Unable to connect to brand extraction service. Please check your internet connection and try again.'));
      } else {
        reject(new Error(error.message || 'Failed to extract brand data. Please try again.'));
      }
    }
  });
};
