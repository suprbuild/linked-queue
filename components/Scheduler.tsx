import React, { useState } from 'react';
import { PostStatus, Post } from '../types';
import { Clock, Calendar as CalendarIcon, Save, Linkedin, Check, Bell, RefreshCw } from 'lucide-react';

interface SchedulerProps {
  posts: Post[];
  onUpdatePost: (post: Post) => void;
}

const Scheduler: React.FC<SchedulerProps> = ({ posts, onUpdatePost }) => {
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [draggedPostId, setDraggedPostId] = useState<string | null>(null);
  const [reminderEnabled, setReminderEnabled] = useState(false);

  const scheduledPosts = posts
    .filter(p => p.status === PostStatus.SCHEDULED)
    .sort((a, b) => new Date(a.scheduled_time!).getTime() - new Date(b.scheduled_time!).getTime());

  // Mock Calendar Generation
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dates = Array.from({ length: 35 }, (_, i) => i + 1); // Mock month visualization

  const handleDateClick = (date: number) => {
     setSelectedDate(date);
     const found = scheduledPosts.find(p => p.scheduled_time && new Date(p.scheduled_time).getDate() === date);
     setSelectedPost(found || null);
     setReminderEnabled(false); // Reset for new selection
  };

  const handleDragStart = (e: React.DragEvent, postId: string) => {
    e.dataTransfer.setData("postId", postId);
    setDraggedPostId(postId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (e: React.DragEvent, date: number) => {
    e.preventDefault();
    const postId = e.dataTransfer.getData("postId");
    const post = posts.find(p => p.id === postId);
    
    if (post && date <= 31) {
      // Create new scheduled date (keep same time if possible, else default to 9am)
      const currentSchedule = post.scheduled_time ? new Date(post.scheduled_time) : new Date();
      const newSchedule = new Date();
      newSchedule.setDate(date);
      newSchedule.setHours(currentSchedule.getHours() || 9, currentSchedule.getMinutes() || 0, 0, 0);

      const updatedPost: Post = {
        ...post,
        scheduled_time: newSchedule.toISOString(),
        updated_at: new Date().toISOString()
      };
      
      onUpdatePost(updatedPost);
      setSelectedDate(date);
      setSelectedPost(updatedPost);
    }
    setDraggedPostId(null);
  };

  const handleVariantSwitch = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!selectedPost) return;
    const variantId = e.target.value;
    const variant = selectedPost.generated_variants?.find(v => v.variant_id === variantId);
    
    if (variant) {
      const updated = {
        ...selectedPost,
        content: variant.content,
        title: variant.headline || selectedPost.title
      };
      setSelectedPost(updated);
      onUpdatePost(updated);
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6">
      
      {/* Main Area: Interactive Calendar */}
      <div className="flex-1 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
        <div className="flex justify-between items-center mb-6">
           <div>
             <h2 className="font-bold text-xl text-slate-800 dark:text-white">October 2023</h2>
             <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your content schedule</p>
           </div>
           <div className="flex gap-2">
             <button className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">Month</button>
             <button className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500">Week</button>
           </div>
        </div>
        
        {/* Calendar Grid */}
        <div className="flex-grow flex flex-col">
           <div className="grid grid-cols-7 gap-px border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
              {days.map(d => <div key={d} className="text-center text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">{d}</div>)}
           </div>
           <div className="grid grid-cols-7 grid-rows-5 gap-2 flex-grow">
              {dates.map((date, i) => {
                 const isRealDate = date <= 31;
                 const dayPosts = scheduledPosts.filter(p => p.scheduled_time && new Date(p.scheduled_time).getDate() === date);
                 const isSelected = selectedDate === date;

                 return (
                   <div 
                     key={i} 
                     onClick={() => isRealDate && handleDateClick(date)}
                     onDragOver={(e) => isRealDate && handleDragOver(e)}
                     onDrop={(e) => isRealDate && handleDrop(e, date)}
                     className={`
                        relative border rounded-lg p-2 flex flex-col gap-1 transition-all min-h-[80px]
                        ${isRealDate ? 'bg-white dark:bg-slate-950 hover:border-indigo-300 dark:hover:border-indigo-700' : 'bg-slate-50 dark:bg-slate-900/50 border-transparent'}
                        ${isSelected ? 'ring-2 ring-indigo-500 border-transparent z-10' : 'border-slate-100 dark:border-slate-800'}
                     `}
                   >
                      {isRealDate && (
                        <>
                           <span className={`text-xs font-medium ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-500'}`}>{date}</span>
                           {dayPosts.map(post => (
                              <div 
                                key={post.id} 
                                draggable
                                onDragStart={(e) => handleDragStart(e, post.id)}
                                className="text-[10px] bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-1.5 py-1 rounded truncate font-medium cursor-move hover:bg-indigo-200 dark:hover:bg-indigo-900/60 transition-colors shadow-sm"
                              >
                                 {post.title}
                              </div>
                           ))}
                        </>
                      )}
                   </div>
                 );
              })}
           </div>
        </div>
      </div>

      {/* Side Panel: Configuration */}
      <div className="w-full lg:w-80 flex flex-col gap-4">
         {selectedPost ? (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm h-full flex flex-col animate-in slide-in-from-right duration-300">
               <div className="mb-4">
                  <span className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1 block">Scheduled</span>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">{selectedPost.title}</h3>
               </div>

               <div className="space-y-4 flex-grow">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Platform</label>
                    <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300">
                       <Linkedin size={16} className="text-[#0077b5]" /> LinkedIn
                    </div>
                  </div>

                  <div>
                     <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Date & Time</label>
                     <input 
                       type="datetime-local" 
                       defaultValue={selectedPost.scheduled_time?.slice(0, 16)} 
                       className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 outline-none"
                     />
                  </div>

                  {/* Reminder Toggle */}
                  <div className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                     <div className="flex items-center gap-2">
                        <Bell size={16} className={reminderEnabled ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"} />
                        <div className="text-sm">
                           <p className="font-medium text-slate-700 dark:text-slate-300">Remind me</p>
                           <p className="text-[10px] text-slate-500 dark:text-slate-500">15m before</p>
                        </div>
                     </div>
                     <button 
                       onClick={() => setReminderEnabled(!reminderEnabled)}
                       className={`w-10 h-5 rounded-full relative transition-colors ${reminderEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                     >
                        <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${reminderEnabled ? 'left-6' : 'left-1'}`}></div>
                     </button>
                  </div>

                  {/* Variant Selection */}
                  {selectedPost.generated_variants && selectedPost.generated_variants.length > 0 && (
                     <div>
                       <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                          <RefreshCw size={12} /> Swap Content Variant
                       </label>
                       <select 
                         onChange={handleVariantSwitch}
                         className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                       >
                         <option value="">Select a variant to switch...</option>
                         {selectedPost.generated_variants.map(v => (
                            <option key={v.variant_id} value={v.variant_id}>
                               Variant {v.variant_id} ({v.length})
                            </option>
                         ))}
                       </select>
                     </div>
                  )}

                  <div>
                     <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Preview</label>
                     <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-800 line-clamp-4">
                        {selectedPost.content}
                     </p>
                  </div>
               </div>

               <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <button className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">Confirm Updates</button>
                  <button className="w-full py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center gap-2">
                     <Save size={16} /> Save as Draft
                  </button>
               </div>
            </div>
         ) : (
            <div className="bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-center h-full text-slate-400 dark:text-slate-600">
               <CalendarIcon size={32} className="mb-3 opacity-50" />
               <p className="text-sm">Select a date or a scheduled post to view details.</p>
               <p className="text-xs text-slate-400 dark:text-slate-600 mt-4">Tip: Drag and drop posts on the calendar to reschedule.</p>
            </div>
         )}
      </div>
    </div>
  );
};

export default Scheduler;