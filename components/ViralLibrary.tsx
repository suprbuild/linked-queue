
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, ChevronDown, BarChart2, X, RefreshCw, Flame, ExternalLink, Wand2, Calendar, Briefcase, TrendingUp, SlidersHorizontal } from 'lucide-react';
import { InspirationPost } from '../types';
import { fetchInspirationPosts } from '../services/socialService';

interface ViralLibraryProps {
  onUseTemplate: (content: string) => void;
}

interface SavedSearch {
  id: string;
  term: string;
  tag: string | null;
}

// Helper to safely get author name
const getAuthorName = (post: InspirationPost): string => {
  if (post.original_author) {
    if (typeof post.original_author === 'string') return post.original_author;
    if (typeof post.original_author === 'object' && post.original_author.name) return post.original_author.name;
  }
  return post.author_name || 'Unknown Author';
};

// Helper to safely get content
const getPostContent = (post: InspirationPost): string => {
  return post.original_content || post.content || '';
};

const ViralLibrary: React.FC<ViralLibraryProps> = ({ onUseTemplate }) => {
  const [posts, setPosts] = useState<InspirationPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [trendingTopic, setTrendingTopic] = useState('All Topics');
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  
  // New Granular Filters
  const [showFilters, setShowFilters] = useState(false);
  const [industryFilter, setIndustryFilter] = useState<string>('All Industries');
  const [minEngagement, setMinEngagement] = useState<number>(0);
  const [dateFilter, setDateFilter] = useState<string>('All Time');

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    const data = await fetchInspirationPosts();
    setPosts(data);
    setLoading(false);
  };

  const industries = useMemo(() => {
    const inds = new Set<string>();
    posts.forEach(p => { if (p.industry) inds.add(p.industry); });
    return Array.from(inds).sort();
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const content = getPostContent(post);
      const author = getAuthorName(post);
      const term = searchTerm.toLowerCase();

      const safeContent = content ? content.toLowerCase() : '';
      const safeAuthor = author ? author.toLowerCase() : '';

      const matchesSearch = safeContent.includes(term) || safeAuthor.includes(term);
      const matchesTag = activeTag ? (post.tags || []).includes(activeTag) : true;
      const matchesIndustry = industryFilter === 'All Industries' ? true : post.industry === industryFilter;
      const matchesEngagement = post.engagement_score >= minEngagement;
      
      // Date filtering logic
      let matchesDate = true;
      if (dateFilter !== 'All Time' && post.post_date) {
        const postDate = new Date(post.post_date);
        const now = new Date();
        const diffDays = (now.getTime() - postDate.getTime()) / (1000 * 3600 * 24);
        
        if (dateFilter === 'Last 7 Days') matchesDate = diffDays <= 7;
        else if (dateFilter === 'Last 30 Days') matchesDate = diffDays <= 30;
        else if (dateFilter === 'Last 90 Days') matchesDate = diffDays <= 90;
      }

      return matchesSearch && matchesTag && matchesIndustry && matchesEngagement && matchesDate;
    });
  }, [posts, searchTerm, activeTag, industryFilter, minEngagement, dateFilter]);

  const allTags = Array.from(new Set(posts.flatMap(p => p.tags || [])));

  const handleSaveSearch = () => {
    if (!searchTerm && !activeTag && industryFilter === 'All Industries') return;
    const newSearch = {
      id: Date.now().toString(),
      term: searchTerm,
      tag: activeTag
    };
    if (!savedSearches.some(s => s.term === searchTerm && s.tag === activeTag)) {
       setSavedSearches([...savedSearches, newSearch]);
    }
  };

  const handleApplySavedSearch = (s: SavedSearch) => {
    setSearchTerm(s.term);
    setActiveTag(s.tag);
  };

  const handleDeleteSavedSearch = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedSearches(savedSearches.filter(s => s.id !== id));
  };

  const resetFilters = () => {
    setIndustryFilter('All Industries');
    setMinEngagement(0);
    setDateFilter('All Time');
    setActiveTag(null);
    setSearchTerm('');
  };

  const activeFilterCount = (industryFilter !== 'All Industries' ? 1 : 0) + 
                             (minEngagement > 0 ? 1 : 0) + 
                             (dateFilter !== 'All Time' ? 1 : 0);

  return (
    <div className="space-y-8 h-full flex flex-col">
      {/* Search & Filter Header */}
      <div className="flex flex-col gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4 w-full lg:w-auto flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search by keyword, author, or industry..." 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-400 dark:placeholder-slate-600 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="relative hidden md:block">
              <select 
                value={trendingTopic}
                onChange={(e) => setTrendingTopic(e.target.value)}
                className="appearance-none bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 py-2.5 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer text-sm font-medium"
              >
                <option>All Topics</option>
                <option>Artificial Intelligence</option>
                <option>SaaS Growth</option>
                <option>Leadership</option>
                <option>Remote Work</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>
          </div>

          <div className="flex gap-2 w-full lg:w-auto">
            <button 
              onClick={loadPosts} 
              disabled={loading}
              className="flex items-center justify-center w-10 h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
               <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border ${
                showFilters 
                ? 'bg-indigo-600 border-indigo-600 text-white' 
                : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
               <Filter size={18} /> 
               Advanced Filters
               {activeFilterCount > 0 && (
                 <span className={`ml-1 flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full ${showFilters ? 'bg-white text-indigo-600' : 'bg-indigo-600 text-white'}`}>
                   {activeFilterCount}
                 </span>
               )}
            </button>
            <button 
              onClick={handleSaveSearch}
              disabled={!searchTerm && !activeTag && industryFilter === 'All Industries'}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                 !searchTerm && !activeTag && industryFilter === 'All Industries'
                 ? 'bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 border-slate-100 dark:border-slate-700 cursor-not-allowed'
                 : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50'
              }`}
            >
               Save Search
            </button>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2 duration-200">
            {/* Industry Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                <Briefcase size={14} /> Industry
              </label>
              <div className="relative">
                <select 
                  value={industryFilter}
                  onChange={(e) => setIndustryFilter(e.target.value)}
                  className="w-full appearance-none bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 py-2 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                >
                  <option>All Industries</option>
                  {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
              </div>
            </div>

            {/* Engagement Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                <TrendingUp size={14} /> Min Engagement
              </label>
              <div className="flex items-center gap-3">
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  step="5"
                  value={minEngagement}
                  onChange={(e) => setMinEngagement(parseInt(e.target.value))}
                  className="flex-1 accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded min-w-[32px] text-center">
                  {minEngagement}
                </span>
              </div>
            </div>

            {/* Date Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                <Calendar size={14} /> Post Recency
              </label>
              <div className="flex gap-1">
                {['All Time', 'Last 7 Days', 'Last 30 Days', 'Last 90 Days'].map(preset => (
                  <button 
                    key={preset}
                    onClick={() => setDateFilter(preset)}
                    className={`flex-1 text-[10px] font-bold py-1.5 rounded-md border transition-all ${
                      dateFilter === preset 
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 text-indigo-600' 
                      : 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-500'
                    }`}
                  >
                    {preset.replace('Last ', '')}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-3 flex justify-end">
              <button 
                onClick={resetFilters}
                className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1"
              >
                <RefreshCw size={12} /> Reset All Filters
              </button>
            </div>
          </div>
        )}

        {/* Saved Searches Chips */}
        {savedSearches.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800">
             <span className="text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase mr-2">Saved:</span>
             {savedSearches.map(s => (
                <button 
                   key={s.id} 
                   onClick={() => handleApplySavedSearch(s)}
                   className="flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full text-xs font-medium border border-slate-200 dark:border-slate-700 transition-colors group"
                >
                   <span>{s.term || 'All'} {s.tag ? `+ #${s.tag}` : ''}</span>
                   <X size={12} className="opacity-0 group-hover:opacity-100 hover:text-red-500" onClick={(e) => handleDeleteSavedSearch(s.id, e)} />
                </button>
             ))}
          </div>
        )}
      </div>

      {/* Tags Row */}
      <div className="flex gap-2 flex-wrap">
        <button 
          onClick={() => setActiveTag(null)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${!activeTag ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
        >
          All
        </button>
        {allTags.map(tag => (
          <button 
            key={tag}
            onClick={() => setActiveTag(tag)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTag === tag ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* ViralFeed: Grid Content */}
      {loading ? (
        <div className="flex-grow flex items-center justify-center min-h-[400px]">
           <div className="flex flex-col items-center gap-4">
             <RefreshCw className="animate-spin text-indigo-500" size={32} />
             <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Fetching viral posts...</p>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
          {filteredPosts.map((post) => (
            <ViralPostCard key={post.id} post={post} onRemix={onUseTemplate} />
          ))}
          {filteredPosts.length === 0 && (
             <div className="col-span-full py-16 text-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <Search size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">No viral posts found</p>
                <p className="text-sm">Try adjusting your search or filters.</p>
                <button 
                  onClick={resetFilters}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-md shadow-indigo-500/20"
                >
                  Clear All Filters
                </button>
             </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- Component: ViralPostCard ---
interface ViralPostCardProps {
  post: InspirationPost;
  onRemix: (content: string) => void;
}

const ViralPostCard: React.FC<ViralPostCardProps> = ({ post, onRemix }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Safely handle missing content, favoring the new original_content field
  const content = getPostContent(post);
  const authorName = getAuthorName(post);

  // Extract a "Hook" (first sentence or line)
  const hookText = post.title || content.split('\n')[0] || "Untitled Post";
  const bodyText = content.replace(hookText, '').trim();

  return (
    <div className="group relative flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900/50">
      
      {/* Header (Metadata) */}
      <div className="p-5 flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <span className="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider rounded-full px-3 py-1 w-fit">
            {post.category || "Trending"}
          </span>
          {post.industry && (
            <span className="text-[10px] text-slate-400 font-medium px-1 flex items-center gap-1">
              <Briefcase size={10} /> {post.industry}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium text-xs bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg">
           <Flame size={14} className="text-orange-500 fill-orange-500" /> 
           <span>{(post.engagement_score * 100).toLocaleString()}</span>
        </div>
      </div>

      {/* Body (The Hook & Content) */}
      <div 
        className="px-5 flex-1 relative cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="mb-2">
           <span className="text-xs text-slate-400 font-medium block">{authorName}</span>
           <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {hookText}
          </h3>
        </div>
        
        <div className="relative">
          <p className={`text-sm text-slate-600 dark:text-slate-400 leading-relaxed ${isExpanded ? '' : 'line-clamp-4'}`}>
            {bodyText || content}
          </p>
          {/* Gradient Mask for Truncation */}
          {!isExpanded && (
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white dark:from-slate-900 to-transparent pointer-events-none"></div>
          )}
        </div>
      </div>

      {/* Footer (Actions) */}
      <div className="p-5 mt-auto flex items-center justify-between gap-3">
        <button 
          className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-colors"
          title="View Original on LinkedIn"
          onClick={() => window.open(post.linkedin_url || '#', '_blank')}
        >
          <ExternalLink size={20} />
        </button>

        <button 
          onClick={() => onRemix(content)}
          className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-medium text-sm transition-all shadow-indigo-500/20 shadow-lg opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:translate-y-2 lg:group-hover:translate-y-0"
        >
          <Wand2 size={16} /> Remix This
        </button>
      </div>

    </div>
  );
};

export default ViralLibrary;
