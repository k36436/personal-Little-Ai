
export enum AppView {
  CHAT = 'chat',
  VISION = 'vision',
  LIVE = 'live',
  SEARCH = 'search',
  VIDEO = 'video',
  IMAGE = 'image',
  DRAWING = 'drawing',
  MINDMAP = 'mindmap',
  FLOWCHART = 'flowchart',
  FILE_ANALYSIS = 'file_analysis',
  HISTORY = 'history',
  COMPANY_INSIGHTS = 'company_insights',
  WELLNESS = 'wellness',
  SETTINGS = 'settings',
  CODE = 'code',
  VAULT_EXPLORER = 'vault_explorer',
  VIDEO_TO_LYRICS = 'video_to_lyrics',
  APP_BUILDER = 'app_builder',
  APP_ANALYST = 'app_analyst',
  API_ARCHITECT = 'api_architect'
}

export interface MemoryEntry {
  id: string;
  content: string;
  timestamp: number;
}

export interface User {
  username: string;
  name: string; // Display name
  fullName: string;
  phone: string;
  gender: 'male' | 'female' | 'other' | '';
  credit: number;
  birthday: {
    day: string;
    month: string;
    year: string;
  };
  isLoggedIn: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
  startTime: number; // For the 1-hour session protocol
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  type?: 'text' | 'image' | 'video' | 'search';
  attachments?: string[];
  groundingUrls?: { title: string; uri: string }[];
}

export interface SearchResult {
  title: string;
  uri: string;
}

export interface LinkedInCompanyInfo {
  success: boolean;
  message: string;
  data: {
    id: string;
    name: string;
    universalName: string;
    linkedinUrl: string;
    tagline: string;
    description: string;
    type: string;
    staffCount: number;
    followerCount: number;
    website: string;
    industries: string[];
    specialities: string[];
    Images: {
      logo: string;
      cover: string;
    };
    headquarter: {
      city: string;
      country: string;
      line1: string;
      postalCode: string;
    };
    locations: Array<{
      city: string;
      country: string;
      line1: string;
      headquarter?: boolean;
    }>;
  };
}
