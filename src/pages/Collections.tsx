import { useState, useEffect } from 'react';
import { Folder, Plus, Settings, Loader2, X, Trash2 } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

interface Collection {
  id: string;
  name: string;
  description: string;
  notebooksCount: number;
  createdAt: string;
}

export default function Collections() {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'collections'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const collectionsData: Collection[] = [];
      snapshot.forEach((doc) => {
        collectionsData.push({ id: doc.id, ...doc.data() } as Collection);
      });
      collectionsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setCollections(collectionsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching collections:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newName.trim()) return;

    setIsCreating(true);
    try {
      await addDoc(collection(db, 'collections'), {
        userId: user.uid,
        name: newName.trim(),
        description: newDescription.trim(),
        notebooksCount: 0,
        createdAt: new Date().toISOString()
      });
      setNewName('');
      setNewDescription('');
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Error creating collection:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this collection?')) return;
    try {
      await deleteDoc(doc(db, 'collections', id));
    } catch (error) {
      console.error("Error deleting collection:", error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#000000] text-white p-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 border border-[#FF0000] rounded flex items-center justify-center text-[#FF0000] font-bold">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : collections.length}
          </div>
          <div>
            <h1 className="text-2xl font-bold">Collections</h1>
            <p className="text-white/50 text-sm mt-1">Group your notebooks into logical workspaces.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-white text-black rounded-lg text-sm font-bold hover:bg-white/90 transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> New Collection
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        {collections.length === 0 && !loading && (
          <div className="text-center py-12 border border-dashed border-white/20 rounded-xl text-white/50">
            No collections found. Create your first collection to get started.
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <div key={collection.id} className="bg-black p-6 rounded-xl border border-white/20 hover:border-white/40 transition-all group cursor-pointer flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white/60 group-hover:bg-white/10 group-hover:text-white group-hover:border-white/30 transition-colors">
                  <Folder className="w-6 h-6" />
                </div>
                <div className="flex gap-2">
                  <button 
                    className="text-white/30 hover:text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => handleDelete(e, collection.id)}
                    className="text-white/30 hover:text-[#FF0000] p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#FF0000] transition-colors">{collection.name}</h3>
              <p className="text-sm text-white/50 mb-6 line-clamp-2">{collection.description || 'No description provided.'}</p>
              
              <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-sm font-medium text-white/70">{collection.notebooksCount || 0} Notebooks</span>
                <span className="text-xs font-bold text-[#FF0000] opacity-0 group-hover:opacity-100 transition-opacity">View All &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Collection Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#000000] border border-white/20 rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Create New Collection</h2>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-white/50 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateCollection}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold tracking-wider text-white/50 uppercase mb-2">
                    Collection Name
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Q1 Planning"
                    className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white transition-colors"
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold tracking-wider text-white/50 uppercase mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="e.g. Strategy and OKRs for Q1 2026"
                    className="w-full h-24 bg-black border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white transition-colors resize-none"
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
                  disabled={isCreating || !newName.trim()}
                  className="px-4 py-2 bg-white text-black rounded-lg text-sm font-bold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
