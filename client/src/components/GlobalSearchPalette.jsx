import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';

export default function GlobalSearchPalette({ isOpen, topics, onClose, onSelectTopic }) {
  const [query, setQuery] = useState('');

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return topics.filter((topic) => {
      const inTitle = topic.title.toLowerCase().includes(q);
      const inDesc = topic.description?.toLowerCase().includes(q);
      const inNotes = topic.notes?.toLowerCase().includes(q);
      const inTags = topic.tags?.some((t) => t.toLowerCase().includes(q));
      const inResources = topic.resources?.some((r) => r.title.toLowerCase().includes(q));
      return inTitle || inDesc || inNotes || inTags || inResources;
    });
  }, [query, topics]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-xl w-full shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-200 dark:border-gray-800">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all topics, code, notes, resources..."
            className="w-full text-sm bg-transparent focus:outline-none text-gray-900 dark:text-white"
          />
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xs font-mono">
            ESC
          </button>
        </div>

        <div className="p-3 max-h-96 overflow-y-auto">
          {query.trim() && searchResults.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">
              No topics found matching "{query}"
            </div>
          ) : query.trim() ? (
            <div className="space-y-1">
              {searchResults.map((t) => (
                <div
                  key={t._id}
                  onClick={() => onSelectTopic(t._id)}
                  className="p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                      {t.title}
                    </h4>
                    <p className="text-[11px] text-gray-500 truncate max-w-md">
                      {t.description || t.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      {t.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-gray-400">
              Type to instantly search across titles, notes, markdown, and resource links.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
