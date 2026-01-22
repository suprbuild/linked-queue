
export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  LIBRARY = 'LIBRARY',
  EDITOR = 'EDITOR',
  SCHEDULER = 'SCHEDULER',
  ANALYTICS = 'ANALYTICS',
  SETTINGS = 'SETTINGS',
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
  PUBLISHING = 'publishing', // Added for the interim state
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
  id: string; // Supabase UUID
  email: string;
  plan: PlanType;
  credits: number;
  profile_data: UserProfileData;
  ayrshare_key?: string; // Stored locally or in secure profile table
  deepseek_key?: string; // Stored locally or in secure profile table
  created_at?: string;
}

export interface InspirationPost {
  id: string; 
  title: string;
  content: string; // Kept for legacy/fallback
  original_content?: string; // New field from DB
  linkedin_url?: string;
  engagement_score: number;
  tags: string[];
  category: string;
  industry?: string;
  post_date?: string;
  screenshot_url?: string;
  featured: boolean;
  added_by?: string;
  author_name?: string; // Kept for legacy/fallback
  original_author?: any; // New field from DB (could be string or json)
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
  ayrshare_id?: string; // ID returned by Ayrshare for scheduling/tracking
  error_log?: string; // To track why a post failed
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
