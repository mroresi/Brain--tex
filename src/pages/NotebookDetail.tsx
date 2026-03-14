import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight,
  Book, 
  Settings, 
  Share, 
  Download, 
  RefreshCw, 
  FileText, 
  MessageSquare, 
  Globe, 
  Youtube, 
  File,
  MoreHorizontal,
  Plus,
  Tag,
  Loader2,
  Rss,
  FileSpreadsheet
} from 'lucide-react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

interface Notebook {
  id: string;
  name: string;
  tags: string[];
  createdAt: string;
}

interface Source {
  id: string;
  title: string;
  type: string;
  status: string;
  createdAt: string;
}

interface Artifact {
  id: string;
  title: string;
  type: string;
  createdAt: string;
}

const getSourceIcon = (type: string) => {
  switch (type) {
    case 'link': return <Globe className="w-4 h-4 text-white/60" />;
    case 'text': return <FileText className="w-4 h-4 text-white/60" />;
    case 'rss': return <Rss className="w-4 h-4 text-white/60" />;
    case 'csv': return <FileSpreadsheet className="w-4 h-4 text-white/60" />;
    default: return <File className="w-4 h-4 text-white/60" />;
  }
};

export default function NotebookDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'sources' | 'artifacts'>('sources');
  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;

    const fetchNotebook = async () => {
      try {
        const docRef = doc(db, 'notebooks', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().userId === user.uid) {
          setNotebook({ id: docSnap.id, ...docSnap.data() } as Notebook);
        }
      } catch (error) {
        console.error("Error fetching notebook:", error);
      }
    };

    fetchNotebook();

    const sourcesQuery = query(
      collection(db, 'sources'),
      where('userId', '==', user.uid),
      where('notebookId', '==', id)
    );

    const unsubscribeSources = onSnapshot(sourcesQuery, (snapshot) => {
      const sourcesData: Source[] = [];
      snapshot.forEach((doc) => {
        sourcesData.push({ id: doc.id, ...doc.data() } as Source);
      });
      setSources(sourcesData);
    });

    const artifactsQuery = query(
      collection(db, 'artifacts'),
      where('userId', '==', user.uid),
      where('notebookId', '==', id)
    );

    const unsubscribeArtifacts = onSnapshot(artifactsQuery, (snapshot) => {
      const artifactsData: Artifact[] = [];
      snapshot.forEach((doc) => {
        artifactsData.push({ id: doc.id, ...doc.data() } as Artifact);
      });
      setArtifacts(artifactsData);
      setLoading(false);
    });

    return () => {
      unsubscribeSources();
      unsubscribeArtifacts();
    };
  }, [user, id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#000000] text-white">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF0000]" />
      </div>
    );
  }

  if (!notebook) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#000000] text-white p-6">
        <h2 className="text-2xl font-bold mb-4">Notebook not found</h2>
        <Link to="/notebooks" className="text-[#FF0000] hover:underline">Return to Notebooks</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#000000] text-white">
      {/* Header */}
      <div className="border-b border-white/20 px-6 py-6 shrink-0">
        <div className="max-w-7xl mx-auto w-full">
          <Link to="/notebooks" className="inline-flex items-center gap-2 text-sm font-medium text-white/50 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Notebooks
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/5 border border-white/20 rounded-xl flex items-center justify-center shrink-0 mt-1">
                <Book className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">{notebook.name}</h1>
                <p className="text-white/50 mt-2 max-w-2xl text-sm">Created on {new Date(notebook.createdAt).toLocaleDateString()}</p>
                <div className="flex items-center gap-3 mt-4">
                  {notebook.tags && notebook.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 text-xs font-medium text-white/80">
                      <Tag className="w-3.5 h-3.5 text-white/40" />
                      {tag}
                    </span>
                  ))}
                  <button className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-dashed border-white/30 text-xs font-medium text-white/50 hover:text-white hover:border-white/60 transition-colors">
                    <Plus className="w-3 h-3" /> Add Tag
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <button className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Sync">
                <RefreshCw className="w-5 h-5" />
              </button>
              <button className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Export">
                <Download className="w-5 h-5" />
              </button>
              <button className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Share">
                <Share className="w-5 h-5" />
              </button>
              <button className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Settings">
                <Settings className="w-5 h-5" />
              </button>
              <div className="w-px h-6 bg-white/20 mx-2" />
              <button className="px-4 py-2 bg-[#FF0000] text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors flex items-center gap-2">
                Open in NotebookLM
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto w-full space-y-6">
          
          {/* Tabs */}
          <div className="flex border-b border-white/20">
            <button
              onClick={() => setActiveTab('sources')}
              className={cn(
                "px-6 py-3 text-sm font-bold border-b-2 transition-colors",
                activeTab === 'sources' 
                  ? "border-[#FF0000] text-[#FF0000]" 
                  : "border-transparent text-white/50 hover:text-white hover:border-white/30"
              )}
            >
              Sources ({sources.length})
            </button>
            <button
              onClick={() => setActiveTab('artifacts')}
              className={cn(
                "px-6 py-3 text-sm font-bold border-b-2 transition-colors",
                activeTab === 'artifacts' 
                  ? "border-[#FF0000] text-[#FF0000]" 
                  : "border-transparent text-white/50 hover:text-white hover:border-white/30"
              )}
            >
              Artifacts ({artifacts.length})
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'sources' ? (
            <div className="bg-black rounded-xl border border-white/20 overflow-hidden">
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">All Sources</h2>
                <Link to="/capture" className="text-sm font-bold text-white hover:text-[#FF0000] flex items-center gap-1 transition-colors">
                  <Plus className="w-4 h-4" /> Add Source
                </Link>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 border-b border-white/10 text-white/50 font-medium">
                  <tr>
                    <th className="px-6 py-3">Title</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Added</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {sources.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-white/50">
                        No sources in this notebook yet.
                      </td>
                    </tr>
                  )}
                  {sources.map((source) => (
                    <tr key={source.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center shrink-0">
                            {getSourceIcon(source.type)}
                          </div>
                          <span className="font-medium text-white group-hover:text-[#FF0000] transition-colors cursor-pointer">{source.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white/50 capitalize">
                        {source.type}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-medium border",
                          source.status === 'imported' 
                            ? "bg-green-500/10 border-green-500/30 text-green-500" 
                            : "bg-yellow-500/10 border-yellow-500/30 text-yellow-500"
                        )}>
                          {source.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white/50">
                        {new Date(source.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-white/30 hover:text-white p-1 transition-colors">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {artifacts.map((artifact) => (
                <div key={artifact.id} className="bg-black p-6 rounded-xl border border-white/20 hover:border-white/40 transition-all group cursor-pointer flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white/60 group-hover:bg-white/10 group-hover:text-white group-hover:border-white/30 transition-colors">
                      <FileText className="w-6 h-6" />
                    </div>
                    <button className="text-white/30 hover:text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#FF0000] transition-colors">{artifact.title}</h3>
                  <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-6">{artifact.type}</p>
                  <div className="mt-auto pt-4 border-t border-white/10 text-xs text-white/40 flex items-center justify-between">
                    <span>Generated {new Date(artifact.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              
              <Link to="/artifacts" className="bg-black border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center p-8 text-center hover:bg-white/5 hover:border-white/40 transition-colors cursor-pointer min-h-[200px]">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white mb-4">
                  <Plus className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Generate Artifact</h3>
                <p className="text-xs text-white/50 mt-2 max-w-[200px]">Create study guides, briefings, and more.</p>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
