import { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, addDoc, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

interface Notebook {
  id: string;
  name: string;
  sourcesCount: number;
}

export default function MergeNotebooks() {
  const { user } = useAuth();
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotebooks, setSelectedNotebooks] = useState<Set<string>>(new Set());
  const [newNotebookName, setNewNotebookName] = useState('');
  const [deleteOriginals, setDeleteOriginals] = useState(false);
  const [isMerging, setIsMerging] = useState(false);

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
      notebooksData.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setNotebooks(notebooksData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching notebooks:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedNotebooks);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedNotebooks(newSelection);
  };

  const toggleAll = () => {
    if (selectedNotebooks.size === filteredNotebooks.length) {
      setSelectedNotebooks(new Set());
    } else {
      setSelectedNotebooks(new Set(filteredNotebooks.map(n => n.id)));
    }
  };

  const handleMerge = async () => {
    if (!user || selectedNotebooks.size < 2 || !newNotebookName.trim()) return;

    setIsMerging(true);
    try {
      // 1. Create the new notebook
      const newNotebookRef = await addDoc(collection(db, 'notebooks'), {
        userId: user.uid,
        name: newNotebookName.trim(),
        sourcesCount: 0, // Will update this later
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const newNotebookId = newNotebookRef.id;
      let totalSourcesCount = 0;

      // 2. Find all sources belonging to the selected notebooks and update them
      // Note: Firestore batch has a limit of 500 operations.
      // For a robust implementation, we should chunk the updates if there are many sources.
      // Here we'll do a simple batch for demonstration, assuming < 500 sources total.
      const batch = writeBatch(db);
      
      for (const notebookId of Array.from(selectedNotebooks)) {
        const sourcesQuery = query(
          collection(db, 'sources'),
          where('userId', '==', user.uid),
          where('notebookId', '==', notebookId)
        );
        const sourcesSnapshot = await getDocs(sourcesQuery);
        
        sourcesSnapshot.forEach((sourceDoc) => {
          batch.update(doc(db, 'sources', sourceDoc.id), {
            notebookId: newNotebookId,
            updatedAt: new Date().toISOString()
          });
          totalSourcesCount++;
        });

        // 3. Delete original notebooks if requested
        if (deleteOriginals) {
          batch.delete(doc(db, 'notebooks', notebookId));
        }
      }

      // Update the new notebook's source count
      batch.update(doc(db, 'notebooks', newNotebookId), {
        sourcesCount: totalSourcesCount
      });

      await batch.commit();

      // Reset state
      setSelectedNotebooks(new Set());
      setNewNotebookName('');
      setDeleteOriginals(false);

    } catch (error) {
      console.error("Error merging notebooks:", error);
    } finally {
      setIsMerging(false);
    }
  };

  const filteredNotebooks = notebooks.filter(n => 
    n.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#000000] text-white p-8 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Merge Notebooks</h1>
        <p className="text-white/60">Select notebooks to merge into a new notebook.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium text-white/80 mb-2">New Notebook Name</label>
          <input 
            type="text" 
            value={newNotebookName}
            onChange={(e) => setNewNotebookName(e.target.value)}
            placeholder="e.g. My Merged Notebook" 
            className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-white transition-colors"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-white/80 mb-2">Search Notebooks</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter notebooks..." 
              className="w-full bg-black border border-white/20 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-white transition-colors"
            />
          </div>
        </div>
        <div className="flex items-end gap-4 pb-1">
          <label className="flex items-center gap-2 text-sm text-white/80 cursor-pointer hover:text-white transition-colors">
            <input 
              type="checkbox" 
              checked={deleteOriginals}
              onChange={(e) => setDeleteOriginals(e.target.checked)}
              className="rounded border-white/20 bg-black accent-white" 
            />
            Delete originals
          </label>
          <button 
            onClick={handleMerge}
            disabled={selectedNotebooks.size < 2 || !newNotebookName.trim() || isMerging}
            className="px-6 py-2 bg-white text-black rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/90 transition-colors flex items-center gap-2"
          >
            {isMerging && <Loader2 className="w-4 h-4 animate-spin" />}
            Merge
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto border border-white/20 rounded-lg flex flex-col">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-white/5 border-b border-white/20 text-white/60 sticky top-0">
            <tr>
              <th className="px-4 py-3 w-12">
                <input 
                  type="checkbox" 
                  checked={selectedNotebooks.size === filteredNotebooks.length && filteredNotebooks.length > 0}
                  onChange={toggleAll}
                  className="rounded border-white/20 bg-black accent-white" 
                />
              </th>
              <th className="px-4 py-3 font-bold tracking-wider uppercase text-xs">Notebook Name</th>
              <th className="px-4 py-3 font-bold tracking-wider uppercase text-xs text-right">Sources</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {loading ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-white/50">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </td>
              </tr>
            ) : filteredNotebooks.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-white/50">
                  No notebooks found.
                </td>
              </tr>
            ) : (
              filteredNotebooks.map((n) => (
                <tr 
                  key={n.id} 
                  className="hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => toggleSelection(n.id)}
                >
                  <td className="px-4 py-3">
                    <input 
                      type="checkbox" 
                      checked={selectedNotebooks.has(n.id)}
                      onChange={() => toggleSelection(n.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded border-white/20 bg-black accent-white" 
                    />
                  </td>
                  <td className="px-4 py-3 text-white/80 font-medium">{n.name}</td>
                  <td className="px-4 py-3 text-white/60 text-right">{n.sourcesCount || 0} source{(n.sourcesCount || 0) !== 1 ? 's' : ''}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="text-right text-sm text-white/50 mt-4 font-medium">
        {selectedNotebooks.size} notebook{selectedNotebooks.size !== 1 ? 's' : ''} selected
      </div>
    </div>
  );
}
