import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  Book, 
  Link as LinkIcon, 
  Layers, 
  Folder, 
  Star, 
  GitMerge, 
  Settings, 
  FileText, 
  Upload, 
  Menu, 
  X, 
  Bell,
  LogOut
} from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const [counts, setCounts] = useState({
    notebooks: 0,
    sources: 0,
    artifacts: 0,
    collections: 0,
    favorites: 0
  });

  useEffect(() => {
    if (!user) return;

    const notebooksQuery = query(collection(db, 'notebooks'), where('userId', '==', user.uid));
    const unsubscribeNotebooks = onSnapshot(notebooksQuery, (snapshot) => {
      setCounts(prev => ({ ...prev, notebooks: snapshot.size }));
    });

    const sourcesQuery = query(collection(db, 'sources'), where('userId', '==', user.uid));
    const unsubscribeSources = onSnapshot(sourcesQuery, (snapshot) => {
      setCounts(prev => ({ ...prev, sources: snapshot.size }));
    });

    const artifactsQuery = query(collection(db, 'artifacts'), where('userId', '==', user.uid));
    const unsubscribeArtifacts = onSnapshot(artifactsQuery, (snapshot) => {
      setCounts(prev => ({ ...prev, artifacts: snapshot.size }));
    });

    const collectionsQuery = query(collection(db, 'collections'), where('userId', '==', user.uid));
    const unsubscribeCollections = onSnapshot(collectionsQuery, (snapshot) => {
      setCounts(prev => ({ ...prev, collections: snapshot.size }));
    });

    return () => {
      unsubscribeNotebooks();
      unsubscribeSources();
      unsubscribeArtifacts();
      unsubscribeCollections();
    };
  }, [user]);

  const navSections = [
    {
      title: 'Views',
      items: [
        { name: 'Notebooks', href: '/notebooks', icon: Book, count: counts.notebooks },
        { name: 'All Sources', href: '/sources', icon: LinkIcon, count: counts.sources },
        { name: 'Artifacts', href: '/artifacts', icon: Layers, count: counts.artifacts },
      ]
    },
    {
      title: 'Organize',
      items: [
        { name: 'Collections', href: '/collections', icon: Folder, count: counts.collections },
        { name: 'Favorites', href: '/favorites', icon: Star, count: counts.favorites },
      ]
    },
    {
      title: 'Tools',
      items: [
        { name: 'Capture Bridge', href: '/capture', icon: Upload },
        { name: 'Merge Notebooks', href: '/merge', icon: GitMerge },
        { name: 'Automation', href: '/automation', icon: Settings },
        { name: 'Prompts', href: '/prompts', icon: FileText },
        { name: 'Bulk Import', href: '/bulk-import', icon: Upload },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#000000] flex text-white font-sans selection:bg-[#FF0000]/30">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/80 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-[#000000] border-r border-white/20 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0 flex flex-col",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center px-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-[#FF0000] rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm leading-none">B</span>
            </div>
            <span className="text-lg font-semibold text-white tracking-tight">Braintex</span>
          </div>
          <button 
            className="ml-auto lg:hidden text-white/50 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 hide-scrollbar">
          {navSections.map((section, idx) => (
            <div key={section.title} className={cn("px-3", idx > 0 && "mt-6")}>
              <h3 className="px-3 text-[10px] font-bold tracking-wider text-white/50 uppercase mb-2">
                {section.title}
              </h3>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => cn(
                      "flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-white/10 text-[#FF0000]" 
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4 shrink-0" />
                      {item.name}
                    </div>
                    {item.count !== undefined && (
                      <span className="text-xs text-white/40">{item.count}</span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* NotebookLM Account */}
        <div className="shrink-0 border-t border-white/20 p-4">
          <h3 className="text-[10px] font-bold tracking-wider text-white/50 uppercase mb-3">
            ACCOUNT
          </h3>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">
                  {user?.email?.[0].toUpperCase()}
                </div>
              )}
              <span className="text-xs text-white truncate">{user?.email}</span>
            </div>
            <button onClick={logout} className="text-white/50 hover:text-[#FF0000] transition-colors" title="Log out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-[#FF0000]">Syncing with NotebookLM</p>
        </div>
      </div>

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Mobile header */}
        <div className="lg:hidden h-14 border-b border-white/20 flex items-center justify-between px-4 bg-[#000000]">
          <button
            className="text-white/60 hover:text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <button className="text-white/60 hover:text-white"><Bell className="w-4 h-4" /></button>
            <button className="text-white/60 hover:text-white"><Settings className="w-4 h-4" /></button>
          </div>
        </div>
        
        <main className="flex-1 overflow-hidden relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
