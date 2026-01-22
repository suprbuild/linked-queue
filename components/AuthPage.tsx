
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Mail, Lock, ShieldCheck, Sun, Moon, AlertCircle, Loader2, Linkedin } from 'lucide-react';

interface AuthPageProps {
  onLogin: (session: any) => void;
  isDarkMode?: boolean;
  toggleTheme?: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin, isDarkMode = false, toggleTheme }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: email.split('@')[0], // Provide default name to satisfy DB trigger
              avatar_url: ""
            }
          }
        });
        if (error) throw error;
        if (data.session) {
          // If auto-confirm is enabled
          onLogin(data.session);
        } else {
          alert('Check your email for the confirmation link!');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.session) onLogin(data.session);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedInLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      // Note: The Client ID and Secret must be configured in the Supabase Dashboard
      // under Authentication > Providers > LinkedIn.
      // Redirect URL in LinkedIn App must be: https://bkiciqchjarxumbbhpkf.supabase.co/auth/v1/callback
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin',
        options: {
          redirectTo: window.location.origin,
          // Using standard OIDC scopes. 
          // Note: 'w_member_social' is removed as posting is handled via Ayrshare API integration,
          // and keeping it here might cause login errors if the 'Share on LinkedIn' product 
          // is not explicitly enabled in the LinkedIn Developer Portal for this Auth app.
          scopes: 'openid profile email', 
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
      // Redirect happens automatically
    } catch (err: any) {
      console.error("LinkedIn Login Error:", err);
      setError(err.message || "Failed to initiate LinkedIn login");
      setLoading(false);
    }
  };

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors duration-200">
        
        {toggleTheme && (
           <div className="absolute top-4 right-4">
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 shadow-sm"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
           </div>
        )}

        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl dark:shadow-slate-900/50 overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-300">
          
          {/* Header */}
          <div className="bg-slate-900 dark:bg-indigo-950 p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-slate-900 to-slate-900"></div>
            <div className="relative z-10">
              <div className="grid grid-cols-2 gap-0.5 w-16 h-16 mx-auto mb-4 rounded-xl overflow-hidden shadow-lg">
                 <div className="bg-indigo-600 rounded-tl-[16px]"></div>
                 <div className="bg-indigo-600 rounded-tr-[6px]"></div>
                 <div className="bg-indigo-600 rounded-bl-[6px]"></div>
                 <div className="bg-indigo-600 rounded-br-[16px]"></div>
              </div>
              <h1 className="text-2xl font-bold font-display text-white mb-2">LinkedQueue</h1>
              <p className="text-indigo-200">Sign in to your dashboard</p>
            </div>
          </div>

          {/* Form */}
          <div className="p-8 space-y-6">
            
            <button 
              type="button"
              onClick={handleLinkedInLogin}
              disabled={loading}
              className="w-full bg-[#0077b5] hover:bg-[#006097] text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Linkedin size={20} />}
              <span>Sign in with LinkedIn</span>
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-slate-900 px-2 text-slate-500 dark:text-slate-400">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} /> {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-slate-100"
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-slate-100"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
              >
                {loading && <Loader2 className="animate-spin" size={20} />}
                {isSignUp ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <div className="text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}
                <button 
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="ml-1 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                >
                  {isSignUp ? "Sign In" : "Sign Up"}
                </button>
              </p>
            </div>
            
            <div className="flex justify-center gap-4 text-slate-400 dark:text-slate-500 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1 text-xs">
                 <ShieldCheck size={12} /> Secure Connection
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
