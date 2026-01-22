import React, { useState, useEffect } from 'react';
import { User, Save, Linkedin, Trash2, Key, CheckCircle, AlertCircle, RefreshCw, Loader2, Bot } from 'lucide-react';

interface SettingsProps {
  user: any;
  onUpdateUser: (userData: any) => Promise<boolean>;
  onLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onUpdateUser, onLogout }) => {
  // Profile State
  const [name, setName] = useState(user.profile_data.name);
  const [headline, setHeadline] = useState(user.profile_data.headline || '');
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isProfileSaved, setIsProfileSaved] = useState(false);

  // Integration State
  const [ayrshareKey, setAyrshareKey] = useState(user.ayrshare_key || '');
  const [deepseekKey, setDeepseekKey] = useState(user.deepseek_key || '');
  const [isKeySaving, setIsKeySaving] = useState(false);
  const [isKeySaved, setIsKeySaved] = useState(false);

  // Sync state with props if user data updates from parent (e.g. after save)
  useEffect(() => {
    setName(user.profile_data.name);
    setHeadline(user.profile_data.headline || '');
    setAyrshareKey(user.ayrshare_key || '');
    setDeepseekKey(user.deepseek_key || '');
  }, [user]);

  const handleSaveProfile = async () => {
    setIsProfileSaving(true);
    
    // Construct updated user object updating ONLY profile data
    const updatedUser = {
      ...user,
      profile_data: { 
        ...user.profile_data, 
        name, 
        headline 
      }
    };

    const success = await onUpdateUser(updatedUser);
    
    setIsProfileSaving(false);
    if (success) {
      setIsProfileSaved(true);
      setTimeout(() => setIsProfileSaved(false), 2000);
    }
  };

  const handleSaveIntegration = async () => {
    setIsKeySaving(true);
    
    // Construct updated user object updating ONLY integration data
    const updatedUser = {
      ...user,
      ayrshare_key: ayrshareKey,
      deepseek_key: deepseekKey
    };

    const success = await onUpdateUser(updatedUser);
    
    setIsKeySaving(false);
    if (success) {
      setIsKeySaved(true);
      setTimeout(() => setIsKeySaved(false), 2000);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-800 dark:text-white">Account Settings</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage your profile details and external integrations.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        
        {/* Section 1: Profile Information */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <User size={20} className="text-indigo-600 dark:text-indigo-400" /> 
              Profile Information
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Update your personal details displayed on your posts.</p>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
             {/* Avatar Column */}
             <div className="flex flex-col items-center gap-4">
                <div className="relative group cursor-pointer">
                  <img 
                    src={user.profile_data.profile_picture || "https://via.placeholder.com/100"} 
                    alt="Profile" 
                    className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 dark:border-slate-800 shadow-md transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-medium">Change</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-400 dark:text-slate-500">Avatar URL updates coming soon</p>
                </div>
             </div>

             {/* Fields Column */}
             <div className="md:col-span-2 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="e.g. Alex Sterling"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Professional Headline</label>
                  <input 
                    type="text" 
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="e.g. Founder @ LinkBrand.ai"
                  />
                </div>
                <div className="pt-2 flex justify-end">
                   <button 
                    onClick={handleSaveProfile}
                    disabled={isProfileSaving}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm ${
                      isProfileSaved 
                        ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                        : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white/90'
                    }`}
                  >
                    {isProfileSaving ? <Loader2 size={16} className="animate-spin" /> : isProfileSaved ? <CheckCircle size={16} /> : <Save size={16} />}
                    {isProfileSaving ? 'Saving...' : isProfileSaved ? 'Saved' : 'Save Profile'}
                  </button>
                </div>
             </div>
          </div>
        </div>

        {/* Section 2: Integrations */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
             <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Key size={20} className="text-indigo-600 dark:text-indigo-400" /> 
                    Integrations
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Connect third-party tools.</p>
                </div>
             </div>
          </div>

          <div className="p-6 space-y-6">
            
            {/* Ayrshare Integration */}
            <div className={`p-5 rounded-xl border transition-all ${
               user.ayrshare_key 
               ? 'bg-indigo-50/50 dark:bg-indigo-950/10 border-indigo-100 dark:border-indigo-900/50' 
               : 'bg-slate-50 dark:bg-slate-950/50 border-slate-100 dark:border-slate-800'
            }`}>
              <div className="flex items-start gap-4 mb-4">
                 <div className="w-12 h-12 bg-[#0077b5] text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                    <Linkedin size={28} />
                 </div>
                 <div className="flex-1">
                    <div className="flex justify-between items-center">
                       <h3 className="font-bold text-slate-900 dark:text-white">LinkedIn (via Ayrshare)</h3>
                        {user.ayrshare_key ? (
                          <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle size={10} strokeWidth={3} /> Active
                          </span>
                        ) : (
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">Inactive</span>
                        )}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                       Required for publishing posts to LinkedIn.
                    </p>
                 </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ayrshare API Key</label>
                <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="password" 
                      value={ayrshareKey}
                      onChange={(e) => setAyrshareKey(e.target.value)}
                      placeholder="AYRSHARE-KEY-..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm transition-all shadow-sm"
                    />
                </div>
              </div>
            </div>

            {/* DeepSeek Integration */}
            <div className={`p-5 rounded-xl border transition-all ${
               user.deepseek_key 
               ? 'bg-indigo-50/50 dark:bg-indigo-950/10 border-indigo-100 dark:border-indigo-900/50' 
               : 'bg-slate-50 dark:bg-slate-950/50 border-slate-100 dark:border-slate-800'
            }`}>
              <div className="flex items-start gap-4 mb-4">
                 <div className="w-12 h-12 bg-indigo-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                    <Bot size={28} />
                 </div>
                 <div className="flex-1">
                    <div className="flex justify-between items-center">
                       <h3 className="font-bold text-slate-900 dark:text-white">DeepSeek LLM</h3>
                        {user.deepseek_key ? (
                          <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle size={10} strokeWidth={3} /> Active
                          </span>
                        ) : (
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">Inactive</span>
                        )}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                       Alternative AI model for content generation.
                    </p>
                    <a 
                      href="https://platform.deepseek.com/api_keys" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-1 inline-block"
                    >
                      Get your API Key &rarr;
                    </a>
                 </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">DeepSeek API Key</label>
                <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="password" 
                      value={deepseekKey}
                      onChange={(e) => setDeepseekKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm transition-all shadow-sm"
                    />
                </div>
              </div>
            </div>

            {/* Integration Save Button */}
            <div className="flex justify-end pt-2">
                <button 
                  onClick={handleSaveIntegration}
                  disabled={isKeySaving}
                  className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm whitespace-nowrap flex items-center gap-2 ${
                    isKeySaved
                    ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
                  }`}
                >
                  {isKeySaving ? <Loader2 size={16} className="animate-spin" /> : isKeySaved ? <CheckCircle size={16} /> : <Save size={16} />}
                  {isKeySaving ? 'Saving...' : isKeySaved ? 'Saved' : 'Save Keys'}
                </button>
            </div>

          </div>
        </div>

        {/* Subscription Info */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-4">
               <div>
                  <h3 className="font-bold text-lg mb-1 flex items-center gap-2"><CheckCircle size={18} /> Pro Plan Active</h3>
                  <p className="text-indigo-100 text-sm opacity-90">You have 50 AI credits remaining this month.</p>
               </div>
               <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/40 text-white px-5 py-2 rounded-lg text-sm font-bold transition-colors">
                  Manage Subscription
               </button>
            </div>
            <div className="absolute right-0 top-0 opacity-10 p-4 transform translate-x-10 -translate-y-10">
              <User size={140} />
            </div>
        </div>

        {/* Danger Zone */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-8">
           <h3 className="text-sm font-bold text-red-500 mb-4 uppercase tracking-wider flex items-center gap-2">
              <AlertCircle size={16} /> Danger Zone
           </h3>
           <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                 <h4 className="font-bold text-slate-800 dark:text-red-200 text-sm">Delete Account</h4>
                 <p className="text-xs text-slate-500 dark:text-red-300/70 mt-1">Once you delete your account, there is no going back. Please be certain.</p>
              </div>
              <button 
                 onClick={onLogout} // Re-using logout for demo purposes
                 className="flex items-center gap-2 bg-white dark:bg-red-950 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/50 transition-colors shadow-sm"
              >
                <Trash2 size={16} /> Delete Account
              </button>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;