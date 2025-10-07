import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import type { Brand } from '@/types';
import { parseBrandIdentifiers } from '@/utils/brandIdentifiers';

interface BrandContextType {
  currentBrand: Brand | null;
  setCurrentBrand: (brand: Brand | null) => void;
  loading: boolean;
  error: string | null;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

const STORAGE_KEY = 'selectedBrand';

export function BrandProvider({ children }: { children: ReactNode }) {
  const [currentBrand, setCurrentBrandState] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  // Load brand from localStorage on mount
  useEffect(() => {
    const savedBrand = localStorage.getItem(STORAGE_KEY);
    if (savedBrand) {
      try {
        const brand = JSON.parse(savedBrand) as Brand;
        setCurrentBrandState(brand);
      } catch (err) {
        console.error('Failed to parse saved brand:', err);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  // Update brand from URL when location changes
  useEffect(() => {
    const identifiers = parseBrandIdentifiers(location.pathname);

    if (identifiers) {
      // If we have identifiers in URL but no current brand, or if brand doesn't match
      if (
        !currentBrand ||
        currentBrand.slug !== identifiers.slug ||
        currentBrand.shortId !== identifiers.shortId
      ) {
        // This would normally trigger a fetch, but for now we'll handle it in components
        // Components can use the identifiers to fetch the brand if needed
      }
    }
  }, [location.pathname, currentBrand]);

  const setCurrentBrand = (brand: Brand | null) => {
    setCurrentBrandState(brand);

    if (brand) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(brand));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <BrandContext.Provider
      value={{
        currentBrand,
        setCurrentBrand,
        loading,
        error
      }}
    >
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
}

/**
 * Hook to get brand identifiers from current URL
 */
export function useBrandIdentifiers() {
  const location = useLocation();
  return parseBrandIdentifiers(location.pathname);
}
