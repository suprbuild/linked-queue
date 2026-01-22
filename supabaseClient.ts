
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bkiciqchjarxumbbhpkf.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJraWNpcWNoamFyeHVtYmJocGtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwOTE4NjksImV4cCI6MjA3OTY2Nzg2OX0.A3Jd2xAt_YPYZgCBWkYE6F98X6dv3i5lUBPeyIExsAk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
