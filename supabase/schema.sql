-- 1. Create Enums for Status Consistency
CREATE TYPE post_status AS ENUM ('draft', 'scheduled', 'publishing', 'published', 'failed');
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'admin');

-- 2. PROFILES TABLE (Public user data)
-- Automatically links to auth.users
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  headline TEXT,
  subscription_tier subscription_tier DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INTEGRATIONS TABLE
-- Stores connection tokens (Ayrshare, Unipile, or raw LinkedIn tokens)
CREATE TABLE integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL, -- e.g., 'ayrshare', 'linkedin_official'
  api_key TEXT, -- Store encrypted if possible, or raw for MVP
  profile_id TEXT, -- The LinkedIn Profile ID (URN)
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider) -- One key per provider per user
);

-- 4. POSTS TABLE (The Core Engine)
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL, -- The main text body
  media_urls TEXT[], -- Array of image URLs
  status post_status DEFAULT 'draft',
  
  -- Scheduling Fields
  scheduled_at TIMESTAMPTZ, -- When it should go out
  published_at TIMESTAMPTZ, -- When it actually went out
  
  -- Platform Data
  linkedin_post_id TEXT, -- The ID returned by LinkedIn/Ayrshare
  
  -- Analytics (JSONB allows flexibility as API changes)
  stats JSONB DEFAULT '{"views": 0, "likes": 0, "comments": 0, "shares": 0}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. VIRAL POSTS LIBRARY (Research/Inspiration)
-- Populated by you (the Admin), read by users
CREATE TABLE viral_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_content TEXT NOT NULL,
  category TEXT, -- e.g., 'SaaS', 'Marketing', 'Personal Story'
  tags TEXT[],
  hook_type TEXT, -- e.g., 'Controversial', 'Listicle'
  
  -- Metadata to prove virality
  original_likes INT,
  original_author TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. AI GENERATIONS (History)
-- Keeps track of what the AI built so users don't lose ideas
CREATE TABLE ai_generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  prompt_used TEXT,
  generated_output TEXT,
  is_saved BOOLEAN DEFAULT FALSE, -- If true, it was moved to 'posts' table
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ENABLE ROW LEVEL SECURITY (RLS) - CRITICAL FOR SAFETY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE viral_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;

-- 8. CREATE RLS POLICIES

-- Profiles: Users can see everyone's public profile, but edit only their own
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE USING (auth.uid() = id);

-- Integrations: STRICTLY PRIVATE. Only the user can see/edit their keys.
CREATE POLICY "Users manage their own integrations" 
ON integrations FOR ALL USING (auth.uid() = user_id);

-- Posts: Users only see/edit their own posts
CREATE POLICY "Users manage their own posts" 
ON posts FOR ALL USING (auth.uid() = user_id);

-- Viral Posts: Everyone can READ, only Admins can WRITE
-- (Assuming you have a way to identify admins, otherwise manual SQL insert for now)
CREATE POLICY "Everyone can read viral posts" 
ON viral_posts FOR SELECT USING (true);

-- AI Generations: Private to user
CREATE POLICY "Users see own AI history" 
ON ai_generations FOR ALL USING (auth.uid() = user_id);

-- 9. AUTOMATIC TRIGGER (Optional but recommended)
-- Automatically creates a profile row when a user signs up
create function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();