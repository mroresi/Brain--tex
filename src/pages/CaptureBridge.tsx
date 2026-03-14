import { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  ExternalLink, 
  Copy, 
  CheckCircle, 
  ChevronUp, 
  Link as LinkIcon, 
  Globe, 
  Rss, 
  FileSpreadsheet, 
  Bug,
  AlertCircle,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { collection, addDoc, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

interface Notebook {
  id: string;
  name: string;
}

export default function CaptureBridge() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('rss');
  const [payloadText, setPayloadText] = useState('');
  const [isDetected, setIsDetected] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loadingNotebooks, setLoadingNotebooks] = useState(true);
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

  const handleDetectPayload = () => {
    // Simulate detecting a payload from clipboard or file
    const samplePayload = `# Generated Research Summary\n\nThis is a sample payload detected from your clipboard or recent downloads. It contains formatted markdown ready to be imported into NotebookLM.\n\n## Key Findings\n- Point 1\n- Point 2`;
    setPayloadText(samplePayload);
    setIsDetected(true);
    setIsCopied(false);
    setSaveSuccess(false);
  };

  const handleCopy = async () => {
    if (!payloadText) return;
    try {
      await navigator.clipboard.writeText(payloadText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const handleOpenNotebookLM = () => {
    window.open('https://notebooklm.google.com/', '_blank');
  };

  const handleMarkImported = async () => {
    if (!user || !payloadText || !selectedNotebookId) return;
    
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'sources'), {
        userId: user.uid,
        notebookId: selectedNotebookId,
        title: `Imported Payload ${new Date().toLocaleDateString()}`,
        type: 'text',
        status: 'imported',
        createdAt: new Date().toISOString()
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setPayloadText('');
        setIsDetected(false);
      }, 3000);
    } catch (error) {
      console.error("Error saving source:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedNotebook = notebooks.find(n => n.id === selectedNotebookId);

  return (
    <div className="flex flex-col h-full bg-[#000000] text-white font-sans selection:bg-[#FF0000]/30">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/20 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-bold text-white/50 tracking-widest uppercase">Capture Bridge</h1>
          <span className="text-sm text-white/60">Daily path: capture payload, paste into NotebookLM, then mark imported.</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/20 text-xs font-medium text-white/60 hover:text-white hover:border-white/40 transition-colors">
            <ExternalLink className="w-3.5 h-3.5" />
            Capture Bridge
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <div className="max-w-5xl space-y-8">
          
          {/* Reliable Now Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-[#FF0000]/10 border border-[#FF0000]/20 flex items-center justify-center text-[#FF0000]">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Reliable Now</h2>
                <p className="text-sm text-white/60">Detect the payload, copy clean markdown, open NotebookLM in your regular browser, then mark the import complete.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left Panel - Actions */}
              <div className="bg-black border border-white/20 rounded-xl p-5 space-y-4">
                
                {/* Target Notebook Selection */}
                <div className="space-y-2 relative">
                  <label className="text-[10px] font-bold tracking-wider text-white/50 uppercase">Target Notebook</label>
                  <div 
                    className="flex-1 border border-white/20 rounded-lg p-3 flex items-center justify-between bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center">
                        <span className="text-white font-bold">≡</span>
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {loadingNotebooks ? 'Loading...' : selectedNotebook ? selectedNotebook.name : 'Select a notebook...'}
                        </div>
                        <div className="text-xs text-white/50">{notebooks.length} notebooks</div>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-white/50 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                  
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-black border border-white/20 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                      {notebooks.map(notebook => (
                        <div 
                          key={notebook.id}
                          className="p-3 hover:bg-white/10 cursor-pointer border-b border-white/10 last:border-0 text-sm"
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
                        <div className="p-3 text-white/50 text-center text-sm">No notebooks found</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-wider text-white/50 uppercase">Payload File</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={isDetected ? "Payload Ready" : "Waiting for payload..."}
                      readOnly
                      className="flex-1 bg-black border border-white/20 rounded-md px-3 py-2 text-sm font-mono text-white/60 focus:outline-none"
                    />
                    <button 
                      onClick={handleDetectPayload}
                      className="px-3 py-2 bg-white text-black rounded-md text-sm font-bold hover:bg-white/90 transition-colors"
                    >
                      Detect Payload
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button 
                    onClick={handleCopy}
                    disabled={!isDetected}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 p-4 border rounded-lg transition-colors",
                      isDetected 
                        ? "bg-white/10 border-white/40 text-white hover:bg-white/20" 
                        : "bg-black border-white/10 text-white/30 cursor-not-allowed"
                    )}
                  >
                    <Copy className="w-5 h-5" />
                    <span className="text-sm font-medium">{isCopied ? 'Copied!' : 'Copy Import Text'}</span>
                  </button>
                  <button 
                    disabled={true}
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-black border border-white/10 rounded-lg text-white/30 cursor-not-allowed"
                  >
                    <Download className="w-5 h-5" />
                    <span className="text-sm font-medium">Download Import Text</span>
                  </button>
                  <button 
                    disabled={true}
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-black border border-white/10 rounded-lg text-white/30 cursor-not-allowed"
                  >
                    <Copy className="w-5 h-5" />
                    <span className="text-sm font-medium text-center leading-tight">Copy NotebookLM URL</span>
                  </button>
                  <button 
                    onClick={handleOpenNotebookLM}
                    disabled={!isDetected}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 p-4 border rounded-lg transition-colors",
                      isDetected 
                        ? "bg-white/10 border-white/40 text-white hover:bg-white/20" 
                        : "bg-black border-white/10 text-white/30 cursor-not-allowed"
                    )}
                  >
                    <ExternalLink className="w-5 h-5" />
                    <span className="text-sm font-medium text-center leading-tight">Open NotebookLM</span>
                  </button>
                  <button 
                    onClick={handleMarkImported}
                    disabled={!isDetected || isSaving || saveSuccess || !selectedNotebookId}
                    className={cn(
                      "col-span-2 flex items-center justify-center gap-2 p-3 border rounded-lg mt-2 transition-colors",
                      isDetected && !saveSuccess && selectedNotebookId
                        ? "bg-[#FF0000]/10 border-[#FF0000]/30 text-[#FF0000] hover:bg-[#FF0000]/20"
                        : "bg-black border-white/10 text-white/30 cursor-not-allowed",
                      saveSuccess && "bg-green-500/10 border-green-500/30 text-green-500"
                    )}
                    title={!selectedNotebookId ? "Select a notebook first" : ""}
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    <span className="text-sm font-medium">
                      {saveSuccess ? 'Import Marked & Saved!' : 'Mark Imported'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Right Panel - Detected Payload */}
              <div className="bg-black border border-white/20 rounded-xl p-5 flex flex-col">
                <label className="text-[10px] font-bold tracking-wider text-white/50 uppercase mb-4">Detected Payload</label>
                <div className={cn(
                  "flex-1 flex items-center justify-center text-center p-6 border rounded-lg overflow-hidden",
                  isDetected ? "border-white/20" : "border-dashed border-white/20"
                )}>
                  {isDetected ? (
                    <div className="w-full h-full text-left overflow-y-auto font-mono text-xs text-white/80 whitespace-pre-wrap">
                      {payloadText}
                    </div>
                  ) : (
                    <p className="text-sm text-white/40 max-w-xs">
                      Nothing is ready yet. Detect a payload first, then the copy and completion actions unlock in order.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Experimental Section */}
          <div className="space-y-4 pt-4">
            <button className="w-full flex items-center justify-between p-4 bg-black border border-white/20 rounded-xl hover:bg-white/5 transition-colors group">
              <div className="flex flex-col items-start text-left">
                <span className="text-[10px] font-bold tracking-wider text-white/50 uppercase mb-1">Experimental / Internal Surfaces</span>
                <span className="text-sm text-white/80">Reveal only if you are testing internal bulk tools. Daily use should stay on the manual bridge.</span>
              </div>
              <ChevronUp className="w-5 h-5 text-white/50 group-hover:text-white" />
            </button>

            <div className="space-y-4">
              <label className="text-[10px] font-bold tracking-wider text-white/50 uppercase block">Experimental / Internal Surfaces</label>
              
              {/* Tabs */}
              <div className="flex bg-black border border-white/20 rounded-lg p-1 overflow-x-auto hide-scrollbar">
                {[
                  { id: 'links', icon: LinkIcon, label: 'Links' },
                  { id: 'browser', icon: Globe, label: 'Browser Tabs' },
                  { id: 'rss', icon: Rss, label: 'RSS Feed' },
                  { id: 'csv', icon: FileSpreadsheet, label: 'CSV Upload' },
                  { id: 'crawler', icon: Bug, label: 'Web Crawler' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                      activeTab === tab.id 
                        ? "bg-white/10 text-white" 
                        : "text-white/50 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Alert */}
              <div className="flex items-start gap-3 p-4 bg-[#FF0000]/10 border border-[#FF0000]/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-[#FF0000] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-[#FF0000]">Import Method Not Available In V1</h3>
                  <p className="text-xs text-[#FF0000]/80 mt-1">These bulk surfaces are not part of the supported v1 path. Use the manual bridge above for daily use.</p>
                </div>
              </div>

              {/* Textarea */}
              <textarea 
                className="w-full h-64 bg-black border border-white/20 rounded-lg p-4 font-mono text-sm text-white/60 focus:outline-none focus:border-white resize-none"
                defaultValue={`https://example.com/article1\nhttps://example.com/article2\nhttps://example.com/article3`}
                readOnly
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
