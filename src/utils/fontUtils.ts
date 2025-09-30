import type { FontLink, FontData } from '@/types'

export interface LoadedFont {
  family: string;
  isLoaded: boolean;
  url?: string;
  fallbacks: string[];
}

export const SYSTEM_FONTS = [
  '-apple-system',
  'BlinkMacSystemFont',
  'system-ui',
  'Segoe UI',
  'Roboto',
  'Helvetica',
  'Arial',
  'sans-serif',
  'serif',
  'monospace',
];

export const FALLBACK_STACKS = {
  'sans-serif': [
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ],
  serif: ['Georgia', 'Times New Roman', 'Times', 'serif'],
  monospace: [
    'SF Mono',
    'Monaco',
    'Inconsolata',
    'Roboto Mono',
    'Consolas',
    'monospace',
  ],
};

export function isSystemFont(fontFamily: string): boolean {
  return SYSTEM_FONTS.some(systemFont =>
    fontFamily.toLowerCase().includes(systemFont.toLowerCase())
  );
}

export function generateFontStack(fontFamily: string, category?: string): string {
  const cleanFamily = fontFamily.trim();

  if (isSystemFont(cleanFamily)) {
    return cleanFamily;
  }

  const fallbacks = category && FALLBACK_STACKS[category as keyof typeof FALLBACK_STACKS]
    ? FALLBACK_STACKS[category as keyof typeof FALLBACK_STACKS]
    : FALLBACK_STACKS['sans-serif'];

  return [
    cleanFamily.includes(' ') ? `"${cleanFamily}"` : cleanFamily,
    ...fallbacks,
  ].join(', ');
}

export function generateGoogleFontsUrl(fonts: FontData[]): string {
  const fontRequests = fonts
    .filter(font => !isSystemFont(font.family))
    .map(font => {
      const weights = font.weights.join(',');
      return `${font.family.replace(/\s+/g, '+')}:wght@${weights}`;
    });

  if (fontRequests.length === 0) return '';

  return `https://fonts.googleapis.com/css2?${fontRequests
    .map(request => `family=${request}`)
    .join('&')}&display=swap`;
}

export function loadGoogleFonts(fontLinks: Record<string, FontLink>): Promise<void[]> {
  const promises = Object.entries(fontLinks)
    .filter(([_, link]) => link.provider === 'Google Fonts')
    .map(([family, link]) => loadFont(family, link.url));

  return Promise.all(promises);
}

export function loadFont(family: string, url?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isSystemFont(family)) {
      resolve();
      return;
    }

    if (!url) {
      const generatedUrl = generateGoogleFontsUrl([{
        family,
        weights: ['400'],
        avgSize: 16,
        coverage: '0%',
        confidence: 0,
        source: 'Google Fonts',
      }]);
      url = generatedUrl;
    }

    if (!url) {
      resolve();
      return;
    }

    const existingLink = document.querySelector(`link[href="${url}"]`);
    if (existingLink) {
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;

    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load font: ${family}`));

    document.head.appendChild(link);
  });
}

export function previewText(type: 'display' | 'heading' | 'body'): string {
  switch (type) {
    case 'display':
      return 'The quick brown fox jumps over the lazy dog';
    case 'heading':
      return 'Sample Heading Text';
    case 'body':
      return 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';
    default:
      return 'Sample text';
  }
}

export function getFontDisplayName(font: FontData): string {
  const weights = font.weights.length > 1
    ? `${font.weights.length} weights`
    : `${font.weights[0]}`;

  return `${font.family} (${weights})`;
}

export function formatFontWeight(weight: string | number): string {
  const weightMap: Record<string, string> = {
    '100': 'Thin',
    '200': 'Extra Light',
    '300': 'Light',
    '400': 'Regular',
    '500': 'Medium',
    '600': 'Semi Bold',
    '700': 'Bold',
    '800': 'Extra Bold',
    '900': 'Black',
  };

  return weightMap[weight.toString()] || weight.toString();
}

export function getFontSizeLabel(size: number): string {
  if (size >= 48) return 'Display';
  if (size >= 32) return 'Heading 1';
  if (size >= 24) return 'Heading 2';
  if (size >= 20) return 'Heading 3';
  if (size >= 18) return 'Heading 4';
  if (size >= 16) return 'Body Large';
  if (size >= 14) return 'Body';
  return 'Body Small';
}

export function validateFontData(font: FontData): boolean {
  return !!(
    font.family &&
    font.weights &&
    font.weights.length > 0 &&
    font.confidence >= 0 &&
    font.confidence <= 1
  );
}