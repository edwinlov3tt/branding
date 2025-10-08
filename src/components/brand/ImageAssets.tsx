import { useState, useEffect } from 'react';
import { ExternalLink, AlertCircle } from 'lucide-react';
import { discoverBrandPages } from '@/services/api/brandService';
import type { DiscoveredPage, PageImage } from '@/types';
import ImageCard from './ImageCard';
import './ImageAssets.css';

interface ImageAssetsProps {
  url: string;
}

const ImageAssets = ({ url }: ImageAssetsProps) => {
  const [pages, setPages] = useState<DiscoveredPage[]>([]);
  const [removedImages, setRemovedImages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    // Only fetch if we haven't fetched for this URL yet
    if (url && !hasFetched) {
      fetchBrandImages();
    }
  }, [url, hasFetched]);

  const fetchBrandImages = async () => {
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
      setHasFetched(true); // Mark as fetched
    } catch (err: any) {
      setError(err.message || 'Failed to discover brand images');
      console.error('Error discovering brand pages:', err);
      setHasFetched(true); // Mark as fetched even on error to prevent retrying
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