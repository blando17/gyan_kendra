import React from 'react';
import { Star, Trash2 } from 'lucide-react';
import { STATUS_CONFIG } from '../constants';
import { formatRelativeTime } from '../utils/format';

export default function CompactTopicRow({ topic, onOpen, onToggleFavorite, onDelete }) {
  const statusCfg = STATUS_CONFIG[topic.status] || STATUS_CONFIG['Learning'];
  return (
    <div
      onClick={onOpen}
      className="p-3.5 px-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700/60 shadow-xs flex items-center justify-between gap-4 cursor-pointer transition-all hover:bg-gray-50/70 dark:hover:bg-gray-850"
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleFavorite}
          className="text-gray-400 hover:text-amber-500 shrink-0"
        >
          <Star className={`w-4 h-4 ${topic.isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
              {topic.title}
            </h4>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              {topic.category}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
            <span>{topic.resources?.length || 0} resources</span>
            <span>•</span>
            <span>{topic.notes ? 'Notes available' : 'No notes'}</span>
            <span>•</span>
            <span>Updated {formatRelativeTime(topic.updatedAt)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-semibold">
          <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`} />
          <span className="text-gray-700 dark:text-gray-300">{topic.status}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 text-gray-400 hover:text-rose-500 rounded-lg"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
