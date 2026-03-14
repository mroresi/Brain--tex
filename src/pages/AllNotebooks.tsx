import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Filter, ArrowUpDown, Search, FileText, Download, Loader2, X, BookmarkPlus } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

interface Notebook {
  id: string;
  name: string;
  sourcesCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export default function AllNotebooks() {
  const { user } = useAuth();
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Save View Modal State
  const [isSaveViewModalOpen, setIsSaveViewModalOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isSavingView, setIsSavingView] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notebooks'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notebooksData: Notebook[] = [];
      snapshot.forEach((doc) => {
        notebooksData.push({ id: doc.id, ...doc.data() } as Notebook);
      });
      // Sort on the client side to avoid requiring a composite index
      notebooksData.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      
      setNotebooks(notebooksData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching notebooks:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCreateNotebook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newNotebookName.trim()) return;

    setIsCreating(true);
    try {
      await addDoc(collection(db, 'notebooks'), {
        userId: user.uid,
        name: newNotebookName.trim(),
        sourcesCount: 0,
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setNewNotebookName('');
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Error creating notebook:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveView = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newCollectionName.trim()) return;

    setIsSavingView(true);
    try {
      await addDoc(collection(db, 'collections'), {
        userId: user.uid,
        name: newCollectionName.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setNewCollectionName('');
      setIsSaveViewModalOpen(false);
    } catch (error) {
      console.error("Error saving view to collection:", error);
    } finally {
      setIsSavingView(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#000000] text-white p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 border border-[#FF0000] rounded flex items-center justify-center text-[#FF0000] font-bold">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : notebooks.length}
          </div>
          <h1 className="text-2xl font-bold">Notebooks</h1>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <button 
            onClick={() => setIsSaveViewModalOpen(true)}
            className="flex items-center gap-2 bg-black border border-white/20 text-white px-4 py-2 rounded-md font-bold hover:bg-white/10 transition-colors"
          >
            <BookmarkPlus className="w-4 h-4" /> Save View to Collection
          </button>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-md font-bold hover:bg-white/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Notebook
          </button>
          <button className="flex items-center gap-2 hover:text-white/80"><Filter className="w-4 h-4" /> Filter</button>
          <button className="hover:text-white/80"><ArrowUpDown className="w-4 h-4" /></button>
          <button className="hover:text-white/80"><Search className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-auto border border-white/20 rounded-lg">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-white/5 border-b border-white/20 text-white/60">
            <tr>
              <th className="px-4 py-3 w-12"><input type="checkbox" className="rounded border-white/20 bg-black accent-white" /></th>
              <th className="px-4 py-3">Aa Name</th>
              <th className="px-4 py-3 w-48"># Sources</th>
              <th className="px-4 py-3 w-48">≡ Tags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {notebooks.length === 0 && !loading && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-white/50">
                  No notebooks found. Create one to get started.
                </td>
              </tr>
            )}
            {notebooks.map((n) => (
              <tr key={n.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3"><input type="checkbox" className="rounded border-white/20 bg-black accent-white" /></td>
                <td className="px-4 py-3 font-medium flex items-center gap-3">
                  <FileText className="w-4 h-4 text-white/60" />
                  <Link to={`/notebooks/${n.id}`} className="hover:text-[#FF0000] transition-colors">
                    {n.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-white/60">{n.sourcesCount} source{n.sourcesCount !== 1 ? 's' : ''}</span>
                    <Download className="w-3.5 h-3.5 text-white/40 hover:text-white cursor-pointer" />
                  </div>
                </td>
                <td className="px-4 py-3 text-white/40">
                  {n.tags && n.tags.length > 0 ? (
                    <div className="flex gap-1">
                      {n.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-white/10 rounded text-xs">{tag}</span>
                      ))}
                    </div>
                  ) : 'Empty'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Notebook Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#000000] border border-white/20 rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Create New Notebook</h2>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-white/50 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateNotebook}>
              <div className="mb-6">
                <label className="block text-xs font-bold tracking-wider text-white/50 uppercase mb-2">
                  Notebook Name
                </label>
                <input
                  type="text"
                  value={newNotebookName}
                  onChange={(e) => setNewNotebookName(e.target.value)}
                  placeholder="e.g. Q3 Marketing Research"
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white transition-colors"
                  autoFocus
                  required
                />
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
                  disabled={isCreating || !newNotebookName.trim()}
                  className="px-4 py-2 bg-white text-black rounded-lg text-sm font-bold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Notebook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Save View Modal */}
      {isSaveViewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#000000] border border-white/20 rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Save View to Collection</h2>
              <button 
                onClick={() => setIsSaveViewModalOpen(false)}
                className="text-white/50 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveView}>
              <div className="mb-6">
                <label className="block text-xs font-bold tracking-wider text-white/50 uppercase mb-2">
                  Collection Name
                </label>
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="e.g. Active Projects"
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white transition-colors"
                  autoFocus
                  required
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSaveViewModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingView || !newCollectionName.trim()}
                  className="px-4 py-2 bg-white text-black rounded-lg text-sm font-bold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSavingView && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
