
import React, { useState } from 'react';
import { Search, ShieldCheck, TrendingUp, Target, MessageSquare, Wand2, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { auditLinkedInProfile } from '../services/geminiService';
import { ProfileAuditResult } from '../types';

const ProfileAuditor: React.FC = () => {
  const [headline, setHeadline] = useState('');
  const [about, setAbout] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProfileAuditResult | null>(null);

  const handleAudit = async () => {
    if (!headline || !about) return;
    setLoading(true);
    try {
      const audit = await auditLinkedInProfile(headline, about);
      setResult(audit);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold font-display mb-2">LinkedIn Profile Auditor</h1>
          <p className="text-indigo-100 max-w-2xl">Paste your profile elements below. Our AI will analyze your brand strength and give you high-converting alternatives used by top 1% creators.</p>
        </div>
        <div className="absolute right-0 top-0 opacity-10 p-4">
          <ShieldCheck size={180} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Your Headline</label>
              <input 
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Founder at LinkedQueue | Helping SaaS teams grow"
                className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Your 'About' Section</label>
              <textarea 
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                rows={8}
                placeholder="Tell your story..."
                className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              />
            </div>
            <button 
              onClick={handleAudit}
              disabled={loading || !headline}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
            >
              {loading ? <RefreshCw className="animate-spin" /> : <Wand2 size={18} />}
              {loading ? 'Analyzing Profile...' : 'Audit My Profile'}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {result ? (
            <div className="animate-in slide-in-from-right duration-500 space-y-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-lg">Branding Score</h2>
                  <div className={`text-3xl font-black ${result.score > 80 ? 'text-emerald-500' : result.score > 50 ? 'text-amber-500' : 'text-red-500'}`}>
                    {result.score}/100
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Clarity</p>
                    <p className="text-xs font-medium">{result.analysis.clarity}</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Keywords</p>
                    <p className="text-xs font-medium">{result.analysis.keywords}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="font-bold text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-2">
                  <TrendingUp size={18} /> Optimized Headlines
                </h3>
                <div className="space-y-3">
                  {result.suggestions.headlines.map((h, i) => (
                    <div key={i} className="group relative p-3 border border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-xl hover:border-indigo-500 transition-colors cursor-pointer">
                      <p className="text-sm font-medium pr-8">{h}</p>
                      <button 
                        onClick={() => navigator.clipboard.writeText(h)}
                        className="absolute right-2 top-2 p-1 text-slate-400 opacity-0 group-hover:opacity-100"
                      >
                        <RefreshCw size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="font-bold text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-2">
                  <Target size={18} /> Proposed 'About' Intro
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic">
                  "{result.suggestions.about_intro}"
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 bg-slate-50 dark:bg-slate-900/30 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm mb-4">
                <AlertCircle className="text-slate-300" size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-400 mb-2">Analysis Pending</h3>
              <p className="text-sm text-slate-500 max-w-xs">Enter your profile details to see the magic happen.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileAuditor;
