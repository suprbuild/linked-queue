
export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  LIBRARY = 'LIBRARY',
  EDITOR = 'EDITOR',
  SCHEDULER = 'SCHEDULER',
  ANALYTICS = 'ANALYTICS',
  SETTINGS = 'SETTINGS',
  AUDITOR = 'AUDITOR'
}

export enum Tone {
  PROFESSIONAL = 'Professional',
  CASUAL = 'Casual',
  INSPIRATIONAL = 'Inspirational',
  CONTROVERSIAL = 'Controversial',
  EDUCATIONAL = 'Educational',
}

export enum PostStatus {
  DRAFT = 'draft',
  PUBLISHING = 'publishing', 
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published',
  FAILED = 'failed'
}

export type PlanType = 'free' | 'pro' | 'enterprise';

export interface UserProfileData {
  name: string;
  headline?: string;
  profile_picture?: string;
  connections?: number;
}

export interface User {
  id: string; 
  email: string;
  plan: PlanType;
  credits: number;
  profile_data: UserProfileData;
  ayrshare_key?: string; 
  deepseek_key?: string; 
  created_at?: string;
}

export interface InspirationPost {
  id: string; 
  title: string;
  content: string; 
  original_content?: string; 
  linkedin_url?: string;
  engagement_score: number;
  tags: string[];
  category: string;
  industry?: string;
  post_date?: string;
  screenshot_url?: string;
  featured: boolean;
  added_by?: string;
  author_name?: string; 
  original_author?: any; 
  author_headline?: string;
}

export interface GeneratedVariant {
  variant_id: string;
  content: string;
  tone: string;
  length: string;
  headline?: string; 
}

export interface PostMetrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
}

export interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  generated_variants: GeneratedVariant[];
  status: PostStatus;
  scheduled_time?: string;
  published_time?: string;
  linkedin_post_id?: string;
  ayrshare_id?: string; 
  error_log?: string; 
  platform: 'linkedin';
  media_urls: string[];
  hashtags: string[];
  metrics: PostMetrics;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsMetric {
  date: string;
  views: number;
  engagement: number;
}

export interface ProfileAuditResult {
  score: number;
  analysis: {
    clarity: string;
    keywords: string;
    cta: string;
    impact: string;
  };
  suggestions: {
    headlines: string[];
    about_intro: string;
  };
}
