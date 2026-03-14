import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus, Globe, Zap, Loader2, Upload as UploadIcon, FileSpreadsheet, Link as LinkIcon } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

interface Notebook {
  id: string;
  name: string;
}

const browserTabs = [
  { id: 1, title: 'Untitled', url: '' },
  { id: 2, title: 'Untitled', url: '' },
  { id: 3, title: 'html.to.design: Convert any website into fully editable Figma designs | Product Hunt', url: 'https://www.producthunt.com/products/html-to-design' },
  { id: 4, title: 'html.to.design — Convert any website into fully editable Figma designs', url: 'https://html.to.design/home' },
  { id: 5, title: 'html.to.design — by <div>RIOTS — Import websites to Figma designs (web,html,css) | Figma', url: 'https://www.figma.com/community/plugin/1159123024924461424/html-to-design-by-divriots-import-websites-to-figma-designs-web-html-css' },
  { id: 6, title: 'Framer: Create a professional website, free. No code website builder loved by designers.', url: 'https://www.framer.com/?utm_source=producthunt&utm_medium=paid&dub_id=6lJm9XM9ky6av7gM&ref=ph_products_category' },
];

type ImportMethod = 'links' | 'browser' | 'rss' | 'csv' | 'crawler';

export default function BulkImport() {
  const { user } = useAuth();
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loadingNotebooks, setLoadingNotebooks] = useState(true);
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedTabs, setSelectedTabs] = useState<Set<number>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [importMethod, setImportMethod] = useState<ImportMethod>('browser');
  
  // CSV State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Crawler State
  const [crawlerUrl, setCrawlerUrl] = useState('');
  const [crawlerDepth, setCrawlerDepth] = useState(1);

  // Domain Router Modal
  const [showDomainRouter, setShowDomainRouter] = useState(false);
  const [routerDomain, setRouterDomain] = useState('');

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
      setLoadingNotebooks(false);
    }, (error) => {
      console.error("Error fetching notebooks:", error);
      setLoadingNotebooks(false);
    });

    return () => unsubscribe();
  }, [user]);

  const toggleTabSelection = (id: number) => {
    const newSelection = new Set(selectedTabs);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedTabs(newSelection);
  };

  const handleImport = async () => {
    if (!user || !selectedNotebookId) return;

    setIsImporting(true);
    try {
      let sourcesCount = 0;

      if (importMethod === 'browser') {
        const tabsToImport = browserTabs.filter(t => selectedTabs.has(t.id));
        for (const tab of tabsToImport) {
          await addDoc(collection(db, 'sources'), {
            userId: user.uid,
            notebookId: selectedNotebookId,
            title: tab.title || 'Untitled Source',
            url: tab.url || '',
            type: 'link',
            status: 'imported',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
        sourcesCount = tabsToImport.length;
        setSelectedTabs(new Set());
      } else if (importMethod === 'csv' && csvFile) {
        // Mock CSV processing
        await new Promise(resolve => setTimeout(resolve, 1500));
        sourcesCount = 5; // Mock 5 rows
        setCsvFile(null);
      } else if (importMethod === 'crawler' && crawlerUrl) {
        // Mock Crawler processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        sourcesCount = 12; // Mock 12 pages found
        setCrawlerUrl('');
      }

      if (sourcesCount > 0 && selectedNotebookId !== 'pending_assignment') {
        const notebookRef = doc(db, 'notebooks', selectedNotebookId);
        await updateDoc(notebookRef, {
          sourcesCount: increment(sourcesCount),
          updatedAt: new Date().toISOString()
        });
        alert(`Successfully imported ${sourcesCount} sources!`);
      }
    } catch (error) {
      console.error("Error importing sources:", error);
      alert("Failed to import sources.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleSaveDomainRouter = async () => {
    if (!user || !selectedNotebookId || !routerDomain) return;
    try {
      await addDoc(collection(db, 'automation_rules'), {
        userId: user.uid,
        name: `Route ${routerDomain}`,
        trigger: 'source_added',
        triggerValue: routerDomain,
        action: 'route_to_notebook',
        actionValue: selectedNotebookId,
        isActive: true,
        createdAt: new Date().toISOString()
      });
      setShowDomainRouter(false);
      setRouterDomain('');
      alert('Domain Router rule created successfully!');
    } catch (error) {
      console.error("Error creating rule:", error);
      alert("Failed to create rule.");
    }
  };

  const selectedNotebook = notebooks.find(n => n.id === selectedNotebookId);

  return (
    <div className="flex flex-col h-full bg-[#000000] text-white p-8 max-w-5xl mx-auto w-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Bulk Import</h1>
        <p className="text-white/60">Import multiple sources at once from links, browser tabs, or RSS feeds</p>
      </div>

      <div className="space-y-8">
        {/* Target Notebook */}
        <div className="relative z-50">
          <label className="block text-xs font-bold tracking-wider text-[#FF0000] uppercase mb-3">Target Notebook</label>
          <div className="flex gap-4">
            <div 
              className="flex-1 border border-white/20 rounded-lg p-3 flex items-center justify-between bg-white/5 cursor-pointer hover:bg-white/10 transition-colors relative"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center">
                  <span className="text-white font-bold">≡</span>
                </div>
                <div>
                  <div className="font-medium">
                    {loadingNotebooks ? 'Loading...' : selectedNotebook ? selectedNotebook.name : 'Select a notebook...'}
                  </div>
                  <div className="text-xs text-white/50">{notebooks.length} notebooks</div>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-white/50 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-black border border-white/20 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                  {notebooks.map(notebook => (
                    <div 
                      key={notebook.id}
                      className="p-3 hover:bg-white/10 cursor-pointer border-b border-white/10 last:border-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNotebookId(notebook.id);
                        setIsDropdownOpen(false);
                      }}
                    >
                      {notebook.name}
                    </div>
                  ))}
                  {notebooks.length === 0 && !loadingNotebooks && (
                    <div className="p-3 text-white/50 text-center">No notebooks found</div>
                  )}
                </div>
              )}
            </div>
            <button className="px-4 py-2 border border-white/20 rounded-lg flex items-center gap-2 hover:bg-white/10 transition-colors">
              <Plus className="w-4 h-4" /> New
            </button>
          </div>
        </div>

        {/* Import Method */}
        <div>
          <label className="block text-xs font-bold tracking-wider text-[#FF0000] uppercase mb-3">Import Method</label>
          <div className="flex border-b border-white/20 mb-6 overflow-x-auto hide-scrollbar">
            {[
              { id: 'links', label: 'Links' },
              { id: 'browser', label: 'Browser Tabs' },
              { id: 'rss', label: 'RSS Feed' },
              { id: 'csv', label: 'CSV Upload' },
              { id: 'crawler', label: 'Web Crawler' },
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setImportMethod(tab.id as ImportMethod)}
                className={cn(
                  "px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  importMethod === tab.id ? 'border-[#FF0000] text-[#FF0000]' : 'border-transparent text-white/60 hover:text-white'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Method Content */}
          <div className="min-h-[320px]">
            {importMethod === 'browser' && (
              <>
                <div className="bg-white/5 border-l-4 border-[#FF0000] p-4 rounded-r-lg mb-6">
                  <p className="text-sm text-white/80">Select the browser tabs you want to import. Chrome system pages and extension pages are automatically filtered out.</p>
                </div>
                <div className="border border-white/20 rounded-lg overflow-hidden flex flex-col h-[320px]">
                  <div className="flex-1 overflow-y-auto p-2">
                    {browserTabs.map((tab) => (
                      <div 
                        key={tab.id} 
                        className="flex items-start gap-3 p-3 hover:bg-white/5 rounded-lg transition-colors group cursor-pointer"
                        onClick={() => toggleTabSelection(tab.id)}
                      >
                        <input 
                          type="checkbox" 
                          checked={selectedTabs.has(tab.id)}
                          onChange={() => toggleTabSelection(tab.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1 rounded border-white/20 bg-black accent-white" 
                        />
                        <div className="w-5 h-5 bg-white/10 rounded flex items-center justify-center shrink-0 mt-0.5">
                          <Globe className="w-3 h-3 text-white/60" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-white truncate">{tab.title}</p>
                          {tab.url && <p className="text-xs text-white/40 truncate mt-0.5">{tab.url}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {importMethod === 'csv' && (
              <div className="flex flex-col items-center justify-center h-[320px] border-2 border-dashed border-white/20 rounded-lg hover:border-white/40 transition-colors bg-white/5">
                <input 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                />
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
                  <FileSpreadsheet className="w-8 h-8 text-white/60" />
                </div>
                <h3 className="text-lg font-bold mb-2">Upload CSV File</h3>
                <p className="text-white/50 text-sm mb-6 max-w-md text-center">
                  Upload a CSV containing URLs or text content. The first row should contain headers (e.g., 'url', 'title', 'content').
                </p>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-white/90 transition-colors"
                >
                  {csvFile ? csvFile.name : 'Select File'}
                </button>
              </div>
            )}

            {importMethod === 'crawler' && (
              <div className="space-y-6">
                <div className="bg-white/5 border-l-4 border-[#FF0000] p-4 rounded-r-lg">
                  <p className="text-sm text-white/80">Enter a starting URL. The crawler will automatically extract text content from the page and its subpages up to the specified depth.</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">Starting URL</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LinkIcon className="h-5 w-5 text-white/40" />
                      </div>
                      <input 
                        type="url" 
                        value={crawlerUrl}
                        onChange={(e) => setCrawlerUrl(e.target.value)}
                        placeholder="https://example.com/docs"
                        className="w-full bg-black border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF0000]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">Crawl Depth</label>
                    <select 
                      value={crawlerDepth}
                      onChange={(e) => setCrawlerDepth(Number(e.target.value))}
                      className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FF0000]"
                    >
                      <option value={1}>1 - Only this page</option>
                      <option value={2}>2 - This page and direct links</option>
                      <option value={3}>3 - Deep crawl (slower)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Other methods placeholders */}
            {(importMethod === 'links' || importMethod === 'rss') && (
              <div className="flex items-center justify-center h-[320px] border border-white/20 rounded-lg text-white/50">
                {importMethod} import coming soon
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <button 
              onClick={handleImport}
              disabled={
                !selectedNotebookId || 
                isImporting || 
                (importMethod === 'browser' && selectedTabs.size === 0) ||
                (importMethod === 'csv' && !csvFile) ||
                (importMethod === 'crawler' && !crawlerUrl)
              }
              className="flex-1 bg-white text-black py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadIcon className="w-5 h-5" />}
              {importMethod === 'browser' ? `Import Selected Tabs (${selectedTabs.size})` : 'Start Import'}
            </button>
            <button 
              onClick={() => setShowDomainRouter(true)}
              className="flex-1 bg-black border border-white/20 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
            >
              <Zap className="w-5 h-5" /> Domain Router
            </button>
          </div>
        </div>
      </div>

      {/* Domain Router Modal */}
      {showDomainRouter && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-white/20 rounded-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-[#FF0000]/20 rounded-lg flex items-center justify-center text-[#FF0000]">
                  <Zap className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-white">Create Domain Router</h2>
              </div>
              <p className="text-sm text-white/60">Automatically route saved links from a specific domain to a notebook.</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">When I save a link from:</label>
                <input 
                  type="text" 
                  value={routerDomain}
                  onChange={(e) => setRouterDomain(e.target.value)}
                  placeholder="e.g., youtube.com"
                  className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF0000]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Route it to notebook:</label>
                <div className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white">
                  {selectedNotebook ? selectedNotebook.name : 'Please select a target notebook first'}
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-white/10 flex justify-end gap-3 bg-black/50">
              <button 
                onClick={() => setShowDomainRouter(false)}
                className="px-4 py-2 text-white/60 hover:text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveDomainRouter}
                disabled={!routerDomain || !selectedNotebookId}
                className="px-6 py-2 bg-[#FF0000] text-white font-bold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Create Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
