import slugify from 'slugify';
import { nanoid } from 'nanoid';
import type { Brand } from '@/types';

/**
 * Generate a URL-friendly slug from a brand name
 */
export function generateSlug(name: string): string {
  return slugify(name, {
    lower: true,
    strict: true, // Remove special characters
    trim: true
  });
}

/**
 * Generate a random short ID (5 alphanumeric characters)
 * Using 5 chars gives us 916M+ possible combinations
 */
export function generateShortId(): string {
  return nanoid(5);
}

/**
 * Generate a brand URL with optional path
 * @param brand - The brand object
 * @param path - Optional path segment (e.g., 'target-audiences', 'campaigns')
 * @returns The full brand-scoped URL
 */
export function generateBrandUrl(brand: Brand, path?: string): string {
  const basePath = `/${path || 'brand'}/${brand.slug}/${brand.shortId}`;
  return basePath;
}

/**
 * Parse brand identifiers from URL path
 * Expects format: /some-path/brand-name/abc12
 */
export function parseBrandIdentifiers(pathname: string): { slug: string; shortId: string } | null {
  const parts = pathname.split('/').filter(Boolean);

  if (parts.length < 2) {
    return null;
  }

  // Last two parts should be slug and shortId
  const shortId = parts[parts.length - 1];
  const slug = parts[parts.length - 2];

  // Basic validation
  if (!slug || !shortId || shortId.length < 4 || shortId.length > 6) {
    return null;
  }

  return { slug, shortId };
}

/**
 * Check if a slug already exists (for client-side checking)
 * Should also be validated on the backend
 */
export async function isSlugUnique(slug: string, existingBrands: Brand[]): Promise<boolean> {
  return !existingBrands.some(brand => brand.slug === slug);
}

/**
 * Generate a unique slug by appending numbers if needed
 */
export function generateUniqueSlug(name: string, existingSlugs: string[]): string {
  let slug = generateSlug(name);
  let counter = 1;

  while (existingSlugs.includes(slug)) {
    slug = `${generateSlug(name)}-${counter}`;
    counter++;
  }

  return slug;
}
