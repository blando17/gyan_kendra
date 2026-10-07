import React, { useState } from 'react';
import { X } from 'lucide-react';

// Mirrors the detection the server does, purely so the form can preview it.
function detectType(url = '') {
  const value = url.toLowerCase();

  if (/youtube\.com|youtu\.be/.test(value)) return 'YouTube';
  if (/github\.com/.test(value)) return 'GitHub';
  if (/leetcode\.com|codeforces\.com|hackerrank\.com|codechef\.com/.test(value)) return 'Problem';
  if (/\.pdf($|\?)/.test(value)) return 'PDF';
  if (/docs\.|developer\.|\/docs|mdn|readthedocs/.test(value)) return 'Documentation';

  return 'Article';
}

export default function AddResourceModal({ isOpen, onClose, onAdd }) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a resource title');
      return;
    }
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }
    try {
      new URL(url);
    } catch (_) {
      setError('Please enter a valid URL including http:// or https://');
      return;
    }

    // An empty type means "work it out from the link".
    onAdd({
      title: title.trim(),
      url: url.trim(),
      ...(type ? { type } : {})
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Add External Resource
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Resource Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Official Documentation, Video Tutorial..."
              className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              URL
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Resource Type
              {!type && url.trim() && (
                <span className="ml-1.5 font-normal normal-case text-indigo-500">
                  will be saved as {detectType(url)}
                </span>
              )}
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Detect from link</option>
              <option value="Article">Article</option>
              <option value="YouTube">YouTube</option>
              <option value="Documentation">Documentation</option>
              <option value="GitHub">GitHub</option>
              <option value="Problem">Problem / Practice</option>
              <option value="PDF">PDF</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
            >
              Add Resource
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
