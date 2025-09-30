// Brand Types - Enhanced for new API
export interface BrandExtractResponse {
  success: boolean;
  brand: BrandData;
  summary: BrandSummary;
}

export interface BrandData {
  url: string;
  timestamp: string;
  colors: ColorsData;
  typography: TypographyData;
  logos: LogosData;
  metadata: MetadataData;
  screenshot?: ScreenshotData;
}

export interface ScreenshotData {
  url: string;
  data: string | null;
  type: string;
  size: number;
  strategy: string;
}

export interface ColorsData {
  palette: ColorPalette[];
  analysis?: {
    meta: {
      clustered: number;
      filtered: number;
    };
  };
}

export interface ColorPalette {
  hex: string;
  rgb: RGBColor;
  role: string;
  frequency: number;
  coverage: string;
  confidence: number;
  usedIn?: string[];
  types?: string[];
  wcagContrast?: WCAGContrast;
  inLogo?: boolean;
  examples?: ColorExample[];
}

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface WCAGContrast {
  'vs-white': number;
  'vs-black': number;
}

export interface ColorExample {
  tag: string;
  role: string;
  area: number;
}

export interface TypographyData {
  display: FontData;
  headings: {
    h1?: HeadingData;
    h2?: HeadingData;
    h3?: HeadingData;
    h4?: HeadingData;
    h5?: HeadingData;
    h6?: HeadingData;
  };
  body: FontData;
  fontLinks?: Record<string, FontLink>;
}

export interface FontData {
  family: string;
  weights: string[];
  avgSize: number;
  coverage: string;
  confidence: number;
  source: string;
  examples?: string[];
  counts?: number;
}

export interface HeadingData {
  family: string;
  weight: string;
  size: number;
  examples?: string[];
  coverage?: string;
  confidence?: number;
}

export interface FontLink {
  url: string;
  provider: string;
}

export interface LogosData {
  primary: LogoItem;
  alternates?: LogoItem[];
  favicons?: LogoItem[];
  logoColors: LogoColor[];
}

export interface LogoItem {
  src: string;
  width: number;
  height: number;
  score: number;
  position?: {
    x: number;
    y: number;
  };
}

export interface LogoColor {
  hex: string;
  frequency: number;
}

export interface MetadataData {
  extractionTime: string;
  success: boolean;
}

export interface BrandSummary {
  primaryColor: {
    hex: string;
    confidence: number;
  };
  displayFont: {
    family: string;
    confidence: number;
  };
  bodyFont: {
    family: string;
    confidence: number;
  };
  confidence: number;
}

// Edited Brand State
export interface EditedBrandData {
  colors: {
    primary?: ColorPalette;
    secondary?: ColorPalette;
    accent?: ColorPalette;
  };
  fonts: {
    display?: FontData;
    body?: FontData;
  };
  logo: {
    main?: string;
    alternatesKept: string[];
  };
  removed: {
    colors: string[];
    fonts: string[];
    logos: string[];
  };
}


// Persona Types
export interface Persona {
  id: string;
  name: string;
  role: string;
  businessContext: string;
  painPoints: string[];
  behaviors: string[];
  motivations: string[];
  budgetRange: string;
  objections: string[];
  benefits: string[];
  pitch: string;
  cta: string;
}

// Competitor Types
export interface Competitor {
  id: string;
  name: string;
  website: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  marketPosition: string;
  pricing: string;
}

// Template Types
export interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  thumbnail: string;
  isPremium: boolean;
}

// Generation Types
export interface Generation {
  id: string;
  type: 'image' | 'video' | 'banner';
  prompt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: string;
  createdAt: Date;
  template?: string;
  model?: string;
}

// AI Model Types
export interface AIModel {
  id: string;
  type: 'avatar' | 'spokesperson' | 'character';
  name: string;
  description: string;
  voice?: string;
  status: 'creating' | 'ready' | 'error';
  avatarUrl?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Settings Types
export interface Settings {
  apiKeys: {
    claude?: string;
    openai?: string;
  };
  preferences: {
    theme: 'dark' | 'light';
    autoSave: boolean;
  };
}