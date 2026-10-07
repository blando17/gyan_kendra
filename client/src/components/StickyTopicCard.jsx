import React, { useState } from 'react';
import { Copy, Edit2, FileText, MoreVertical, Star, Trash2, Link as LinkIcon } from 'lucide-react';
import { PASTEL_THEMES, STATUS_CONFIG } from '../constants';
import { formatRelativeTime } from '../utils/format';

export default function StickyTopicCard({ topic, index, onOpen, onToggleFavorite, onDuplicate, onEdit, onDelete, onChangeStatus }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const theme = PASTEL_THEMES.find((th) => th.id === topic.themeId) || PASTEL_THEMES[index % PASTEL_THEMES.length];
  const statusCfg = STATUS_CONFIG[topic.status] || STATUS_CONFIG['Learning'];

  // Subtle rotation for organic sticky-note board aesthetic
  const rotationAngles = ['rotate-[0.5deg]', '-rotate-[0.7deg]', 'rotate-[0.8deg]', '-rotate-[0.5deg]', 'rotate-0'];
  const subtleRotation = rotationAngles[index % rotationAngles.length];

  return (
    <div
      onClick={onOpen}
      className={`group relative flex min-h-[180px] cursor-pointer flex-col justify-between rounded-2xl border p-4 shadow-sticky transition-all duration-200 hover:-translate-y-1 hover:shadow-sticky-lg ${theme.lightBg} ${theme.darkBg} ${subtleRotation}`}
    >
      {/* Push pin, centred on the top edge of the note */}
      <span className="pointer-events-none absolute -top-2.5 left-1/2 z-10 -translate-x-1/2">
        <span
          className="block h-4 w-4 rounded-full shadow-md ring-2 ring-white/70 transition-transform group-hover:scale-110 dark:ring-gray-900/70"
          style={{ backgroundColor: theme.pinColor }}
        >
          {/* the little highlight that makes it read as a dome */}
          <span className="block h-1.5 w-1.5 translate-x-1 translate-y-1 rounded-full bg-white/50" />
        </span>
      </span>

      {/* Top Header: Title & Actions */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className={`text-[15px] font-bold leading-snug tracking-tight ${theme.headerAccent}`}>
            {topic.title}
          </h3>

          <div className="flex items-center gap-1 shrink-0">
            {/* Star Favorite */}
            <button
              onClick={onToggleFavorite}
              className="p-1 rounded-lg text-gray-400 hover:text-amber-500 transition-colors"
              title={topic.isFavorite ? 'Remove favorite' : 'Mark favorite'}
            >
              <Star className={`w-4 h-4 ${topic.isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
            </button>

            {/* Three Dot Options Menu */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 py-1.5 z-30 text-xs font-medium text-gray-700 dark:text-gray-200"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/60"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                    <span>Edit Topic</span>
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDuplicate();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/60"
                  >
                    <Copy className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Duplicate</span>
                  </button>

                  <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                  <div className="px-3 py-1 text-[10px] uppercase font-bold text-gray-400">Change Status</div>
                  {Object.keys(STATUS_CONFIG).map((st) => (
                    <button
                      key={st}
                      onClick={(e) => {
                        setMenuOpen(false);
                        onChangeStatus(st, e);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/60 text-[11px]"
                    >
                      <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[st].dot}`} />
                      <span>{st}</span>
                    </button>
                  ))}

                  <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Topic</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Short Description */}
        {topic.description && (
          <p className="mt-1.5 text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
            {topic.description}
          </p>
        )}

        {/* Tags */}
        {topic.tags && topic.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {topic.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${theme.tagColor}`}
              >
                #{tag}
              </span>
            ))}
            {topic.tags.length > 3 && (
              <span className="text-[10px] text-gray-500 font-semibold self-center">
                +{topic.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer: what is on this note, in words */}
      <div className="mt-3 space-y-1.5">
        <p className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
          <LinkIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />
          {topic.resources?.length || 0}{' '}
          {topic.resources?.length === 1 ? 'resource' : 'resources'}
        </p>

        <p className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
          <FileText className="h-3.5 w-3.5 shrink-0 opacity-70" />
          {topic.notes?.trim() ? 'Notes available' : 'No notes yet'}
          {topic.checklist?.length > 0 && (
            <span className="ml-auto font-mono text-[11px] opacity-70">
              {topic.checklist.filter((c) => c.completed).length}/
              {topic.checklist.length}
            </span>
          )}
        </p>

        <div className="flex items-center justify-between">
          {/* Status Badge */}
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`} />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
              {topic.status}
            </span>
          </div>

          <span className="text-[11px] text-gray-400">
            {formatRelativeTime(topic.updatedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
