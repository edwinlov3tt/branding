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


// Target Audience Types
export interface TargetAudience {
  id: string;
  name: string;
  description: string;
  demographics: string;
  interests: string[];
  painPoints: string[];
  goals: string[];
  budgetRange: string;
  channels: string[];
}

// Legacy Persona type (for backward compatibility)
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

// Product & Service Types
export interface ProductService {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  category: string;
  price?: string;
  features: string[];
}

// Legacy AI Model type (for backward compatibility)
export interface AIModel {
  id: string;
  type: 'avatar' | 'spokesperson' | 'character';
  name: string;
  description: string;
  voice?: string;
  status: 'creating' | 'ready' | 'error';
  avatarUrl?: string;
}

// Campaign Types
export interface Campaign {
  id: string;
  name: string;
  marketingObjective: 'Awareness' | 'Conversions' | 'Engagement' | 'Leads' | 'Traffic' | 'Sales';
  launchDate: string;
  budget: string;
  objective: string;
  targetAudience: string;
  status?: 'draft' | 'active' | 'paused' | 'completed';
}

// Brand Intelligence Types
export interface BrandIntelligence {
  id: string;
  brand_id: string;
  brand_name?: string;
  tagline?: string;
  mission?: string;
  vision?: string;
  values: string[];
  brand_tone?: string;
  brand_voice: {
    formality?: string;
    enthusiasm?: string;
    professionalism?: string;
    [key: string]: string | undefined;
  };
  messaging_themes: string[];
  industry?: string;
  target_market?: string;
  unique_value_proposition?: string;
  key_messages: string[];
  content_themes: string[];
  pages_analyzed: number;
  analysis_confidence?: number;
  raw_analysis?: any;
  created_at: string;
  updated_at: string;
}

// Competitor Analysis Types
export interface CompetitorAnalysis {
  id: string;
  brand_id: string;
  competitor_id?: string;
  competitor_name: string;
  competitor_website?: string;
  facebook_page?: string;
  total_ads_analyzed: number;
  ad_ids: string[];
  ads_data: any[];
  overview?: string;
  positioning?: string;
  creative_strategy: {
    ad_formats?: string[];
    common_themes?: string[];
    creative_patterns?: string[];
    [key: string]: any;
  };
  messaging_analysis: {
    tone?: string;
    key_messages?: string[];
    ctas?: string[];
    value_propositions?: string[];
    [key: string]: any;
  };
  visual_design_elements: {
    colors?: string[];
    imagery_style?: string;
    typography?: string;
    branding_consistency?: string;
    [key: string]: any;
  };
  target_audience_insights: {
    demographics?: string[];
    psychographics?: string[];
    pain_points?: string[];
    [key: string]: any;
  };
  performance_indicators: {
    engagement_patterns?: string;
    ad_frequency?: string;
    timing?: string;
    [key: string]: any;
  };
  recommendations: string[];
  key_findings: string[];
  analysis_model?: string;
  analysis_confidence?: number;
  analysis_date: string;
  created_at: string;
  updated_at: string;
}

// Brand Management Types
export interface Brand {
  id: string;
  name: string;
  website: string;
  logo?: string;
  primaryColor?: string;
  slug: string;
  shortId: string;
  industry?: string;
  faviconUrl?: string;
  createdAt: string;
  lastModified: string;
  brandData?: BrandData;
  audiences?: TargetAudience[];
  products?: ProductService[];
  campaigns?: Campaign[];
  competitors?: Competitor[];
  templates?: Template[];
  generations?: Generation[];
}

// Page Discovery Types
export interface PageImage {
  url: string;
  source: string;
  finalScore: number;
  width?: number;
  height?: number;
  alt?: string;
  validated: boolean;
  contentType: string;
  size: number;
  context?: string;
}

export interface DiscoveredPage {
  url: string;
  relevanceScore: number;
  category: string;
  reason: string;
  title: string;
  headings: string[];
  textContent?: string;
  wordCount: number;
  images?: PageImage[];
  imageCount: number;
  scrapedAt: string;
  fetchMethod?: string;
}

export interface DiscoveryMetadata {
  totalPagesFound: number;
  sitemapsAnalyzed: string[];
  aiModel: string;
  analysisTime: string;
  scrapingEnabled: boolean;
}

export interface DiscoveryInsights {
  recommendedForAnalysis: string[];
  totalWordCount: number;
  successfulScrapes: number;
  coverage: {
    hasCompanyOverview: boolean;
    hasMission: boolean;
    hasServices: boolean;
    hasTeam: boolean;
    hasAwards: boolean;
    hasServiceArea: boolean;
    hasPortfolio: boolean;
  };
}

export interface DiscoverPagesResponse {
  success: boolean;
  url: string;
  timestamp: string;
  discoveryMetadata: DiscoveryMetadata;
  pages: DiscoveredPage[];
  insights: DiscoveryInsights;
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

// Ad Inspiration Types
export interface AdInspiration {
  id: string;
  brand_id?: string;
  foreplay_ad_id?: string;
  ad_data: AdMetadata;
  thumbnail_url: string;
  video_url?: string;
  platform: 'Facebook' | 'Instagram' | 'TikTok' | 'YouTube' | 'LinkedIn' | 'Pinterest' | 'Twitter';
  advertiser_name: string;
  niche?: string;
  ad_copy?: string;
  is_curated: boolean;
  saved_by_brand_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AdMetadata {
  first_seen?: string;
  last_seen?: string;
  cta?: string;
  landing_page?: string;
  is_live?: boolean;
  [key: string]: any;
}

export interface AdSearchParams {
  query?: string;
  platform?: string;
  niche?: string;
  limit?: number;
}

export interface ForeplaySearchResponse {
  success: boolean;
  data: ForeplayAd[];
  metadata?: {
    cursor?: string;
  };
}

export interface ForeplayAd {
  id: string;
  thumbnail: string;
  video?: string;
  copy: string;
  advertiser_name: string;
  platform: string;
  niche?: string;
  is_live: boolean;
  first_seen: string;
  last_seen: string;
  landing_page?: string;
  cta?: string;
}