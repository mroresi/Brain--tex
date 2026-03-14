import { useState, useEffect } from 'react';
import { MessageSquareQuote, Search, Plus, Copy, Tag, MoreVertical, Loader2, X, Trash2 } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

interface Prompt {
  id: string;
  title: string;
  content: string;
  tags: string[];
  uses: number;
  createdAt: string;
}

export default function PromptsLibrary() {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'prompts'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const promptsData: Prompt[] = [];
      snapshot.forEach((doc) => {
        promptsData.push({ id: doc.id, ...doc.data() } as Prompt);
      });
      setPrompts(promptsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching prompts:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCreatePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTitle.trim() || !newContent.trim()) return;

    setIsCreating(true);
    try {
      const tagsArray = newTags.split(',').map(t => t.trim().toLowerCase()).filter(t => t);
      await addDoc(collection(db, 'prompts'), {
        userId: user.uid,
        title: newTitle.trim(),
        content: newContent.trim(),
        tags: tagsArray,
        uses: 0,
        createdAt: new Date().toISOString()
      });
      setNewTitle('');
      setNewContent('');
      setNewTags('');
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Error creating prompt:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return;
    try {
      await deleteDoc(doc(db, 'prompts', id));
    } catch (error) {
      console.error("Error deleting prompt:", error);
    }
  };

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // Could add a toast here
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const filteredPrompts = prompts.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'All' || p.tags.includes(activeFilter.toLowerCase());
    return matchesSearch && matchesFilter;
  });

  const allTags = Array.from(new Set(prompts.flatMap(p => p.tags)));
  const filters = ['All', ...allTags.slice(0, 4).map(t => t.charAt(0).toUpperCase() + t.slice(1))];

  return (
    <div className="flex flex-col h-full bg-[#000000] text-white p-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 border border-[#FF0000] rounded flex items-center justify-center text-[#FF0000] font-bold">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : prompts.length}
          </div>
          <h1 className="text-2xl font-bold">Prompts Library</h1>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-white text-black rounded-lg text-sm font-bold hover:bg-white/90 transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> New Prompt
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white/5 p-4 rounded-xl border border-white/20 mb-6">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search prompts by keyword or tag..." 
            className="w-full pl-9 pr-4 py-2 bg-black border border-white/20 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white transition-colors"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto hide-scrollbar">
          {filters.map((filter, i) => (
            <button 
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border",
                activeFilter === filter 
                  ? "bg-[#FF0000]/10 border-[#FF0000]/30 text-[#FF0000]" 
                  : "bg-black border-white/20 text-white/60 hover:text-white"
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        {prompts.length === 0 && !loading && (
          <div className="text-center py-12 border border-dashed border-white/20 rounded-xl text-white/50">
            No prompts found. Create your first prompt to get started.
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPrompts.map((prompt) => (
            <div key={prompt.id} className="bg-black rounded-xl border border-white/20 hover:border-white/40 transition-colors overflow-hidden flex flex-col group">
              <div className="p-5 border-b border-white/10">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#FF0000]/10 rounded-lg flex items-center justify-center text-[#FF0000]">
                      <MessageSquareQuote className="w-4 h-4" />
                    </div>
                    <h3 className="text-base font-bold text-white">{prompt.title}</h3>
                  </div>
                  <button 
                    onClick={() => handleDelete(prompt.id)}
                    className="text-white/30 hover:text-[#FF0000] p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete prompt"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10 relative">
                  <p className="text-sm text-white/70 line-clamp-3 font-mono leading-relaxed">{prompt.content}</p>
                  <button 
                    onClick={() => handleCopy(prompt.content)}
                    className="absolute top-2 right-2 p-1.5 bg-black border border-white/20 rounded-md text-white/50 hover:text-white hover:border-white transition-colors shadow-sm" 
                    title="Copy prompt"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="px-5 py-3 bg-white/5 flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
                  {prompt.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-black border border-white/20 text-[10px] font-bold uppercase tracking-wider text-white/60 whitespace-nowrap">
                      <Tag className="w-3 h-3 text-white/40" />
                      {tag}
                    </span>
                  ))}
                  {prompt.tags.length === 0 && <span className="text-xs text-white/30 italic">No tags</span>}
                </div>
                <span className="text-xs font-medium text-white/40 shrink-0 ml-4">{prompt.uses} uses</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Prompt Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#000000] border border-white/20 rounded-xl w-full max-w-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Create New Prompt</h2>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-white/50 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreatePrompt}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold tracking-wider text-white/50 uppercase mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Executive Summary Generator"
                    className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white transition-colors"
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold tracking-wider text-white/50 uppercase mb-2">
                    Prompt Content
                  </label>
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Enter your prompt template here..."
                    className="w-full h-32 bg-black border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white transition-colors font-mono text-sm resize-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold tracking-wider text-white/50 uppercase mb-2">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="e.g. writing, executive, research"
                    className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white transition-colors"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newTitle.trim() || !newContent.trim()}
                  className="px-4 py-2 bg-white text-black rounded-lg text-sm font-bold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Prompt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
