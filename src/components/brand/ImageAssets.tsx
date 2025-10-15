import { useState, useEffect } from 'react';
import { ExternalLink, AlertCircle } from 'lucide-react';
import { discoverBrandPages, getBrandImages, saveBrandImages } from '@/services/api/brandService';
import { useBrand } from '@/contexts/BrandContext';
import type { DiscoveredPage, PageImage, BrandImagePage } from '@/types';
import ImageCard from './ImageCard';
import './ImageAssets.css';

interface ImageAssetsProps {
  url: string;
}

const ImageAssets = ({ url }: ImageAssetsProps) => {
  const { currentBrand } = useBrand();
  const [pages, setPages] = useState<DiscoveredPage[]>([]);
  const [removedImages, setRemovedImages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load images from database first, then fetch if needed
    if (url && currentBrand?.id) {
      loadBrandImages();
    }
  }, [url, currentBrand?.id]);

  const loadBrandImages = async () => {
    if (!currentBrand?.id) return;

    setIsLoading(true);
    setError('');

    try {
      // Try to load from database first
      const response = await getBrandImages(currentBrand.id);

      if (response.success && response.data && response.data.length > 0) {
        // Convert BrandImagePage[] to DiscoveredPage[] format
        const discoveredPages: DiscoveredPage[] = response.data.map((page: BrandImagePage) => ({
          url: page.page_url,
          title: page.page_title || '',
          category: page.page_category || 'other',
          relevanceScore: page.relevance_score,
          reason: '',
          headings: [],
          wordCount: 0,
          images: page.images || [],
          imageCount: page.images_count,
          scrapedAt: page.last_fetched_at
        }));

        setPages(discoveredPages);
        setIsLoading(false);
        console.log(`[Cache Hit] Loaded ${discoveredPages.length} pages from database`);
      } else {
        // No cached data - fetch from API
        console.log('[Cache Miss] No cached images found, fetching from API...');
        await fetchBrandImages();
      }
    } catch (err: any) {
      console.error('Error loading brand images:', err);
      // Fallback to API if database fails
      await fetchBrandImages();
    }
  };

  const fetchBrandImages = async () => {
    if (!currentBrand?.id) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await discoverBrandPages(url, {
        maxPages: 5,  // Reduced to 5 pages for faster loading
        includeImages: true,
        maxImagesPerPage: 8,
        includeScraping: false
      });

      // Filter pages that have images
      const pagesWithImages = response.pages.filter(page => page.images && page.images.length > 0);
      setPages(pagesWithImages);

      // Save to database for future loads
      const pagesToSave = pagesWithImages.map(page => ({
        page_url: page.url,
        page_title: page.title,
        page_category: page.category,
        relevance_score: page.relevanceScore,
        images: page.images || []
      }));

      await saveBrandImages(currentBrand.id, pagesToSave);
      console.log(`[Cache Update] Saved ${pagesToSave.length} pages to database`);
    } catch (err: any) {
      setError(err.message || 'Failed to discover brand images');
      console.error('Error discovering brand pages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageRemove = (imageUrl: string) => {
    setRemovedImages(prev => new Set(prev).add(imageUrl));
  };

  const getVisibleImages = (images: PageImage[]): PageImage[] => {
    return images.filter(img => !removedImages.has(img.url));
  };

  const getDomainName = (pageUrl: string): string => {
    try {
      const url = new URL(pageUrl);
      return url.pathname === '/' ? url.hostname : url.pathname.split('/').filter(Boolean)[0] || url.hostname;
    } catch {
      return pageUrl;
    }
  };

  if (isLoading) {
    return (
      <div className="image-assets-loading">
        <div className="loading"></div>
        <p className="loading-text">Discovering brand images across website...</p>
        <p className="loading-subtext">This may take up to a minute</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="image-assets-error">
        <AlertCircle size={18} />
        <span>{error}</span>
      </div>
    );
  }

  if (!pages.length) {
    return (
      <div className="image-assets-empty">
        <p>No images discovered yet. Extract brand data to discover images.</p>
      </div>
    );
  }

  return (
    <div className="image-assets">
      {pages.map((page, pageIndex) => {
        const visibleImages = getVisibleImages(page.images || []);

        if (visibleImages.length === 0) {
          return null;
        }

        return (
          <div key={`page-${pageIndex}-${page.url}`} className="page-images-section">
            <div className="page-header">
              <h3 className="page-title">{page.title || getDomainName(page.url)}</h3>
              <a
                href={page.url}
                target="_blank"
                rel="noopener noreferrer"
                className="page-link"
                title={page.url}
              >
                <span className="page-url">{page.url}</span>
                <ExternalLink size={14} />
              </a>
            </div>

            <div className="page-meta">
              <span className="page-category">{page.category}</span>
              <span className="page-relevance">Relevance: {Math.round(page.relevanceScore * 100)}%</span>
              <span className="image-count">{visibleImages.length} images</span>
            </div>

            <div className="images-grid">
              {visibleImages.map((image, imageIndex) => (
                <ImageCard
                  key={`${image.url}-${imageIndex}`}
                  image={image}
                  onRemove={handleImageRemove}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ImageAssets;