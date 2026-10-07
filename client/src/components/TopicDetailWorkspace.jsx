import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Bold, Check, CheckSquare, Clock, Code, Edit2, ExternalLink, Italic, Plus, RotateCcw, Square, Star, Trash2, X } from 'lucide-react';
import { STATUS_CONFIG } from '../constants';
import { formatRelativeTime, getResourceIcon } from '../utils/format';
import { MarkdownPreview } from '../utils/markdown';
import AddResourceModal from './AddResourceModal';

export default function TopicDetailWorkspace({
  topic,
  onBack,
  onUpdateTopic,
  onSaveNotes,
  onDeleteTopic,
  onMarkReviewed,
  onEditModal,
  onAddResource,
  onDeleteResource,
  onAddChecklistItem,
  onToggleChecklistItem,
  onDeleteChecklistItem,
  addToast
}) {
  const [activeNotesTab, setActiveNotesTab] = useState('write'); // 'write' or 'preview'
  const [notesContent, setNotesContent] = useState(topic.notes || '');
  const [isNotesSaved, setIsNotesSaved] = useState(true);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [isAddResourceModalOpen, setIsAddResourceModalOpen] = useState(false);

  // Auto-save notes with debounce
  useEffect(() => {
    if (notesContent === (topic.notes || '')) return;

    setIsNotesSaved(false);
    const timeout = setTimeout(async () => {
      const ok = await onSaveNotes(notesContent);
      setIsNotesSaved(ok);
    }, 900);

    return () => clearTimeout(timeout);
  }, [notesContent, topic.notes, onSaveNotes]);

  // Insert markdown shortcuts into notes editor
  const textareaRef = useRef(null);
  const insertMarkdown = (syntaxPrefix, syntaxSuffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = notesContent.substring(start, end) || 'text';
    const replacement = `${syntaxPrefix}${selectedText}${syntaxSuffix}`;

    const newContent = notesContent.substring(0, start) + replacement + notesContent.substring(end);
    setNotesContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + syntaxPrefix.length, start + syntaxPrefix.length + selectedText.length);
    }, 0);
  };

  // Checklist management
  const handleToggleChecklist = (item) => {
    onToggleChecklistItem(item);
  };

  const handleAddChecklistItem = async (e) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;

    const ok = await onAddChecklistItem(newChecklistText.trim());
    if (ok) setNewChecklistText('');
  };

  const handleDeleteChecklistItem = (itemId) => {
    onDeleteChecklistItem(itemId);
  };

  // Resource management
  const handleAddResource = async (resourceData) => {
    const ok = await onAddResource(resourceData);
    if (ok) setIsAddResourceModalOpen(false);
    return ok;
  };

  const handleDeleteResource = (resId) => {
    onDeleteResource(resId);
  };

  const statusCfg = STATUS_CONFIG[topic.status] || STATUS_CONFIG['Learning'];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Detail Top Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Topics</span>
          </button>

          <span className="text-xs px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold">
            {topic.category}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Spaced Repetition Review Trigger */}
          <button
            onClick={onMarkReviewed}
            title="Mark as reviewed today"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/60 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Mark Reviewed</span>
          </button>

          <button
            onClick={onEditModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors shadow-xs"
          >
            <Edit2 className="w-3.5 h-3.5 text-blue-500" />
            <span>Edit</span>
          </button>

          <button
            onClick={() => onUpdateTopic({ isFavorite: !topic.isFavorite })}
            className="p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shadow-xs text-gray-400 hover:text-amber-500"
          >
            <Star className={`w-4 h-4 ${topic.isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Title & Status bar */}
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-black text-gray-950 dark:text-white tracking-tight">
          {topic.title}
        </h1>

        {topic.description && (
          <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed">
            {topic.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          {/* Status selector */}
          <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-3 py-1.5 rounded-xl shadow-xs">
            <span className={`w-2.5 h-2.5 rounded-full ${statusCfg.dot}`} />
            <select
              value={topic.status}
              onChange={(e) => onUpdateTopic({ status: e.target.value })}
              className="text-xs font-bold bg-transparent text-gray-800 dark:text-gray-200 focus:outline-none cursor-pointer"
            >
              {Object.keys(STATUS_CONFIG).map((st) => (
                <option key={st} value={st} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-1.5">
            {topic.tags?.map((t, idx) => (
              <span
                key={idx}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                #{t}
              </span>
            ))}
          </div>

          {/* Revision Timing Info */}
          <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5 ml-auto">
            <Clock className="w-3.5 h-3.5" />
            <span>Updated {formatRelativeTime(topic.updatedAt)}</span>
          </div>
        </div>
      </div>

      {/* Two Column Grid for Resources & Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Resources and Checklist (1 col) */}
        <div className="space-y-6 lg:col-span-1">
          {/* Resources Section */}
          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Resources ({topic.resources?.length || 0})
                </h3>
              </div>
              <button
                onClick={() => setIsAddResourceModalOpen(true)}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Resource</span>
              </button>
            </div>

            {/* Resources List */}
            {(!topic.resources || topic.resources.length === 0) ? (
              <div className="py-6 text-center text-xs text-gray-400 italic">
                No external links or tutorials added yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {topic.resources.map((res) => (
                  <div
                    key={res._id}
                    className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/70 dark:border-gray-700/60 flex items-center justify-between gap-3 group hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-lg bg-white dark:bg-gray-900 shrink-0 shadow-2xs">
                        {getResourceIcon(res.type, res.url)}
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                          {res.title}
                        </h5>
                        <p className="text-[11px] text-gray-400 truncate">
                          {res.url.replace(/^https?:\/\//, '')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        title="Open in new tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => handleDeleteResource(res._id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Checklist Section */}
          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Quick Checklist
              </h3>
              {topic.checklist && topic.checklist.length > 0 && (
                <span className="text-xs font-mono text-gray-400">
                  {topic.checklist.filter((i) => i.completed).length}/{topic.checklist.length}
                </span>
              )}
            </div>

            {/* Checklist Items */}
            <div className="space-y-2">
              {topic.checklist?.map((item) => (
                <div
                  key={item._id}
                  className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 group transition-colors"
                >
                  <button
                    onClick={() => handleToggleChecklist(item)}
                    className="mt-0.5 text-indigo-600 dark:text-indigo-400 shrink-0"
                  >
                    {item.completed ? (
                      <CheckSquare className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  <span
                    onClick={() => handleToggleChecklist(item)}
                    className={`text-xs cursor-pointer flex-1 leading-relaxed ${
                      item.completed
                        ? 'line-through text-gray-400 dark:text-gray-500'
                        : 'text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    {item.text}
                  </span>
                  <button
                    onClick={() => handleDeleteChecklistItem(item._id)}
                    className="text-gray-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Checklist Input */}
            <form onSubmit={handleAddChecklistItem} className="flex gap-2 pt-2">
              <input
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                placeholder="Add checklist step..."
                className="flex-1 text-xs px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shrink-0"
              >
                Add
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Large Markdown Notes Editor (2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col min-h-[500px]">
          {/* Notes Top Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
              <button
                onClick={() => setActiveNotesTab('write')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  activeNotesTab === 'write'
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                Write
              </button>
              <button
                onClick={() => setActiveNotesTab('preview')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  activeNotesTab === 'preview'
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                Preview
              </button>
            </div>

            {/* Markdown formatting controls */}
            {activeNotesTab === 'write' && (
              <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                <button
                  type="button"
                  onClick={() => insertMarkdown('**', '**')}
                  title="Bold"
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-bold"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('*', '*')}
                  title="Italic"
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-xs"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('# ')}
                  title="Heading 1"
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-bold"
                >
                  H1
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('## ')}
                  title="Heading 2"
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-bold"
                >
                  H2
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('- ')}
                  title="Bullet list"
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  •
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('```\n', '\n```')}
                  title="Code block"
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Code className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('`', '`')}
                  title="Inline code"
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-mono"
                >
                  `code`
                </button>
              </div>
            )}

            {/* Autosave status indicator */}
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              {isNotesSaved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved ✓ just now</span>
                </>
              ) : (
                <span className="text-amber-500 animate-pulse">Saving...</span>
              )}
            </div>
          </div>

          {/* Notes Content Body */}
          <div className="flex-1 mt-3 flex flex-col">
            {activeNotesTab === 'write' ? (
              <textarea
                ref={textareaRef}
                value={notesContent}
                onChange={(e) => setNotesContent(e.target.value)}
                placeholder="Write in Markdown: headings (#), bold (**), bullet lists (-), code blocks (```)..."
                className="w-full flex-1 min-h-[380px] p-3 text-sm text-gray-800 dark:text-gray-200 bg-transparent resize-y focus:outline-none font-mono leading-relaxed placeholder-gray-400"
              />
            ) : (
              <div className="p-3 flex-1 min-h-[380px] overflow-y-auto">
                <MarkdownPreview content={notesContent} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Resource Modal */}
      {isAddResourceModalOpen && (
        <AddResourceModal
          isOpen={isAddResourceModalOpen}
          onClose={() => setIsAddResourceModalOpen(false)}
          onAdd={handleAddResource}
        />
      )}
    </div>
  );
}
