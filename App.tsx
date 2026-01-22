import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Library, PenTool, Calendar, BarChart3, Settings as SettingsIcon, Menu, X, LogOut, MoreHorizontal, Sun, Moon, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { supabase } from './supabaseClient';
import Dashboard from './components/Dashboard';
import ViralLibrary from './components/ViralLibrary';
import AIEditor from './components/AIEditor';
import Scheduler from './components/Scheduler';
import Analytics from './components/Analytics';
import AuthPage from './components/AuthPage';
import Settings from './components/Settings';
import { ViewState, Post, PostStatus, User } from './types';
import { CURRENT_USER } from './constants';

type ToastType = 'success' | 'error' | 'info';
interface ToastMsg { id: string; type: ToastType; message: string; }

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<User>(CURRENT_USER);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editorInitialContent, setEditorInitialContent] = useState('');
  const [editorInitialHeadline, setEditorInitialHeadline] = useState('');
  const [editorInitialPostId, setEditorInitialPostId] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if(session?.user) await fetchProfile(session.user.id, session.user.email || '');
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if(session?.user) await fetchProfile(session.user.id, session.user.email || '');
      else { setUser(CURRENT_USER); setPosts([]); }
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (data) {
        setUser({
          id: data.id, email: email, plan: 'free', credits: 50, ayrshare_key: data.ayrshare_key, deepseek_key: data.deepseek_key,
          profile_data: { name: data.full_name || email.split('@')[0], headline: data.headline, profile_picture: data.avatar_url || "https://picsum.photos/100/100" }
        });
      } else {
        const newProfile = { id: userId, full_name: email.split('@')[0], headline: "New User", updated_at: new Date().toISOString() };
        await supabase.from('profiles').insert([newProfile]);
        setUser({ id: userId, email: email, plan: 'free', credits: 50, profile_data: { name: newProfile.full_name, headline: "New User", profile_picture: "" } });
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (session) fetchPosts();
  }, [session]);

  const fetchPosts = async () => {
    if (!session?.user?.id) return;
    const { data } = await supabase.from('posts').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
    if (data) setPosts(data as Post[]);
  };

  const navItems = [
    { id: ViewState.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: ViewState.LIBRARY, label: 'Viral Library', icon: Library },
    { id: ViewState.EDITOR, label: 'Create Post', icon: PenTool },
    { id: ViewState.SCHEDULER, label: 'Scheduled Posts', icon: Calendar },
    { id: ViewState.ANALYTICS, label: 'Analytics', icon: BarChart3 },
    { id: ViewState.SETTINGS, label: 'Settings', icon: SettingsIcon },
  ];

  const handleUseTemplate = (content: string) => {
    setEditorInitialContent(content);
    setEditorInitialHeadline('');
    setEditorInitialPostId('');
    setCurrentView(ViewState.EDITOR);
  };

  const handlePostCreated = (newPost: Post) => {
    setPosts(prev => {
      const exists = prev.some(p => p.id === newPost.id);
      if (exists) return prev.map(p => p.id === newPost.id ? newPost : p);
      return [newPost, ...prev];
    });
  };

  const handleUpdatePost = async (updatedPost: Post) => {
    setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
    await supabase.from('posts').update({
       title: updatedPost.title, content: updatedPost.content, status: updatedPost.status, scheduled_time: updatedPost.scheduled_time, updated_at: new Date().toISOString()
    }).eq('id', updatedPost.id);
    showToast("Post updated.", "success");
  };

  const handleDuplicatePost = (post: Post) => {
    setEditorInitialContent(post.content);
    setEditorInitialHeadline(`${post.title} (Copy)`);
    setEditorInitialPostId('');
    setCurrentView(ViewState.EDITOR);
  };

  const handleDeletePost = async (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    await supabase.from('posts').delete().eq('id', postId);
    showToast("Post deleted.", "success");
  };

  const renderView = () => {
    switch (currentView) {
      case ViewState.DASHBOARD: return <Dashboard user={user} changeView={setCurrentView} posts={posts} onDuplicatePost={handleDuplicatePost} onDeletePost={handleDeletePost} />;
      case ViewState.LIBRARY: return <ViralLibrary onUseTemplate={handleUseTemplate} />;
      case ViewState.EDITOR: return <AIEditor initialContent={editorInitialContent} initialHeadline={editorInitialHeadline} initialPostId={editorInitialPostId} onSchedule={handlePostCreated} changeView={setCurrentView} user={user} showToast={showToast} />;
      case ViewState.SCHEDULER: return <Scheduler posts={posts} onUpdatePost={handleUpdatePost} />;
      case ViewState.ANALYTICS: return <Analytics user={user} posts={posts} onDuplicatePost={handleDuplicatePost} refreshPosts={fetchPosts} showToast={showToast} />;
      case ViewState.SETTINGS: return <Settings user={user} onUpdateUser={async (u) => { setUser(u); return true; }} onLogout={() => supabase.auth.signOut()} />;
      default: return <Dashboard user={user} changeView={setCurrentView} posts={posts} onDuplicatePost={handleDuplicatePost} onDeletePost={handleDeletePost} />;
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500">Loading profile...</div>;
  if (!session) return <AuthPage onLogin={setSession} isDarkMode={isDarkMode} toggleTheme={() => setIsDarkMode(!isDarkMode)} />;

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
           {toasts.map(t => (
             <div key={t.id} className={`min-w-[280px] p-4 rounded-xl shadow-lg border flex items-center gap-3 bg-white dark:bg-slate-900 ${t.type === 'success' ? 'border-emerald-500 text-emerald-600' : t.type === 'error' ? 'border-red-500 text-red-600' : 'border-indigo-500 text-indigo-600'}`}>
                {t.type === 'success' ? <CheckCircle size={18} /> : t.type === 'error' ? <AlertCircle size={18} /> : <Info size={18} />}
                <p className="text-sm font-medium">{t.message}</p>
             </div>
           ))}
        </div>
        <aside className={`fixed inset-y-0 left-0 z-30 w-72 transform lg:translate-x-0 lg:static flex flex-col border-r bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg"></div>
            <span className="text-xl font-bold tracking-tight">LinkedQueue</span>
          </div>
          <nav className="flex-1 px-4 space-y-1">
            {navItems.map(item => (
              <button key={item.id} onClick={() => { setCurrentView(item.id); if(item.id === ViewState.EDITOR){setEditorInitialContent(''); setEditorInitialHeadline(''); setEditorInitialPostId('');} setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${currentView === item.id ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                <item.icon size={20} /> <span>{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="p-4 border-t flex flex-col gap-2">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="flex items-center justify-between px-4 py-2 rounded-xl hover:bg-slate-50">
              <span className="text-sm font-medium">Theme</span>
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-red-500">
              <LogOut size={20} /> <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </aside>
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="lg:hidden p-4 border-b flex justify-between bg-white dark:bg-slate-900">
             <span className="font-bold">LinkedQueue</span>
             <button onClick={() => setIsSidebarOpen(true)}><Menu /></button>
          </header>
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 scrollbar-thin">
            <div className="max-w-[1600px] mx-auto h-full">{renderView()}</div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;