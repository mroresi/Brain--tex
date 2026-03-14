import { useState, useEffect } from 'react';
import { Plus, Filter, ArrowUpDown, Search, Link as LinkIcon, Download, Loader2, FileText, Globe, Rss, FileSpreadsheet } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

interface Source {
  id: string;
  title: string;
  notebookId: string;
  type: string;
  status: string;
  url?: string;
  createdAt: string;
}

interface Notebook {
  id: string;
  name: string;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'link': return <Globe className="w-4 h-4 text-white/60" />;
    case 'text': return <FileText className="w-4 h-4 text-white/60" />;
    case 'rss': return <Rss className="w-4 h-4 text-white/60" />;
    case 'csv': return <FileSpreadsheet className="w-4 h-4 text-white/60" />;
    default: return <LinkIcon className="w-4 h-4 text-white/60" />;
  }
};

export default function AllSources() {
  const { user } = useAuth();
  const [sources, setSources] = useState<Source[]>([]);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'sources'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sourcesData: Source[] = [];
      snapshot.forEach((doc) => {
        sourcesData.push({ id: doc.id, ...doc.data() } as Source);
      });
      setSources(sourcesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching sources:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notebooks'),
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notebooksData: Notebook[] = [];
      snapshot.forEach((doc) => {
        notebooksData.push({ id: doc.id, name: doc.data().name });
      });
      setNotebooks(notebooksData);
    }, (error) => {
      console.error("Error fetching notebooks:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const getNotebookName = (notebookId: string) => {
    if (notebookId === 'pending_assignment') return 'Unassigned';
    const notebook = notebooks.find(n => n.id === notebookId);
    return notebook ? notebook.name : 'Unknown Notebook';
  };

  return (
    <div className="flex flex-col h-full bg-[#000000] text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 border border-[#FF0000] rounded flex items-center justify-center text-[#FF0000] font-bold">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : sources.length}
          </div>
          <h1 className="text-2xl font-bold">All Sources</h1>
        </div>
        <div className="flex items-center gap-4 text-sm">
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
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Notebook</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date Added</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {sources.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-white/50">
                  No sources found. Use the Capture Bridge to import sources.
                </td>
              </tr>
            )}
            {sources.map((s) => (
              <tr key={s.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3"><input type="checkbox" className="rounded border-white/20 bg-black accent-white" /></td>
                <td className="px-4 py-3 font-medium flex items-center gap-3">
                  {getTypeIcon(s.type)}
                  <span className="truncate max-w-md">{s.title}</span>
                </td>
                <td className="px-4 py-3 text-white/60 truncate max-w-xs">{getNotebookName(s.notebookId)}</td>
                <td className="px-4 py-3 text-white/60 capitalize">{s.type}</td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "px-2 py-1 rounded text-xs font-medium border",
                    s.status === 'imported' 
                      ? "bg-green-500/10 border-green-500/30 text-green-500" 
                      : "bg-yellow-500/10 border-yellow-500/30 text-yellow-500"
                  )}>
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-white/40">
                  {new Date(s.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
