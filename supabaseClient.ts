
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uguexkwrqoiagarmiiie.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVndWV4a3dycW9pYWdhcm1paWllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwOTE4NjksImV4cCI6MjA3OTY2Nzg2OX0.PlaceholderKeyReplaceInDashboard';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
