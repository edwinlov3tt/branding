import type { WCAGContrast, RGBColor } from '@/types'

export interface ContrastResult {
  ratio: number;
  level: 'AAA' | 'AA' | 'A' | 'FAIL';
  isLargeText?: boolean;
}

export function hexToRgb(hex: string): RGBColor {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

export function rgbToHex(rgb: RGBColor): string {
  const toHex = (c: number) => {
    const hex = Math.round(c).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

export function getLuminance(rgb: RGBColor): number {
  const { r, g, b } = rgb;

  const normalize = (value: number) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  };

  return 0.2126 * normalize(r) + 0.7152 * normalize(g) + 0.0722 * normalize(b);
}

export function getContrastRatio(color1: RGBColor, color2: RGBColor): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
}

export function calculateWCAGContrast(hex: string): WCAGContrast {
  const rgb = hexToRgb(hex);
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 0, g: 0, b: 0 };

  return {
    'vs-white': getContrastRatio(rgb, white),
    'vs-black': getContrastRatio(rgb, black),
  };
}

export function getContrastLevel(
  ratio: number,
  isLargeText: boolean = false
): ContrastResult['level'] {
  if (isLargeText) {
    if (ratio >= 4.5) return 'AAA';
    if (ratio >= 3) return 'AA';
    return 'FAIL';
  } else {
    if (ratio >= 7) return 'AAA';
    if (ratio >= 4.5) return 'AA';
    if (ratio >= 3) return 'A';
    return 'FAIL';
  }
}

export function getAccessibilityInfo(
  hex: string,
  backgroundHex: string = '#ffffff',
  isLargeText: boolean = false
): ContrastResult {
  const foreground = hexToRgb(hex);
  const background = hexToRgb(backgroundHex);
  const ratio = getContrastRatio(foreground, background);

  return {
    ratio,
    level: getContrastLevel(ratio, isLargeText),
    isLargeText,
  };
}

export function getBestContrastColor(hex: string): string {
  const contrast = calculateWCAGContrast(hex);
  return contrast['vs-white'] > contrast['vs-black'] ? '#ffffff' : '#000000';
}

export function detectLogoBackgroundColor(logoColors: string[]): string {
  if (!logoColors.length) return '#f8f9fa';

  const avgLuminance = logoColors.reduce((sum, color) => {
    const rgb = hexToRgb(color);
    return sum + getLuminance(rgb);
  }, 0) / logoColors.length;

  return avgLuminance > 0.5 ? '#1a1a1a' : '#f8f9fa';
}

export function isColorDark(hex: string): boolean {
  const rgb = hexToRgb(hex);
  const luminance = getLuminance(rgb);
  return luminance < 0.5;
}

export function generateColorVariations(hex: string): {
  lighter: string;
  darker: string;
  muted: string;
} {
  const rgb = hexToRgb(hex);

  const lighter = {
    r: Math.min(255, rgb.r + 40),
    g: Math.min(255, rgb.g + 40),
    b: Math.min(255, rgb.b + 40),
  };

  const darker = {
    r: Math.max(0, rgb.r - 40),
    g: Math.max(0, rgb.g - 40),
    b: Math.max(0, rgb.b - 40),
  };

  const muted = {
    r: Math.round(rgb.r * 0.7 + 128 * 0.3),
    g: Math.round(rgb.g * 0.7 + 128 * 0.3),
    b: Math.round(rgb.b * 0.7 + 128 * 0.3),
  };

  return {
    lighter: rgbToHex(lighter),
    darker: rgbToHex(darker),
    muted: rgbToHex(muted),
  };
}