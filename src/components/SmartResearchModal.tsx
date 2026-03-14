import { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { X, Sparkles, Loader2, ExternalLink, Globe } from 'lucide-react';
import Markdown from 'react-markdown';

interface SmartResearchModalProps {
  onClose: () => void;
}

export default function SmartResearchModal({ onClose }: SmartResearchModalProps) {
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [groundingLinks, setGroundingLinks] = useState<{ uri: string; title: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);
    setGroundingLinks([]);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key is not configured.');
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Research the following topic and provide a comprehensive summary suitable for a NotebookLM source. Topic: ${topic}`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      setResult(response.text || 'No content generated.');

      // Extract grounding metadata
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks && Array.isArray(chunks)) {
        const links = chunks
          .filter((chunk: any) => chunk.web?.uri && chunk.web?.title)
          .map((chunk: any) => ({
            uri: chunk.web.uri,
            title: chunk.web.title,
          }));
        
        // Deduplicate links by URI
        const uniqueLinks = Array.from(new Map(links.map(item => [item.uri, item])).values());
        setGroundingLinks(uniqueLinks);
      }
    } catch (err: any) {
      console.error('Research error:', err);
      setError(err.message || 'An error occurred during research.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2 text-indigo-600">
            <Sparkles className="w-5 h-5" />
            <h2 className="text-lg font-semibold text-slate-900">Smart Research</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {!result && !isLoading && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">What would you like to research?</h3>
              <p className="text-slate-500 max-w-md mx-auto mb-8">
                Enter a topic, and Braintex will use Google Search to compile a comprehensive briefing document with citations.
              </p>
            </div>
          )}

          <form onSubmit={handleResearch} className="mb-8">
            <div className="flex gap-3">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Latest advancements in solid-state batteries"
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !topic.trim()}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Researching...
                  </>
                ) : (
                  'Research'
                )}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </form>

          {result && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="prose prose-slate max-w-none prose-headings:font-semibold prose-a:text-indigo-600 hover:prose-a:text-indigo-700">
                <div className="markdown-body">
                  <Markdown>{result}</Markdown>
                </div>
              </div>

              {groundingLinks.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-400" />
                    Sources & Citations
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {groundingLinks.map((link, idx) => {
                      let hostname = link.uri;
                      try {
                        hostname = new URL(link.uri).hostname;
                      } catch (e) {
                        // ignore
                      }
                      return (
                        <a 
                          key={idx}
                          href={link.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors group"
                        >
                          <div className="mt-0.5 shrink-0">
                            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-700 group-hover:text-indigo-700 truncate">
                              {link.title}
                            </p>
                            <p className="text-xs text-slate-500 truncate mt-0.5">
                              {hostname}
                            </p>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {result && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors"
            >
              Close
            </button>
            <button className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm">
              Save as Notebook Source
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

