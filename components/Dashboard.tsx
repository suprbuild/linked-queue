import React from 'react';
import { Activity, Calendar, FileText, Search, Zap, Copy, Edit3, Trash2, Clock } from 'lucide-react';
import { PostStatus, ViewState, Post, User } from '../types';
import { deletePost } from '../services/socialService';

interface DashboardProps {
  user: User;
  changeView: (view: ViewState) => void;
  posts: Post[];
  onDuplicatePost: (post: Post) => void;
  onDeletePost: (postId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, changeView, posts, onDuplicatePost, onDeletePost }) => {
  const publishedCount = posts.filter(p => p.status === PostStatus.PUBLISHED).length;
  const scheduledPosts = posts.filter(p => p.status === PostStatus.SCHEDULED);
  const nextScheduled = scheduledPosts.length > 0 
    ? new Date(scheduledPosts.sort((a,b) => new Date(a.scheduled_time!).getTime() - new Date(b.scheduled_time!).getTime())[0].scheduled_time!) 
    : null;

  const handleDelete = async (post: Post) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    // If published via Ayrshare, try to delete from social networks first
    if (post.status === PostStatus.PUBLISHED && post.linkedin_post_id && user.ayrshare_key) {
      const result = await deletePost(user.ayrshare_key, post.linkedin_post_id);
      if (!result.success) {
        // We warn but allow local deletion
        alert(`Warning: Failed to delete from social network: ${result.error}. Deleting locally.`);
      } else {
        console.log("Deleted from social network:", result.response);
      }
    }
    
    onDeletePost(post.id);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full">
      {/* Column 2: Main Content Area (Spans 2 columns on large screens) */}
      <div className="xl:col-span-2 space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400">Welcome back, {(user.profile_data.name || 'User').split(' ')[0]}</p>
        </div>

        {/* Section A: Quick Actions Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button 
            onClick={() => changeView(ViewState.EDITOR)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-between group"
          >
            <div className="text-left">
              <h3 className="font-semibold text-lg">Create New Post</h3>
              <p className="text-indigo-100 text-xs opacity-90">Draft with AI magic</p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText size={20} className="text-white" />
            </div>
          </button>

          <button 
            onClick={() => changeView(ViewState.LIBRARY)}
            className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm transition-all flex items-center justify-between group"
          >
            <div className="text-left">
              <h3 className="font-semibold text-lg">Browse Inspiration</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs">Find viral ideas</p>
            </div>
            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform text-slate-600 dark:text-slate-300">
              <Search size={20} />
            </div>
          </button>
        </div>

        {/* Section B: Recent Activity Feed */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h2 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <Activity size={18} className="text-indigo-600 dark:text-indigo-400" /> Recent Activity
            </h2>
            <button onClick={() => changeView(ViewState.ANALYTICS)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">View All</button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {posts.slice(0, 5).map((post) => (
              <div key={post.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex-shrink-0 flex items-center justify-center text-slate-400 dark:text-slate-500 font-bold text-xs">
                   {post.media_urls.length > 0 ? 'IMG' : 'TXT'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate pr-2">{post.title || "Untitled Post"}</h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize flex-shrink-0 ${
                       post.status === PostStatus.PUBLISHED ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                       post.status === PostStatus.SCHEDULED ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {post.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{post.content}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => onDuplicatePost(post)}
                    className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    title="Duplicate Post"
                  >
                    <Copy size={16} />
                  </button>
                  <button 
                    onClick={() => changeView(ViewState.EDITOR)} // Should ideally load post into editor
                    className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    title="Edit Post"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(post)}
                    className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Delete Post"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {posts.length === 0 && (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                No posts yet. Create your first post!
              </div>
            )}
          </div>
        </div>

        {/* Section C: Upcoming Schedule (Mini-Timeline) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
           <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h2 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <Calendar size={18} className="text-indigo-600 dark:text-indigo-400" /> Upcoming Schedule
            </h2>
            <button onClick={() => changeView(ViewState.SCHEDULER)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">Open Calendar</button>
          </div>
          <div className="p-5">
             {scheduledPosts.length > 0 ? (
               <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                 {scheduledPosts.map(post => {
                   const date = new Date(post.scheduled_time!);
                   return (
                     <div key={post.id} className="min-w-[140px] p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex flex-col gap-2">
                       <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                         {date.toLocaleDateString('en-US', {weekday: 'short', day: 'numeric'})}
                       </div>
                       <div className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
                         {post.title}
                       </div>
                       <div className="text-[10px] text-slate-500 dark:text-slate-400">
                         {date.toLocaleTimeString('en-US', {hour: 'numeric', minute:'2-digit'})}
                       </div>
                     </div>
                   );
                 })}
               </div>
             ) : (
               <div className="text-center py-6 text-slate-400 dark:text-slate-600 text-sm">No upcoming posts scheduled.</div>
             )}
          </div>
        </div>
      </div>

      {/* Column 3: Stats Widget */}
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
           <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-4">Monthly Overview</h3>
           
           <div className="space-y-6">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                       <FileText size={20} />
                    </div>
                    <div>
                       <p className="text-xs text-slate-500 dark:text-slate-400">Published</p>
                       <p className="text-lg font-bold text-slate-800 dark:text-white">{publishedCount} Posts</p>
                    </div>
                 </div>
                 <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 px-2 py-1 rounded-full">+4</span>
              </div>

              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                       <Activity size={20} />
                    </div>
                    <div>
                       <p className="text-xs text-slate-500 dark:text-slate-400">Engagement Rate</p>
                       <p className="text-lg font-bold text-slate-800 dark:text-white">3.8%</p>
                    </div>
                 </div>
                 <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 px-2 py-1 rounded-full">+0.5%</span>
              </div>

               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                       <Clock size={20} />
                    </div>
                    <div>
                       <p className="text-xs text-slate-500 dark:text-slate-400">Next Scheduled</p>
                       <p className="text-sm font-bold text-slate-800 dark:text-white">
                         {nextScheduled 
                           ? nextScheduled.toLocaleDateString('en-US', {month:'short', day:'numeric', hour:'numeric'})
                           : "None"
                         }
                       </p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Quick Tips Carousel */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
              <Zap size={64} />
           </div>
           <div className="relative z-10">
             <div className="flex items-center gap-2 mb-3">
                <Zap size={18} className="text-amber-400" />
                <h3 className="font-bold text-sm">Pro Tip of the Day</h3>
             </div>
             <p className="text-slate-300 text-sm leading-relaxed mb-4">
               "Posts with 3-5 hashtags perform 40% better than those with none. Avoid generic tags like #marketing."
             </p>
             <button className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors">
               Read more tips &rarr;
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;