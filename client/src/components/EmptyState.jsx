import React from 'react';
import { RotateCcw, StickyNote } from 'lucide-react';

export default function EmptyState({ searchQuery, view, onReset, onCreate }) {
  // Each view is empty for a different reason, so each says its own thing.
  const copy = searchQuery
    ? {
        title: 'No matching topics found',
        body: `We couldn't find anything matching "${searchQuery}". Try another keyword, or clear the filters.`
      }
    : view === 'revision'
      ? {
          title: 'Nothing due for revision',
          body: 'Topics reappear here when their next review date arrives, or when you mark one as needing revision.'
        }
      : {
          title: 'No topics on your board yet',
          body: 'Start building your personal knowledge repository by pinning your first learning topic.'
        };

  return (
    <div className="py-16 px-4 text-center max-w-md mx-auto space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-sm">
        {view === 'revision' ? <RotateCcw className="w-8 h-8" /> : <StickyNote className="w-8 h-8" />}
      </div>
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          {copy.title}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
          {copy.body}
        </p>
      </div>

      <div className="flex items-center justify-center gap-3 pt-2">
        {view === 'revision' ? null : searchQuery ? (
          <button
            onClick={onReset}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
          >
            Clear Filters
          </button>
        ) : (
          <button
            onClick={onCreate}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
          >
            + Create First Topic
          </button>
        )}
      </div>
    </div>
  );
}
