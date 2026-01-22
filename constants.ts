
import { InspirationPost, Post, PostStatus, AnalyticsMetric, User } from './types';

export const CURRENT_USER: User = {
  id: '00000000-0000-0000-0000-000000000000', // Valid UUID format to prevent DB errors
  email: 'alex@linkbrand.ai',
  plan: 'pro',
  credits: 50,
  profile_data: {
    name: "Alex Sterling",
    headline: "Founder @ LinkBrand.ai | SaaS Growth Expert",
    profile_picture: "https://picsum.photos/100/100",
    connections: 5430
  }
};

export const MOCK_INSPIRATION: InspirationPost[] = [
  {
    id: '1',
    title: "Consistency is Key",
    author_name: "Sarah Jenkins",
    original_author: "Sarah Jenkins",
    author_headline: "CMO at TechFlow",
    content: "Stop trying to be perfect. Start trying to be consistent. \n\nI posted on LinkedIn every day for 30 days. Here's what happened:\n- Profile views up 400%\n- 3 inbound leads\n- 1 job offer\n\nConsistency is the only cheat code.",
    original_content: "Stop trying to be perfect. Start trying to be consistent. \n\nI posted on LinkedIn every day for 30 days. Here's what happened:\n- Profile views up 400%\n- 3 inbound leads\n- 1 job offer\n\nConsistency is the only cheat code.",
    tags: ["Growth", "PersonalBranding", "Consistency"],
    engagement_score: 95,
    category: "viral",
    featured: true,
    linkedin_url: "https://linkedin.com/post/123",
    industry: "Tech"
  },
  {
    id: '2',
    title: "Technical Debt Framework",
    author_name: "David Chen",
    original_author: "David Chen",
    author_headline: "Senior Engineer @ Google",
    content: "We need to talk about technical debt. \n\nIt's not just code. It's processes, it's documentation, it's onboarding.\n\nHere is my framework for paying down debt without halting feature work...",
    original_content: "We need to talk about technical debt. \n\nIt's not just code. It's processes, it's documentation, it's onboarding.\n\nHere is my framework for paying down debt without halting feature work...",
    tags: ["Engineering", "Leadership", "Productivity"],
    engagement_score: 88,
    category: "educational",
    featured: false,
    linkedin_url: "https://linkedin.com/post/456",
    industry: "Software"
  },
  {
    id: '3',
    title: "Fundraising Truths",
    author_name: "Elena Rodriguez",
    original_author: "Elena Rodriguez",
    author_headline: "Startup Advisor",
    content: "Unpopular opinion: Fundraising is a distraction for 90% of startups.\n\nFocus on customers. Focus on revenue.\n\nVC money is jet fuel. If you don't have an engine yet, you'll just burn up.",
    original_content: "Unpopular opinion: Fundraising is a distraction for 90% of startups.\n\nFocus on customers. Focus on revenue.\n\nVC money is jet fuel. If you don't have an engine yet, you'll just burn up.",
    tags: ["Startups", "VentureCapital", "Advice"],
    engagement_score: 92,
    category: "trending",
    featured: true,
    linkedin_url: "https://linkedin.com/post/789",
    industry: "Venture Capital"
  }
];

export const MOCK_POSTS: Post[] = [
  {
    id: '101',
    user_id: '00000000-0000-0000-0000-000000000000',
    title: "AI in 2024",
    content: "Artificial Intelligence isn't coming. It's here. \n\nAre you ready for the shift?",
    status: PostStatus.PUBLISHED,
    published_time: '2023-10-25T10:00:00Z',
    created_at: '2023-10-24T09:00:00Z',
    updated_at: '2023-10-25T10:00:00Z',
    metrics: { views: 12500, likes: 450, comments: 23, shares: 12 },
    generated_variants: [],
    platform: 'linkedin',
    media_urls: [],
    hashtags: ['AI', 'Future']
  },
  {
    id: '102',
    user_id: '00000000-0000-0000-0000-000000000000',
    title: "Remote Work Tips",
    content: "3 tips for better remote work:\n1. Dedicated space\n2. Async first\n3. Over-communicate",
    status: PostStatus.SCHEDULED,
    scheduled_time: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metrics: { views: 0, likes: 0, comments: 0, shares: 0 },
    generated_variants: [],
    platform: 'linkedin',
    media_urls: [],
    hashtags: ['RemoteWork']
  },
  {
    id: '103',
    user_id: '00000000-0000-0000-0000-000000000000',
    title: "Leadership lessons",
    content: "Drafting some thoughts on servant leadership...",
    status: PostStatus.DRAFT,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metrics: { views: 0, likes: 0, comments: 0, shares: 0 },
    generated_variants: [],
    platform: 'linkedin',
    media_urls: [],
    hashtags: []
  }
];

export const MOCK_ANALYTICS: AnalyticsMetric[] = [
  { date: 'Mon', views: 400, engagement: 240 },
  { date: 'Tue', views: 300, engagement: 139 },
  { date: 'Wed', views: 200, engagement: 980 },
  { date: 'Thu', views: 278, engagement: 390 },
  { date: 'Fri', views: 189, engagement: 480 },
  { date: 'Sat', views: 239, engagement: 380 },
  { date: 'Sun', views: 349, engagement: 430 },
];
