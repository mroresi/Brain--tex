import { Link } from 'react-router-dom';
import { Book, Folder, MoreVertical } from 'lucide-react';
import { Notebook } from '../types';

interface NotebookTableProps {
  notebooks: Notebook[];
}

export default function NotebookTable({ notebooks }: NotebookTableProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Collection</th>
              <th className="px-6 py-4">Stats</th>
              <th className="px-6 py-4">Updated</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {notebooks.map((notebook) => (
              <tr key={notebook.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <Link to={`/notebooks/${notebook.id}`} className="flex items-center gap-3">
                    <Book className="w-5 h-5 text-indigo-500 shrink-0" />
                    <div>
                      <div className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {notebook.name}
                      </div>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {notebook.tags.map(tag => (
                          <span key={tag} className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {notebook.collectionId ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-xs font-medium">
                      <Folder className="w-3.5 h-3.5 text-slate-400" />
                      {notebook.collectionId}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic text-xs">Uncategorized</span>
                  )}
                </td>
                <td className="px-6 py-4 text-slate-500">
                  {notebook.sourcesCount} sources • {notebook.artifactsCount} artifacts
                </td>
                <td className="px-6 py-4 text-slate-500">
                  {notebook.updatedAt}
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
