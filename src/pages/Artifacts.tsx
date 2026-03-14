import { useState, useEffect } from 'react';
import { Download, FolderInput, Trash2, Plus, Search, Filter, RefreshCw, ExternalLink, Eye, Mic, Loader2, X } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

interface Artifact {
  id: string;
  name: string;
  notebookId: string;
  type: string;
  createdAt: string;
}

interface Notebook {
  id: string;
  name: string;
  updatedAt: string;
}

export default function Artifacts() {
  const { user } = useAuth();
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('Infographic');
  const [selectedNotebookId, setSelectedNotebookId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'artifacts'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const artifactsData: Artifact[] = [];
      snapshot.forEach((doc) => {
        artifactsData.push({ id: doc.id, ...doc.data() } as Artifact);
      });
      artifactsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setArtifacts(artifactsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching artifacts:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notebooks'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notebooksData: Notebook[] = [];
      snapshot.forEach((doc) => {
        notebooksData.push({ id: doc.id, name: doc.data().name, updatedAt: doc.data().updatedAt });
      });
      notebooksData.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setNotebooks(notebooksData);
      if (notebooksData.length > 0 && !selectedNotebookId) {
        setSelectedNotebookId(notebooksData[0].id);
      }
    }, (error) => {
      console.error("Error fetching notebooks:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCreateArtifact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newName.trim() || !selectedNotebookId) return;

    setIsCreating(true);
    try {
      await addDoc(collection(db, 'artifacts'), {
        userId: user.uid,
        name: newName.trim(),
        notebookId: selectedNotebookId,
        type: newType,
        createdAt: new Date().toISOString()
      });
      setNewName('');
      setNewType('Infographic');
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Error creating artifact:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this artifact?')) return;
    try {
      await deleteDoc(doc(db, 'artifacts', id));
    } catch (error) {
      console.error("Error deleting artifact:", error);
    }
  };

  const filteredArtifacts = artifacts.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getNotebookName = (notebookId: string) => {
    if (notebookId === 'pending_assignment') return 'Unassigned';
    const notebook = notebooks.find(n => n.id === notebookId);
    return notebook ? notebook.name : 'Unknown Notebook';
  };

  return (
    <div className="flex flex-col h-full bg-[#000000] text-white p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 border border-[#FF0000] rounded flex items-center justify-center text-[#FF0000] font-bold">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : artifacts.length}
          </div>
          <h1 className="text-3xl font-bold">All Artifacts</h1>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-md font-bold hover:bg-white/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Artifact
        </button>
      </div>
      
      <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-black border border-white/20 rounded text-sm hover:bg-white/10 transition-colors">
            <Download className="w-4 h-4" /> Download
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-black border border-white/20 rounded text-sm hover:bg-white/10 transition-colors">
            <FolderInput className="w-4 h-4" /> Move to Folder
          </button>
        </div>
        
        <div className="flex gap-2 items-center">
          <select className="bg-black border border-white/20 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-white">
            <option>All Folders</option>
          </select>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search artifacts..." 
              className="bg-black border border-white/20 rounded pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:border-white w-64" 
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-black border border-white/20 rounded text-sm hover:bg-white/10 transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
          <button className="p-1.5 bg-black border border-white/20 rounded hover:bg-white/10 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto border border-white/20 rounded-lg">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-white/5 border-b border-white/20 text-white/60">
            <tr>
              <th className="px-4 py-3 w-12"><input type="checkbox" className="rounded border-white/20 bg-black accent-white" /></th>
              <th className="px-4 py-3">Aa Name</th>
              <th className="px-4 py-3">Notebook</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {artifacts.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-white/50">
                  No artifacts found. Create one to get started.
                </td>
              </tr>
            )}
            {filteredArtifacts.map((a) => (
              <tr key={a.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3"><input type="checkbox" className="rounded border-white/20 bg-black accent-white" /></td>
                <td className="px-4 py-3 font-medium">{a.name}</td>
                <td className="px-4 py-3 text-white/60 truncate max-w-xs">{getNotebookName(a.notebookId)}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded border border-white/20 text-xs font-medium">
                    {a.type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3 text-white/60">
                    <ExternalLink className="w-4 h-4 hover:text-white cursor-pointer" />
                    <Eye className="w-4 h-4 hover:text-white cursor-pointer" />
                    <Download className="w-4 h-4 hover:text-white cursor-pointer" />
                    {a.type === 'Audio Overview' && <Mic className="w-4 h-4 hover:text-white cursor-pointer" />}
                    <Trash2 
                      className="w-4 h-4 hover:text-[#FF0000] cursor-pointer ml-2" 
                      onClick={() => handleDelete(a.id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Artifact Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#000000] border border-white/20 rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Create New Artifact</h2>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-white/50 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateArtifact}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold tracking-wider text-white/50 uppercase mb-2">
                    Artifact Name
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Q3 Report Summary"
                    className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white transition-colors"
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold tracking-wider text-white/50 uppercase mb-2">
                    Target Notebook
                  </label>
                  <select
                    value={selectedNotebookId}
                    onChange={(e) => setSelectedNotebookId(e.target.value)}
                    className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white transition-colors appearance-none"
                    required
                  >
                    <option value="" disabled>Select a notebook</option>
                    {notebooks.map(n => (
                      <option key={n.id} value={n.id}>{n.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold tracking-wider text-white/50 uppercase mb-2">
                    Artifact Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white transition-colors appearance-none"
                    required
                  >
                    <option value="Infographic">Infographic</option>
                    <option value="Note">Note</option>
                    <option value="Audio Overview">Audio Overview</option>
                    <option value="Video Overview">Video Overview</option>
                    <option value="Mind Map">Mind Map</option>
                  </select>
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
                  disabled={isCreating || !newName.trim() || !selectedNotebookId}
                  className="px-4 py-2 bg-white text-black rounded-lg text-sm font-bold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Artifact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
