
import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, TrendingUp, Users, MousePointer, Filter, Copy, RefreshCw, AlertTriangle } from 'lucide-react';
import { MOCK_ANALYTICS } from '../constants';
import { Post, PostStatus, User } from '../types';
import { syncPostAnalytics } from '../services/socialService';

interface AnalyticsProps {
  user: User;
  posts?: Post[];
  onDuplicatePost?: (post: Post) => void;
  refreshPosts?: () => void;
  showToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const Analytics: React.FC<AnalyticsProps> = ({ user, posts = [], onDuplicatePost, refreshPosts, showToast }) => {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedType, setSelectedType] = useState('All');
  const [loadingSync, setLoadingSync] = useState(false);

  const filteredPosts = useMemo(() => {
    let filtered = [...posts];
    if (dateRange.start) filtered = filtered.filter(p => new Date(p.created_at) >= new Date(dateRange.start));
    if (dateRange.end) filtered = filtered.filter(p => new Date(p.created_at) <= new Date(dateRange.end));
    return filtered;
  }, [posts, dateRange, selectedType]);

  const pieData = [
    { name: 'Educational', value: 45, color: '#4361EE' },
    { name: 'Viral/Story', value: 30, color: '#818cf8' },
    { name: 'Industry News', value: 15, color: '#a5b4fc' },
    { name: 'Promotional', value: 10, color: '#c7d2fe' },
  ];

  // Logic to Sync Data from Ayrshare for Published Posts
  const handleSyncAnalytics = async () => {
    if (!user.ayrshare_key) {
      if (showToast) showToast("Missing Ayrshare API Key in settings.", "error");
      return;
    }

    setLoadingSync(true);
    let successCount = 0;
    
    // Only sync posts that are published and have some form of ID (Ayrshare ID or LinkedIn ID)
    const postsToSync = posts.filter(p => 
      p.status === PostStatus.PUBLISHED && 
      (p.linkedin_post_id || p.ayrshare_id)
    );

    if (postsToSync.length === 0) {
      if (showToast) showToast("No connected posts found to sync.", "info");
      setLoadingSync(false);
      return;
    }

    if (showToast) showToast(`Syncing analytics for ${postsToSync.length} posts...`, "info");

    // Sync sequentially to avoid hitting rate limits too hard
    for (const post of postsToSync) {
      const result = await syncPostAnalytics(post, user.ayrshare_key);
      if (result) successCount++;
    }

    if (successCount > 0) {
      if (refreshPosts) refreshPosts(); // Reload DB data from parent
      if (showToast) showToast(`Synced ${successCount}/${postsToSync.length} posts successfully.`, "success");
    } else {
      if (showToast) showToast("Failed to sync posts. Check API Key.", "error");
    }

    setLoadingSync(false);
  };

  return (
    <div className="space-y-6 h-full flex flex-col overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-800 dark:text-white">Performance Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400">Track your personal brand growth.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
           <button 
              onClick={handleSyncAnalytics} 
              disabled={loadingSync}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors"
           >
             <RefreshCw size={16} className={loadingSync ? "animate-spin" : ""} /> 
             {loadingSync ? "Syncing..." : "Refresh Data"}
           </button>
           <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 pr-3 shadow-sm">
              <div className="px-2 text-slate-400"><Filter size={14} /></div>
              <input type="date" className="text-xs bg-transparent outline-none" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
              <span className="text-slate-300">-</span>
              <input type="date" className="text-xs bg-transparent outline-none" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
           </div>
           <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 text-sm font-medium shadow-sm">
            <Download size={16} /> Export
           </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-2">
               <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><TrendingUp size={18} /></div>
               <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+12%</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
               {posts.reduce((acc, curr) => acc + (curr.metrics.views || 0), 0).toLocaleString()}
            </h3>
            <p className="text-xs text-slate-500">Total Views</p>
         </div>
         <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-2">
               <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Users size={18} /></div>
               <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+85</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{user.profile_data.connections}</h3>
            <p className="text-xs text-slate-500">Connections</p>
         </div>
         <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-2">
               <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><MousePointer size={18} /></div>
               <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">0%</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
               {posts.length > 0 ? (posts.reduce((acc, curr) => acc + (curr.metrics.likes + curr.metrics.comments), 0) / (posts.reduce((acc, curr) => acc + curr.metrics.views, 0) || 1) * 100).toFixed(1) : 0}%
            </h3>
            <p className="text-xs text-slate-500">Avg. Engagement</p>
         </div>
         <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
             <div className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Most Liked Post</div>
             {(() => {
                const bestPost = [...posts].sort((a,b) => b.metrics.likes - a.metrics.likes)[0];
                return bestPost ? (
                  <>
                     <div className="font-semibold text-slate-800 dark:text-white text-sm line-clamp-2 mb-1">{bestPost.title}</div>
                     <div className="mt-2 text-xs text-emerald-600 font-bold bg-emerald-50 inline-block px-2 py-0.5 rounded">{bestPost.metrics.likes} likes</div>
                  </>
                ) : <div className="text-sm text-slate-500">No data available</div>;
             })()}
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-6">Engagement Trends</h3>
          <div className="h-[300px] w-full min-w-0">
            <ResponsiveContainer width="99%" height="100%">
              <LineChart data={MOCK_ANALYTICS}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip />
                <Line type="monotone" dataKey="engagement" stroke="#4361EE" strokeWidth={3} dot={{r: 4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Content Types</h3>
          <div className="h-[200px] w-full min-w-0 flex-grow">
             <ResponsiveContainer width="99%" height="100%">
               <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                     {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
               </PieChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-semibold text-slate-800 dark:text-white">Post Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-medium text-xs uppercase">
              <tr>
                <th className="px-6 py-3">Post Title</th>
                <th className="px-6 py-3">Published Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Views</th>
                <th className="px-6 py-3 text-right">Likes</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPosts.length === 0 ? (
                <tr className="text-center text-slate-400"><td colSpan={6} className="py-8">No posts found.</td></tr>
              ) : (
                filteredPosts.map(post => (
                  <tr key={post.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200 max-w-xs truncate">{post.title}</td>
                    <td className="px-6 py-4">{new Date(post.published_time || post.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${
                         post.status === PostStatus.PUBLISHED ? 'bg-emerald-100 text-emerald-700' : 
                         post.status === PostStatus.FAILED ? 'bg-red-100 text-red-700' :
                         'bg-amber-100 text-amber-700'
                      }`}>
                         {post.status}
                      </span>
                      {post.status === PostStatus.FAILED && (
                        <div className="text-[10px] text-red-500 mt-1 max-w-[150px] truncate" title={post.error_log}>{post.error_log}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">{post.metrics.views}</td>
                    <td className="px-6 py-4 text-right">{post.metrics.likes}</td>
                    <td className="px-6 py-4 text-right">
                       <button onClick={() => onDuplicatePost && onDuplicatePost(post)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600"><Copy size={16} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
