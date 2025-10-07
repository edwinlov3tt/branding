import {
  ShoppingCart,
  Code,
  Briefcase,
  Heart,
  Utensils,
  GraduationCap,
  Home,
  Car,
  Shirt,
  Smartphone,
  Building2,
  Palette,
  Music,
  Plane,
  Dumbbell,
  type LucideIcon
} from 'lucide-react';
import type { Brand } from '@/types';

/**
 * Industry to Lucide icon mapping
 */
const INDUSTRY_ICONS: Record<string, LucideIcon> = {
  'e-commerce': ShoppingCart,
  'ecommerce': ShoppingCart,
  'retail': ShoppingCart,
  'shopping': ShoppingCart,
  'technology': Code,
  'tech': Code,
  'software': Code,
  'saas': Code,
  'consulting': Briefcase,
  'business': Briefcase,
  'finance': Briefcase,
  'healthcare': Heart,
  'medical': Heart,
  'health': Heart,
  'food': Utensils,
  'restaurant': Utensils,
  'dining': Utensils,
  'education': GraduationCap,
  'learning': GraduationCap,
  'real-estate': Home,
  'realestate': Home,
  'property': Home,
  'automotive': Car,
  'auto': Car,
  'cars': Car,
  'fashion': Shirt,
  'apparel': Shirt,
  'clothing': Shirt,
  'electronics': Smartphone,
  'gadgets': Smartphone,
  'construction': Building2,
  'architecture': Building2,
  'design': Palette,
  'creative': Palette,
  'art': Palette,
  'entertainment': Music,
  'music': Music,
  'media': Music,
  'travel': Plane,
  'tourism': Plane,
  'hospitality': Plane,
  'fitness': Dumbbell,
  'sports': Dumbbell,
  'gym': Dumbbell,
};

/**
 * Get Lucide icon component based on industry
 */
export function getIndustryIcon(industry?: string): LucideIcon {
  if (!industry) {
    return Building2; // Default icon
  }

  const normalizedIndustry = industry.toLowerCase().trim();
  return INDUSTRY_ICONS[normalizedIndustry] || Building2;
}

/**
 * Fetch favicon from Google's favicon service
 * @param website - The website URL
 * @param size - Size in pixels (default: 64)
 * @returns Promise that resolves to the favicon URL or null
 */
export async function fetchFavicon(website: string, size: number = 64): Promise<string | null> {
  try {
    // Extract domain from URL
    const url = new URL(website.startsWith('http') ? website : `https://${website}`);
    const domain = url.hostname;

    // Try Google's favicon service first
    const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;

    // Test if the URL is accessible
    const response = await fetch(googleFaviconUrl, { method: 'HEAD' });
    if (response.ok) {
      return googleFaviconUrl;
    }

    // Fallback: try direct favicon.ico
    const directFaviconUrl = `${url.protocol}//${domain}/favicon.ico`;
    const directResponse = await fetch(directFaviconUrl, { method: 'HEAD' });
    if (directResponse.ok) {
      return directFaviconUrl;
    }

    return null;
  } catch (error) {
    console.error('Error fetching favicon:', error);
    return null;
  }
}

/**
 * Generate a color from brand data
 * Uses primary color if available, otherwise generates from name
 */
export function getBrandColor(brand: Brand): string {
  if (brand.primaryColor) {
    return brand.primaryColor;
  }

  // Generate color from brand name (deterministic)
  const colors = [
    '#dc2626', // red
    '#ea580c', // orange
    '#ca8a04', // yellow
    '#16a34a', // green
    '#0891b2', // cyan
    '#2563eb', // blue
    '#7c3aed', // purple
    '#c026d3', // magenta
  ];

  const index = brand.name
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;

  return colors[index];
}

/**
 * Generate fallback avatar data for brands without favicons
 * Returns an object with color and icon component
 */
export function generateFallbackAvatar(brand: Brand): {
  color: string;
  Icon: LucideIcon;
  initials: string;
} {
  const color = getBrandColor(brand);
  const Icon = getIndustryIcon(brand.industry);

  // Generate initials from brand name (max 2 characters)
  const words = brand.name.trim().split(/\s+/);
  let initials = '';

  if (words.length === 1) {
    initials = words[0].substring(0, 2).toUpperCase();
  } else {
    initials = words
      .slice(0, 2)
      .map(word => word[0])
      .join('')
      .toUpperCase();
  }

  return { color, Icon, initials };
}

/**
 * Get the best available brand image
 * Priority: logo_url -> favicon_url -> generated fallback
 */
export function getBrandImage(brand: Brand): {
  type: 'logo' | 'favicon' | 'fallback';
  url?: string;
  fallback?: ReturnType<typeof generateFallbackAvatar>;
} {
  if (brand.logo) {
    return { type: 'logo', url: brand.logo };
  }

  if (brand.faviconUrl) {
    return { type: 'favicon', url: brand.faviconUrl };
  }

  return {
    type: 'fallback',
    fallback: generateFallbackAvatar(brand)
  };
}
