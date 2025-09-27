// Brand Types
export interface BrandAsset {
  logos: Logo[];
  colors: BrandColor[];
  fonts: Font[];
  url?: string;
  name?: string;
}

export interface Logo {
  type: string;
  format: string;
  url: string;
}

export interface BrandColor {
  hex: string;
  name: string;
}

export interface Font {
  family: string;
  category: string;
  weight: string;
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