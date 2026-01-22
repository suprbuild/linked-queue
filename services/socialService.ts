import { supabase } from '../supabaseClient';
import { Post, PostStatus, InspirationPost } from '../types';
import { MOCK_INSPIRATION } from '../constants';

interface PostResult {
  success: boolean;
  message: string;
  post?: Post;
}

export interface LinkedInOptions {
  visibility?: 'public' | 'connections' | 'loggedin';
  disableShare?: boolean;
  title?: string;
  altText?: string[];
  thumbNail?: string;
  titles?: string[];
  targeting?: {
    countries?: string[];
    seniorities?: string[];
    industries?: string[];
    degrees?: string[];
    fieldsOfStudy?: string[];
    jobFunctions?: string[];
    staffCountRanges?: string[];
  };
}

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const updatePostStatus = async (id: string, status: PostStatus, errorMsg: string) => {
  const { error } = await supabase.from('posts').update({
    status: status,
    error_log: errorMsg,
    updated_at: new Date().toISOString()
  }).eq('id', id);
  
  if (error) {
    console.error("CRITICAL: Failed to update post status in DB:", error);
  }
};

const callAyrshare = async (endpoint: string, method: string, body: any, apiKey: string) => {
  try {
    const response = await fetch(`https://app.ayrshare.com/api${endpoint}`, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `API Error: ${response.status} ${response.statusText}`);
    }
    return data;
  } catch (error: any) {
    throw error;
  }
};

/**
 * Workflow: POST NOW
 * Step A: Save/Update in Supabase (status: PUBLISHING)
 * Step B: Call Ayrshare API
 * Step C: Update Supabase (status: PUBLISHED)
 * Step D: Update Supabase (status: FAILED) if error occurs
 */
export const publishPostNow = async (
  userId: string,
  title: string,
  content: string,
  apiKey: string,
  mediaUrls: string[] = [],
  options: LinkedInOptions = {},
  variants: any[] = [],
  existingPostId?: string
): Promise<PostResult> => {
  const postId = existingPostId || generateUUID();
  
  const initialData = {
    id: postId,
    user_id: userId,
    title: title || "Untitled Post",
    content: content,
    status: PostStatus.PUBLISHING, // Step A
    media_urls: mediaUrls,
    generated_variants: variants,
    platform: 'linkedin',
    updated_at: new Date().toISOString(),
    created_at: existingPostId ? undefined : new Date().toISOString(),
    metrics: { views: 0, likes: 0, comments: 0, shares: 0 },
    hashtags: []
  };

  // Step A: Immediate DB Record
  const { error: stepAError } = await supabase.from('posts').upsert(initialData);
  if (stepAError) {
    return { success: false, message: `Step A Failed: ${stepAError.message}` };
  }

  // Step B: API Call
  try {
    const postBody = {
      post: content,
      platforms: ["linkedin"],
      mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
      linkedInOptions: {
        visibility: options.visibility || 'public',
        disableShare: options.disableShare,
        title: options.title,
        altText: options.altText,
        thumbNail: options.thumbNail,
        targeting: options.targeting
      }
    };

    const apiResponse = await callAyrshare('/post', 'POST', postBody, apiKey);

    // Step C: Success Update
    const linkedinId = apiResponse.id || (apiResponse.postIds ? apiResponse.postIds[0].id : null);
    const ayrshareId = apiResponse.refId || null;

    const updates = {
      status: PostStatus.PUBLISHED,
      linkedin_post_id: linkedinId,
      ayrshare_id: ayrshareId,
      published_time: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await supabase.from('posts').update(updates).eq('id', postId);

    return { 
      success: true, 
      message: "Published successfully!", 
      post: { ...initialData, ...updates } as Post 
    };

  } catch (error: any) {
    // Step D: Failure Logging
    const errorMsg = error.message || "Unknown publication error";
    await updatePostStatus(postId, PostStatus.FAILED, errorMsg);
    return { success: false, message: errorMsg };
  }
};

/**
 * Workflow: SCHEDULE POST
 * Step A: Save/Update in Supabase (status: SCHEDULED)
 * Step B: Call Ayrshare API with scheduleDate
 * Step C: Update Supabase with Ayrshare tracking ID
 */
export const schedulePost = async (
  userId: string,
  title: string,
  content: string,
  apiKey: string,
  scheduleDate: string,
  mediaUrls: string[] = [],
  options: LinkedInOptions = {},
  variants: any[] = [],
  existingPostId?: string
): Promise<PostResult> => {
  const postId = existingPostId || generateUUID();
  
  const initialData = {
    id: postId,
    user_id: userId,
    title: title || "Untitled Post",
    content: content,
    status: PostStatus.SCHEDULED, // Step A
    scheduled_time: scheduleDate,
    media_urls: mediaUrls,
    generated_variants: variants,
    platform: 'linkedin',
    updated_at: new Date().toISOString(),
    created_at: existingPostId ? undefined : new Date().toISOString(),
    metrics: { views: 0, likes: 0, comments: 0, shares: 0 },
    hashtags: []
  };

  // Step A: DB Sync
  const { error: stepAError } = await supabase.from('posts').upsert(initialData);
  if (stepAError) {
    return { success: false, message: `Step A Failed: ${stepAError.message}` };
  }

  // Step B: API Scheduling
  try {
    const postBody = {
      post: content,
      platforms: ["linkedin"],
      mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
      scheduleDate: scheduleDate,
      linkedInOptions: {
        visibility: options.visibility || 'public',
        disableShare: options.disableShare,
        title: options.title,
        altText: options.altText,
        targeting: options.targeting
      }
    };

    const apiResponse = await callAyrshare('/post', 'POST', postBody, apiKey);

    // Step C: Tracking Update
    const ayrshareId = apiResponse.id || (apiResponse.postIds ? apiResponse.postIds[0].id : null);
    const updates = {
      ayrshare_id: ayrshareId,
      updated_at: new Date().toISOString()
    };

    await supabase.from('posts').update(updates).eq('id', postId);

    return { 
      success: true, 
      message: "Scheduled successfully!", 
      post: { ...initialData, ...updates } as Post 
    };

  } catch (error: any) {
    const errorMsg = error.message || "Failed to schedule post";
    await updatePostStatus(postId, PostStatus.FAILED, errorMsg);
    return { success: false, message: errorMsg };
  }
};

export const syncPostAnalytics = async (post: Post, apiKey: string): Promise<boolean> => {
  const idToFetch = post.ayrshare_id || post.linkedin_post_id;
  if (!idToFetch) return false;

  try {
    const data = await callAyrshare('/analytics/post', 'POST', {
      id: idToFetch,
      platforms: ["linkedin"]
    }, apiKey);

    if (data.status === "error") return false;

    const liStats = data.linkedin || (data.series && data.series.linkedin) || {};
    const newMetrics = {
      views: liStats.impressions || liStats.views || post.metrics.views || 0,
      likes: liStats.likes || liStats.reactions || post.metrics.likes || 0,
      comments: liStats.comments || post.metrics.comments || 0,
      shares: liStats.shares || post.metrics.shares || 0
    };

    await supabase.from('posts').update({
      metrics: newMetrics,
      updated_at: new Date().toISOString()
    }).eq('id', post.id);

    return true;
  } catch (error) {
    return false;
  }
};

export const fetchInspirationPosts = async (): Promise<InspirationPost[]> => {
  try {
    const { data, error } = await supabase
      .from('viral_posts')
      .select('*')
      .order('engagement_score', { ascending: false })
      .limit(50);

    if (error) throw error;
    if (!data || data.length === 0) return MOCK_INSPIRATION;
    return data.map(post => ({ ...post, tags: post.tags || [] })) as InspirationPost[];
  } catch (e) {
    return MOCK_INSPIRATION;
  }
};

export const deletePost = async (apiKey: string, id: string) => {
  try {
    const data = await callAyrshare('/post', 'DELETE', { id }, apiKey);
    return { success: true, response: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};