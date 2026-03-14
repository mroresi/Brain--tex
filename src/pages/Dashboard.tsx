import { ArrowRight, Book, MessageSquare, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back, MR</h1>
          <p className="text-slate-500 mt-1">Here's what's happening in your knowledge base today.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
            Import Source
          </button>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
            New Notebook
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-4">
            <Book className="w-5 h-5 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">12 Notebooks</h3>
          <p className="text-slate-500 text-sm mt-1">2 updated this week</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mb-4">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">48 Saved Prompts</h3>
          <p className="text-slate-500 text-sm mt-1">Across 4 categories</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center mb-4">
            <Zap className="w-5 h-5 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">3 Active Automations</h3>
          <p className="text-slate-500 text-sm mt-1">Processing new imports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-900">Recent Notebooks</h2>
            <Link to="/notebooks" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center">
                    <Book className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {['Product Strategy 2026', 'Competitor Analysis', 'Engineering Onboarding'][i-1]}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">Updated {i * 2} hours ago</p>
                  </div>
                </div>
                <div className="flex -space-x-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 border-2 border-white text-[10px] font-medium text-slate-600">
                    {i * 3}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-900">Recent Imports</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-900">
                      {['ChatGPT: React Architecture', 'Claude: Marketing Copy', 'Web: Stripe API Docs'][i-1]}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">Imported to {['Engineering', 'Marketing', 'Engineering'][i-1]}</p>
                  </div>
                </div>
                <button className="text-xs font-medium text-slate-500 hover:text-indigo-600">
                  View
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
