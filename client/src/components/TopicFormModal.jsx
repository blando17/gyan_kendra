import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { PASTEL_THEMES, STATUS_CONFIG } from '../constants';

// Sentinel value for the "create one" row in the select.
const NEW_CATEGORY = '__new__';

export default function TopicFormModal({ isOpen, initialTopic, categories, collectionsList, onClose, onSave }) {
  const [title, setTitle] = useState(initialTopic?.title || '');
  const [description, setDescription] = useState(initialTopic?.description || '');
  const [category, setCategory] = useState(initialTopic?.category || 'DSA / CP');
  const [tagsInput, setTagsInput] = useState(initialTopic?.tags?.join(', ') || '');
  const [status, setStatus] = useState(initialTopic?.status || 'To Learn');
  const [themeId, setThemeId] = useState(initialTopic?.themeId || 'yellow');
  const [selectedCollections, setSelectedCollections] = useState(initialTopic?.collections || []);
  const [notes, setNotes] = useState(initialTopic?.notes || '');

  // Categories the user has invented, kept alongside the built-in list.
  const [extraCategories, setExtraCategories] = useState([]);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const allCategories = React.useMemo(() => {
    const base = categories.filter((c) => c !== 'All');
    const extras = extraCategories.filter((c) => !base.includes(c));
    // An existing topic may already carry a category not in either list.
    const current = category && ![...base, ...extras].includes(category) ? [category] : [];
    return [...base, ...extras, ...current];
  }, [categories, extraCategories, category]);

  const confirmNewCategory = () => {
    const name = newCategory.trim();
    if (!name) return;
    setExtraCategories((list) => (list.includes(name) ? list : [...list, name]));
    setCategory(name);
    setNewCategory('');
    setAddingCategory(false);
  };

  const cancelNewCategory = () => {
    setNewCategory('');
    setAddingCategory(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    onSave({
      title: title.trim(),
      description: description.trim(),
      category,
      tags: parsedTags,
      status,
      themeId,
      collections: selectedCollections,
      notes: notes || initialTopic?.notes || '',
      checklist: initialTopic?.checklist || [
        { id: 'chk-init-1', text: `Understand fundamentals of ${title.trim()}`, completed: false }
      ],
      resources: initialTopic?.resources || []
    });
  };

  const toggleCollection = (colName) => {
    if (selectedCollections.includes(colName)) {
      setSelectedCollections(selectedCollections.filter((c) => c !== colName));
    } else {
      setSelectedCollections([...selectedCollections, colName]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-gray-200 dark:border-gray-800 my-8 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {initialTopic ? 'Edit Topic Card' : 'Create New Topic Sticky'}
            </h2>
            <p className="text-xs text-gray-500">
              {initialTopic ? 'Refine your topic details and references' : 'Add a new subject to your digital learning board'}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Topic Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Binary Search, React Hooks, Redux Toolkit..."
              className="w-full text-sm font-medium px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Short Description / Overview
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of what this topic covers..."
              className="w-full text-xs px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              {addingCategory ? (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        confirmNewCategory();
                      }
                      if (e.key === 'Escape') {
                        e.preventDefault();
                        cancelNewCategory();
                      }
                    }}
                    maxLength={40}
                    placeholder="e.g. Databases"
                    className="flex-1 min-w-0 text-xs px-3.5 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-indigo-300 dark:border-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={confirmNewCategory}
                    className="px-3 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={cancelNewCategory}
                    className="px-3 rounded-xl text-xs font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <select
                  value={category}
                  onChange={(e) => {
                    // The last option opens an input instead of being a value.
                    if (e.target.value === NEW_CATEGORY) {
                      setAddingCategory(true);
                      return;
                    }
                    setCategory(e.target.value);
                  }}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {allCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option disabled>──────────</option>
                  <option value={NEW_CATEGORY}>+ New category...</option>
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {Object.keys(STATUS_CONFIG).map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="DSA, Searching, LeetCode"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Sticky Pastel Color Choice */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Sticky Note Color
            </label>
            <div className="flex items-center gap-2.5 flex-wrap">
              {PASTEL_THEMES.map((th) => (
                <button
                  type="button"
                  key={th.id}
                  onClick={() => setThemeId(th.id)}
                  className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center border-2 ${
                    themeId === th.id ? 'scale-110 border-indigo-600 shadow-sm' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: th.pinColor }}
                  title={th.name}
                >
                  {themeId === th.id && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Collections assignment */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Add to Collections
            </label>
            <div className="flex flex-wrap gap-1.5">
              {collectionsList.map((colName) => {
                const isSelected = selectedCollections.includes(colName);
                return (
                  <button
                    type="button"
                    key={colName}
                    onClick={() => toggleCollection(colName)}
                    className={`text-xs px-2.5 py-1 rounded-xl border transition-colors ${
                      isSelected
                        ? 'bg-purple-100 dark:bg-purple-950/80 border-purple-400 text-purple-800 dark:text-purple-300 font-semibold'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {colName}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm shadow-indigo-600/30"
            >
              {initialTopic ? 'Save Changes' : 'Create Topic'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
