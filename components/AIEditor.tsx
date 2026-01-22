import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Wand2, RefreshCw, Copy, Check, Calendar, Bold, Italic, List, Smile, Type, Globe, MessageSquare, Repeat, ThumbsUp, Send as SendIcon, Save, ChevronDown, X, AlertCircle, Image as ImageIcon, Linkedin, Sparkles, Bot, Target, Cloud, CloudOff } from 'lucide-react';
import { Tone, GeneratedVariant, PostStatus, Post, ViewState, User } from '../types';
import { generateLinkedInPosts } from '../services/geminiService';
import { generateLinkedInPostsDeepSeek } from '../services/deepseekService';
import { publishPostNow, schedulePost, LinkedInOptions } from '../services/socialService';
import { supabase } from '../supabaseClient';

interface AIEditorProps {
  initialContent?: string;
  initialHeadline?: string;
  initialPostId?: string;
  onSchedule: (post: Post) => void;
  changeView: (view: ViewState) => void;
  user: User;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const boldMap: Record<string, string> = {
  a: '𝐚', b: '𝐛', c: '𝐜', d: '𝐝', e: '𝐞', f: '𝐟', g: '𝐠', h: '𝐡', i: '𝐢', j: '𝐣', k: '𝘬', l: '𝐥', m: '𝐦',
  n: '𝐧', o: '𝐨', p: '𝐩', q: '𝐪', r: '𝐫', s: '𝐬', t: '𝐭', u: '𝐮', v: '𝐯', w: '𝘸', x: '𝐱', y: '𝐲', z: '𝐳',
  A: '𝐀', B: '𝐁', C: '𝐂', D: '𝐃', E: '𝐄', F: '𝐅', G: '𝐆', H: '𝐇', I: '𝐈', J: '𝐉', K: '𝐊', L: '𝐋', M: '𝐌',
  N: '𝐍', O: '𝐎', P: '𝐐', R: '𝐑', S: '𝐒', T: '𝐓', U: '𝐔', V: '𝐕', W: '𝐖', X: '𝐗', Y: '𝐘', Z: '𝐙',
  0: '𝟎', 1: '𝟏', 2: '𝟐', 3: '𝟑', 4: '𝟒', 5: '𝟓', 6: '𝟔', 7: '𝟕', 8: '𝟖', 9: '𝟗'
};

const italicMap: Record<string, string> = {
  a: '𝘢', b: '𝘣', c: '𝘤', d: '𝘥', e: '𝘦', f: '𝘧', g: '𝘨', h: '𝘩', i: '𝘪', j: '𝘫', k: '𝘬', l: '𝘭', m: '𝘮',
  n: '𝘯', o: '𝐨', p: '𝘱', q: '𝘲', r: '𝘳', s: '𝘴', t: '𝘵', u: '𝘶', v: '𝘷', w: '𝘸', x: '𝘹', y: '𝘺', z: '𝘻',
  A: '𝘈', B: '𝘉', C: '𝘊', D: '𝘋', E: '𝘌', F: '𝘍', G: '𝘎', H: '𝘏', I: '𝘐', J: '𝘑', K: '𝘒', L: '𝘓', M: '𝘔',
  N: '𝘕', O: '𝘖', P: '𝘗', Q: '𝘘', R: '𝘙', S: '𝘚', T: '𝘛', U: '𝘜', V: '𝘝', W: '𝘞', X: '𝘟', Y: '𝘠', Z: '𝘡'
};

const EXPANDED_EMOJIS = ["🚀", "💡", "🔥", "✅", "📈", "👀", "🤝", "✨", "💯", "🎯", "🧠", "💪", "🙌", "🤔", "🎓", "📢", "🛑", "⭐", "🎉", "💼"];

const toBold = (text: string) => text.split('').map(char => boldMap[char] || char).join('');
const toItalic = (text: string) => text.split('').map(char => italicMap[char] || char).join('');

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const AIEditor: React.FC<AIEditorProps> = ({ initialContent = '', initialHeadline = '', initialPostId, onSchedule, changeView, user, showToast }) => {
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<Tone>(Tone.PROFESSIONAL);
  const [length, setLength] = useState<'Short' | 'Medium' | 'Long'>('Medium');
  const [selectedModel, setSelectedModel] = useState<'gemini' | 'deepseek'>(() => (localStorage.getItem('preferred_model') as any) || 'gemini');
  const [isGenerating, setIsGenerating] = useState(false);
  const [variants, setVariants] = useState<GeneratedVariant[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState(initialContent);
  const [editedHeadline, setEditedHeadline] = useState(initialHeadline);
  const [currentPostId, setCurrentPostId] = useState<string | null>(initialPostId || null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
  const [lastSavedContent, setLastSavedContent] = useState(initialContent);
  const [mediaFiles, setMediaFiles] = useState<{url: string, type: 'image' | 'video', name: string, file?: File}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [instructions, setInstructions] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showRewriteMenu, setShowRewriteMenu] = useState(false);
  const [suggestedHashtags, setSuggestedHashtags] = useState<string[]>(["#Leadership", "#Growth", "#Innovation"]);
  const [visibility, setVisibility] = useState<'public' | 'connections'>('public');
  const [disableShare, setDisableShare] = useState(false);
  const [targetCountries, setTargetCountries] = useState('');
  const [targetIndustries, setTargetIndustries] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow.toISOString().substring(0, 16);
  });
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (initialContent) {
      setEditedContent(initialContent);
      setLastSavedContent(initialContent);
    }
    if (initialHeadline) setEditedHeadline(initialHeadline);
    if (initialPostId) setCurrentPostId(initialPostId);
  }, [initialContent, initialHeadline, initialPostId]);

  const saveToSupabase = useCallback(async (content: string, headline: string, manual: boolean = false) => {
    if (!content) return;
    setSaveStatus('saving');
    const idToUse = currentPostId || generateUUID();

    const draftPost = {
      id: idToUse,
      user_id: user.id,
      title: headline || "Untitled Draft",
      content: content,
      status: PostStatus.DRAFT,
      updated_at: new Date().toISOString(),
      platform: 'linkedin',
      hashtags: suggestedHashtags.filter(tag => content.includes(tag)),
      created_at: currentPostId ? undefined : new Date().toISOString(),
      metrics: currentPostId ? undefined : { views: 0, likes: 0, comments: 0, shares: 0 },
      media_urls: [],
      generated_variants: variants
    };

    try {
      const { error } = await supabase.from('posts').upsert(draftPost);
      if (error) throw error;
      setCurrentPostId(idToUse);
      setLastSavedContent(content);
      setSaveStatus('saved');
      if (manual) showToast("Draft saved.", "success");
    } catch (err) {
      setSaveStatus('error');
      if (manual) showToast("Failed to save draft.", "error");
    }
  }, [currentPostId, user.id, variants, suggestedHashtags, showToast]);

  useEffect(() => {
    if (editedContent === lastSavedContent || !editedContent) return;
    setSaveStatus('unsaved');
    const timer = setTimeout(() => saveToSupabase(editedContent, editedHeadline), 2000);
    return () => clearTimeout(timer);
  }, [editedContent, editedHeadline, lastSavedContent, saveToSupabase]);

  const handleGenerate = async () => {
    if (!topic) return;
    setIsGenerating(true);
    setVariants([]);
    try {
      let generated: GeneratedVariant[] = [];
      if (selectedModel === 'deepseek') {
        if (!user.deepseek_key) {
          showToast("Configure DeepSeek Key in Settings.", "error");
          setIsGenerating(false);
          return;
        }
        generated = await generateLinkedInPostsDeepSeek(user.deepseek_key, topic, tone, length, instructions);
      } else {
        generated = await generateLinkedInPosts(topic, tone, length, instructions);
      }
      setVariants(generated);
      if (generated.length > 0) {
        const first = generated[0];
        setSelectedVariantId(first.variant_id);
        setEditedContent(first.content);
        setEditedHeadline(first.headline || topic);
      }
    } catch (e: any) {
      showToast(`Generation Failed: ${e.message}`, "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVariantSelect = (variant: GeneratedVariant) => {
    setSelectedVariantId(variant.variant_id);
    setEditedContent(variant.content);
    setEditedHeadline(variant.headline || '');
  };

  const handleRewrite = async (mode: any) => {
    if (!editedContent) return;
    setIsGenerating(true);
    setShowRewriteMenu(false);
    showToast(`Rewriting: ${mode}...`, "info");
    const prompt = `Rewrite post. Goal: ${mode}. Content: "${editedContent}"`;
    try {
      let generated: GeneratedVariant[] = [];
      if (selectedModel === 'deepseek') {
        generated = await generateLinkedInPostsDeepSeek(user.deepseek_key!, "Rewrite", tone, length, prompt);
      } else {
        generated = await generateLinkedInPosts("Rewrite", tone, length, prompt);
      }
      if (generated.length > 0) {
        setEditedContent(generated[0].content);
        showToast("Rewritten!", "success");
      }
    } catch (e: any) {
      showToast("Rewrite Failed.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFormat = (type: 'bold' | 'italic' | 'list') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editedContent.substring(start, end);
    let newText = '';
    if (type === 'bold') newText = toBold(selectedText || ' ');
    else if (type === 'italic') newText = toItalic(selectedText || ' ');
    else if (type === 'list') newText = selectedText.split('\n').map(l => `• ${l}`).join('\n');
    setEditedContent(editedContent.substring(0, start) + newText + editedContent.substring(end));
  };

  const uploadMediaFiles = async (): Promise<string[]> => {
    if (mediaFiles.length === 0) return [];
    try {
      const uploadPromises = mediaFiles.map(async (media) => {
        if (media.file) {
          const fileName = `${Date.now()}_${media.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
          const { error: uploadError } = await supabase.storage.from('post_media').upload(fileName, media.file);
          if (uploadError) throw uploadError;
          const { data } = supabase.storage.from('post_media').getPublicUrl(fileName);
          return data.publicUrl;
        }
        return media.url;
      });
      return (await Promise.all(uploadPromises)).filter(url => url !== null) as string[];
    } catch (error) {
      showToast("Media upload failed.", "error");
      return [];
    }
  };

  const handlePublishNow = async () => {
    if (!editedContent) return;
    if (!user.ayrshare_key) {
      showToast("Missing Ayrshare Key.", "error");
      changeView(ViewState.SETTINGS);
      return;
    }
    setIsPublishing(true);
    showToast("Preparing publication...", "info");
    const finalMediaUrls = await uploadMediaFiles();
    showToast("Distributing to LinkedIn...", "info");
    
    const result = await publishPostNow(
      user.id,
      editedHeadline || "Untitled",
      editedContent,
      user.ayrshare_key,
      finalMediaUrls,
      { visibility, disableShare, targeting: { countries: targetCountries.split(',').map(s => s.trim()).filter(Boolean), industries: targetIndustries.split(',').map(s => s.trim()).filter(Boolean) } },
      variants,
      currentPostId || undefined
    );

    setIsPublishing(false);
    if (result.success && result.post) {
      showToast("Success! Content is live.", "success");
      onSchedule(result.post);
      changeView(ViewState.DASHBOARD);
    } else {
      showToast(`Error: ${result.message}`, "error");
    }
  };

  const handleConfirmSchedule = async () => {
    if (!editedContent) return;
    if (!user.ayrshare_key) {
      showToast("Missing Ayrshare Key.", "error");
      return;
    }
    showToast("Setting up schedule...", "info");
    const finalMediaUrls = await uploadMediaFiles();
    const result = await schedulePost(
      user.id,
      editedHeadline || "Untitled",
      editedContent,
      user.ayrshare_key,
      new Date(scheduleDate).toISOString(),
      finalMediaUrls,
      { visibility, disableShare, targeting: { countries: targetCountries.split(',').map(s => s.trim()).filter(Boolean), industries: targetIndustries.split(',').map(s => s.trim()).filter(Boolean) } },
      variants,
      currentPostId || undefined
    );

    if (result.success && result.post) {
      setScheduleSuccess(true);
      showToast("Post scheduled.", "success");
      onSchedule(result.post);
      setTimeout(() => {
        setScheduleSuccess(false);
        setIsScheduling(false);
        changeView(ViewState.SCHEDULER);
      }, 1000);
    } else {
      showToast(`Failed: ${result.message}`, "error");
    }
  };

  const insertText = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    setEditedContent(editedContent.substring(0, start) + text + editedContent.substring(end));
    setShowEmojiPicker(false);
  };

  return (
    <div className="h-full flex flex-col xl:flex-row gap-6">
      <div className="w-full xl:w-[35%] shrink-0 flex flex-col gap-6 overflow-y-auto pr-1">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
             <h2 className="font-bold text-slate-800 dark:text-white text-lg">Post Settings</h2>
             <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                <button onClick={() => setSelectedModel('gemini')} className={`px-3 py-1 rounded-md text-xs font-medium ${selectedModel === 'gemini' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500'}`}>Gemini</button>
                <button onClick={() => setSelectedModel('deepseek')} className={`px-3 py-1 rounded-md text-xs font-medium ${selectedModel === 'deepseek' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}`}>DeepSeek</button>
             </div>
          </div>
          <textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="What's the topic?" className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 min-h-[80px] text-sm" />
          <div className="grid grid-cols-2 gap-4">
             <select value={tone} onChange={(e) => setTone(e.target.value as Tone)} className="p-2 bg-white dark:bg-slate-950 border rounded-xl text-sm">
                {Object.values(Tone).map(t => <option key={t} value={t}>{t}</option>)}
             </select>
             <select value={length} onChange={(e) => setLength(e.target.value as any)} className="p-2 bg-white dark:bg-slate-950 border rounded-xl text-sm">
                <option value="Short">Short</option>
                <option value="Medium">Medium</option>
                <option value="Long">Long</option>
             </select>
          </div>
          <button onClick={handleGenerate} disabled={isGenerating || !topic} className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 ${isGenerating || !topic ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
            {isGenerating ? <RefreshCw className="animate-spin" size={18} /> : <Wand2 size={18} />} {isGenerating ? 'Generating...' : 'Generate Content'}
          </button>
          {variants.length > 0 && (
             <div className="pt-2 animate-in slide-in-from-top-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Variants</h3>
                <div className="space-y-2">
                   {variants.map((v) => (
                      <div key={v.variant_id} onClick={() => handleVariantSelect(v)} className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedVariantId === v.variant_id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200' : 'bg-white dark:bg-slate-950 border-slate-200'}`}>
                         <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                               <p className="text-xs font-bold mb-0.5">{v.headline || `Variant ${v.variant_id}`}</p>
                               <p className="text-[10px] text-slate-500 line-clamp-2">{v.content}</p>
                            </div>
                            {selectedVariantId === v.variant_id && <Check size={12} className="text-indigo-600" />}
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}
          <div className="pt-4 border-t border-dashed">
             <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Linkedin size={16} /> LinkedIn Config</h3>
             <div className="space-y-3">
                <select value={visibility} onChange={(e) => setVisibility(e.target.value as any)} className="w-full p-2 border rounded-lg text-xs">
                   <option value="public">Public</option>
                   <option value="connections">Connections</option>
                </select>
                <div className="flex items-center justify-between text-xs">
                   <span>Disable Share</span>
                   <button onClick={() => setDisableShare(!disableShare)} className={`w-8 h-4 rounded-full relative ${disableShare ? 'bg-indigo-600' : 'bg-slate-300'}`}><div className={`w-2 h-2 bg-white rounded-full absolute top-1 ${disableShare ? 'left-5' : 'left-1'}`} /></button>
                </div>
             </div>
          </div>
        </div>
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-4">
         <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col flex-grow">
            <div className="flex items-center gap-1 p-2 border-b bg-slate-50 dark:bg-slate-800/50 rounded-t-xl">
               <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 hover:bg-white rounded relative"><Smile size={18} />
                 {showEmojiPicker && (
                    <div className="absolute top-full left-0 mt-2 bg-white dark:bg-slate-900 border shadow-xl rounded-xl p-3 z-50 w-64 grid grid-cols-6 gap-1 h-40 overflow-y-auto">
                      {EXPANDED_EMOJIS.map(e => <button key={e} onClick={() => insertText(e)} className="p-2 hover:bg-slate-100 rounded">{e}</button>)}
                    </div>
                 )}
               </button>
               <button onClick={() => handleFormat('bold')} className="p-2 hover:bg-white rounded"><Bold size={18} /></button>
               <button onClick={() => handleFormat('italic')} className="p-2 hover:bg-white rounded"><Italic size={18} /></button>
               <button onClick={() => handleFormat('list')} className="p-2 hover:bg-white rounded"><List size={18} /></button>
               <div className="relative">
                  <button onClick={() => setShowRewriteMenu(!showRewriteMenu)} className="p-2 text-indigo-600 flex items-center gap-1"><Sparkles size={16} /> <span className="text-xs font-bold">Rewrite</span></button>
                  {showRewriteMenu && (
                     <div className="absolute top-full left-0 mt-2 bg-white dark:bg-slate-900 border shadow-xl rounded-xl p-1 z-50 w-40 flex flex-col">
                        <button onClick={() => handleRewrite('grammar')} className="text-left px-3 py-2 hover:bg-slate-50 rounded-lg text-xs">Grammar</button>
                        <button onClick={() => handleRewrite('shorter')} className="text-left px-3 py-2 hover:bg-slate-50 rounded-lg text-xs">Shorter</button>
                        <button onClick={() => handleRewrite('longer')} className="text-left px-3 py-2 hover:bg-slate-50 rounded-lg text-xs">Longer</button>
                     </div>
                  )}
               </div>
               <div className="flex-grow" />
               <div className="flex items-center gap-2 mr-3 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md">
                 {saveStatus === 'saving' ? <RefreshCw size={12} className="animate-spin" /> : <Cloud size={12} className={saveStatus === 'saved' ? 'text-emerald-500' : 'text-amber-500'} />}
                 <span className="text-[10px] font-medium">{saveStatus.toUpperCase()}</span>
               </div>
               <span className="text-xs font-mono px-2 text-slate-400">{editedContent.length}/3000</span>
            </div>
            <div className="flex-grow p-4">
               <textarea ref={textareaRef} value={editedContent} onChange={(e) => setEditedContent(e.target.value)} className="w-full h-full resize-none outline-none bg-transparent" placeholder="Write something amazing..." />
            </div>
            {mediaFiles.length > 0 && (
              <div className="p-3 border-t bg-slate-50 dark:bg-slate-950 flex gap-3 overflow-x-auto">
                 {mediaFiles.map((file, i) => (
                    <div key={i} className="relative w-16 h-16 bg-white rounded-lg border overflow-hidden">
                       <img src={file.url} className="w-full h-full object-cover" />
                       <button onClick={() => setMediaFiles(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-0 right-0 bg-black/60 text-white p-1"><X size={8} /></button>
                    </div>
                 ))}
              </div>
            )}
            <div className="p-4 border-t bg-slate-50 dark:bg-slate-800/50 rounded-b-xl flex justify-between">
               <button onClick={() => saveToSupabase(editedContent, editedHeadline, true)} className="flex items-center gap-2 text-slate-500 text-sm"><Save size={16} /> Save</button>
               <div className="flex gap-3">
                  <button onClick={() => setIsScheduling(true)} className="px-4 py-2 border rounded-xl text-sm flex items-center gap-2"><Calendar size={16} /> Schedule</button>
                  <button onClick={handlePublishNow} disabled={isPublishing} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm flex items-center gap-2">
                     {isPublishing ? <RefreshCw className="animate-spin" size={16} /> : <SendIcon size={16} />} {isPublishing ? 'Publishing...' : 'Publish Now'}
                  </button>
               </div>
            </div>
         </div>
      </div>
      {isScheduling && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
              <button onClick={() => setIsScheduling(false)} className="absolute top-4 right-4"><X size={20} /></button>
              <h2 className="text-lg font-bold mb-4">Schedule Date</h2>
              <input type="datetime-local" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="w-full p-3 border rounded-xl mb-4" />
              <button onClick={handleConfirmSchedule} disabled={scheduleSuccess} className={`w-full py-3 rounded-xl font-semibold text-white ${scheduleSuccess ? 'bg-emerald-500' : 'bg-indigo-600'}`}>{scheduleSuccess ? 'Done!' : 'Confirm'}</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default AIEditor;