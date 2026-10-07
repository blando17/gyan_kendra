import React, { useState } from 'react';
import { Sparkles, StickyNote, Trash2, X } from 'lucide-react';
import { formatRelativeTime } from '../utils/format';

export default function QuickNotesDrawer({ isOpen, quickNotes, onClose, onAddQuickNote, onDeleteQuickNote, onConvertToTopic }) {
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);
    onAddQuickNote(content.trim(), tags);
    setContent('');
    setTagsInput('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 h-full p-6 shadow-2xl border-l border-gray-200 dark:border-gray-800 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <StickyNote className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Quick Notes Scratchpad</h2>
            </div>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 my-3">
            Quickly capture fleeting concepts, thoughts, or algorithms. You can convert any note into a full GyanKendra topic at any time!
          </p>

          {/* Quick Note Add Form */}
          <form onSubmit={handleAdd} className="space-y-2 mb-6">
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="e.g. Need to understand MongoDB aggregation pipeline with $facet..."
              className="w-full text-xs p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Tags (e.g. MongoDB, Pipeline)"
                className="flex-1 text-xs px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shrink-0 shadow-xs"
              >
                Save Note
              </button>
            </div>
          </form>

          {/* List of Quick Notes */}
          <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-320px)] pr-1">
            {quickNotes.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400 italic">
                No temporary notes right now. Use the input above to jot down quick learning reminders!
              </div>
            ) : (
              quickNotes.map((qn) => (
                <div
                  key={qn._id}
                  className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 space-y-2"
                >
                  <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed font-sans">
                    {qn.content}
                  </p>
                  <div className="flex items-center justify-between pt-1 text-[11px] text-gray-400">
                    <span>{formatRelativeTime(qn.createdAt)}</span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onConvertToTopic(qn)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-200/60 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-semibold hover:bg-amber-300/80 transition-colors"
                        title="Convert into sticky topic"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>To Topic</span>
                      </button>
                      <button
                        onClick={() => onDeleteQuickNote(qn._id)}
                        className="p-1 text-gray-400 hover:text-rose-500 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 text-xs font-semibold rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          Close Drawer
        </button>
      </div>
    </div>
  );
}
