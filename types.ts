
export interface LinkData {
  id: string;
  originalUrl: string;
  shortCode: string;
  alias?: string;
  createdAt: number;
  clicks: number;
  password?: string;
  expiryDate?: string;
  category?: string;
  safetyScore?: number;
  tags?: string[];
  blockBots?: boolean;
}

export interface ShortenOptions {
  customAlias?: string;
  password?: string;
  expiryDate?: string;
  aiSuggested?: boolean;
  blockBots?: boolean;
}

export interface GeminiAnalysis {
  safetyRating: number;
  suggestedAliases: string[];
  category: string;
  summary: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  plan: 'free' | 'pro';
}
