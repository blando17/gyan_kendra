import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Search, Plus, Moon, Sun, Star, MoreVertical, ExternalLink, Edit2,
  Trash2, Copy, CheckCircle2, Clock, Calendar, Tag, Folder, Layers, StickyNote,
  RotateCcw, BarChart3, CheckSquare, Square, Link as LinkIcon, FileText, Code,
  Youtube, Github, Globe, HelpCircle, X, ArrowLeft, ChevronDown, Sparkles, Save,
  Check, AlertCircle, Bell, SlidersHorizontal, LayoutGrid, List, Pin, TrendingUp,
  BrainCircuit, CornerDownRight, Loader2, LogOut, Youtube as YoutubeIcon
} from 'lucide-react';

import { PASTEL_THEMES, CATEGORIES, STATUS_CONFIG } from '../constants';
import { formatRelativeTime, getResourceIcon } from '../utils/format';
import { topics as topicsApi } from '../api/endpoints';
import { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import useBoardData from '../hooks/useBoardData';
import StickyTopicCard from '../components/StickyTopicCard';
import CompactTopicRow from '../components/CompactTopicRow';
import TopicDetailWorkspace from '../components/TopicDetailWorkspace';
import TopicFormModal from '../components/TopicFormModal';
import QuickNotesDrawer from '../components/QuickNotesDrawer';
import GlobalSearchPalette from '../components/GlobalSearchPalette';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import EmptyState from '../components/EmptyState';
import TranscriptStudio from '../components/TranscriptStudio';

/**
 * The board shell: header, sidebar, and whichever view is active.
 *
 * The layout is the GyanKendra reference design; the state behind it comes
 * from the API rather than from arrays in memory.
 */
export default function Board() {
  const board = useBoardData();

  const { addToast } = useToast();

  const { darkMode, toggleDarkMode } = useTheme();

  const { user, logout } = useAuth();

  const { topics, quickNotes, collections, activities, stats, loading } = board;

  // Navigation and view modes
  const [currentView, setCurrentView] = useState('home');
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [selectedCollection, setSelectedCollection] = useState(null);

  // Filtering and search
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recently-updated');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [isGridView, setIsGridView] = useState(true);

  // Modals and panels
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [isQuickNotesOpen, setIsQuickNotesOpen] = useState(false);
  const [isSearchPaletteOpen, setIsSearchPaletteOpen] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(null);

  const [isAddingCollection, setIsAddingCollection] = useState(false);

  const [newCollectionName, setNewCollectionName] = useState('');

  const setDarkMode = toggleDarkMode;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchPaletteOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchPaletteOpen(false);
        setIsCreateModalOpen(false);
        setDeleteConfirmDialog(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCreateOrUpdateTopic = async (topicData) => {
    if (editingTopic) {
      const saved = await board.updateTopic(editingTopic._id, topicData);
      if (saved) addToast(`Updated topic "${saved.title}"`);
    } else {
      await board.createTopic(topicData);
    }

    setIsCreateModalOpen(false);
    setEditingTopic(null);
  };

  const handleDuplicateTopic = (topic) => board.duplicateTopic(topic);

  const handleDeleteTopic = async (id) => {
    const removed = await board.deleteTopic(id);
    if (removed && selectedTopicId === id) setSelectedTopicId(null);
    setDeleteConfirmDialog(null);
  };

  const handleToggleFavorite = (id, e) => {
    if (e) e.stopPropagation();
    const topic = topics.find((t) => t._id === id);
    if (topic) board.toggleFavorite(topic);
  };

  const handleChangeStatus = (id, newStatus, e) => {
    if (e) e.stopPropagation();
    const topic = topics.find((t) => t._id === id);
    if (topic) board.changeStatus(topic, newStatus);
  };

  const handleMarkAsReviewed = (id) => board.markReviewed(id);

  const handleAddQuickNote = (content, tags) => board.addQuickNote(content, tags);

  const handleDeleteQuickNote = (id) => board.deleteQuickNote(id);

  const handleConvertQuickNoteToTopic = (note) => board.convertQuickNote(note);

  // --- topic workspace actions, each on its own endpoint ------------------

  const applyTopic = useCallback((topic) => board.replaceTopic(topic), [board]);

  const saveNotes = useCallback(
    async (id, notes) => {
      try {
        await topicsApi.saveNotes(id, notes);
        return true;
      } catch (error) {
        addToast(errorMessage(error, 'Could not save your notes.'), 'error');
        return false;
      }
    },
    [addToast]
  );

  const addResource = useCallback(
    async (id, data) => {
      try {
        const res = await topicsApi.addResource(id, data);
        applyTopic(res.data.topic);
        addToast(`Added resource "${data.title}"`);
        return true;
      } catch (error) {
        addToast(errorMessage(error, 'Could not add the resource.'), 'error');
        return false;
      }
    },
    [applyTopic, addToast]
  );

  const removeResource = useCallback(
    async (id, resourceId) => {
      try {
        const res = await topicsApi.removeResource(id, resourceId);
        applyTopic(res.data.topic);
        addToast('Resource deleted', 'info');
      } catch (error) {
        addToast(errorMessage(error, 'Could not delete the resource.'), 'error');
      }
    },
    [applyTopic, addToast]
  );

  const addChecklistItem = useCallback(
    async (id, text) => {
      try {
        const res = await topicsApi.addChecklistItem(id, text);
        applyTopic(res.data.topic);
        return true;
      } catch (error) {
        addToast(errorMessage(error, 'Could not add the task.'), 'error');
        return false;
      }
    },
    [applyTopic, addToast]
  );

  const toggleChecklistItem = useCallback(
    async (id, item) => {
      try {
        const res = await topicsApi.updateChecklistItem(id, item._id, {
          completed: !item.completed
        });
        applyTopic(res.data.topic);
      } catch (error) {
        addToast(errorMessage(error, 'Could not update the task.'), 'error');
      }
    },
    [applyTopic, addToast]
  );

  const removeChecklistItem = useCallback(
    async (id, itemId) => {
      try {
        const res = await topicsApi.removeChecklistItem(id, itemId);
        applyTopic(res.data.topic);
      } catch (error) {
        addToast(errorMessage(error, 'Could not remove the task.'), 'error');
      }
    },
    [applyTopic, addToast]
  );

  // --- derived views -------------------------------------------------------

  const filteredTopics = useMemo(() => {
    return topics
      .filter((topic) => {
        if (selectedCategory !== 'All' && topic.category !== selectedCategory) {
          return false;
        }
        if (selectedCollection && !topic.collections?.includes(selectedCollection)) {
          return false;
        }
        if (favoritesOnly && !topic.isFavorite) {
          return false;
        }
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const inTitle = topic.title.toLowerCase().includes(query);
          const inDesc = topic.description?.toLowerCase().includes(query);
          const inTags = topic.tags?.some((tag) => tag.toLowerCase().includes(query));
          const inNotes = topic.notes?.toLowerCase().includes(query);
          const inResources = topic.resources?.some(
            (r) =>
              r.title.toLowerCase().includes(query) ||
              r.url.toLowerCase().includes(query)
          );
          if (!inTitle && !inDesc && !inTags && !inNotes && !inResources) {
            return false;
          }
        }
        if (currentView === 'revision') {
          const isDue = topic.nextReviewAt && new Date(topic.nextReviewAt) <= new Date();
          const needsRevision = topic.status === 'Needs Revision';
          if (!isDue && !needsRevision) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'recently-updated') return new Date(b.updatedAt) - new Date(a.updatedAt);
        if (sortBy === 'created') return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortBy === 'name') return a.title.localeCompare(b.title);
        if (sortBy === 'status') return a.status.localeCompare(b.status);
        return 0;
      });
  }, [topics, selectedCategory, selectedCollection, favoritesOnly, searchQuery, currentView, sortBy]);

  const activeTopic = useMemo(
    () => topics.find((t) => t._id === selectedTopicId) || null,
    [topics, selectedTopicId]
  );

  const submitCollection = async (event) => {
    event.preventDefault();

    const name = newCollectionName.trim();

    if (!name) return;

    const created = await board.createCollection({ name });

    if (created) {
      setNewCollectionName('');

      setIsAddingCollection(false);
    }
  };

  // Built-in categories plus anything this account has invented.
  const allCategories = useMemo(() => {
    const used = Array.from(new Set(topics.map((t) => t.category).filter(Boolean)));

    const extras = used.filter((name) => !CATEGORIES.includes(name)).sort();

    return [...CATEGORIES, ...extras];
  }, [topics]);

  // Sidebar badges.
  const categoryCounts = useMemo(() => {
    const counts = { All: topics.length };

    allCategories.forEach((category) => {
      if (category !== 'All') {
        counts[category] = topics.filter((t) => t.category === category).length;
      }
    });

    return counts;
  }, [topics, allCategories]);

  const collectionCounts = useMemo(() => {
    const counts = {};

    collections.forEach((collection) => {
      counts[collection.name] = topics.filter((t) =>
        t.collections?.includes(collection.name)
      ).length;
    });

    return counts;
  }, [collections, topics]);

  const collectionsList = useMemo(
    () => collections.map((collection) => collection.name),
    [collections]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] dark:bg-gray-950">
        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading your board...
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-950 text-gray-100' : 'bg-[#f8fafc] text-gray-900'} font-sans antialiased flex flex-col transition-colors duration-200`}>
      {/* Main Top Header */}
      <header className="sticky top-0 z-30 h-16 border-b border-gray-200 dark:border-gray-800/80 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            title="Back to the GyanKendra home page"
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-800 dark:from-white dark:via-purple-200 dark:to-indigo-300 bg-clip-text text-transparent">
                GyanKendra
              </span>
              <span className="hidden sm:inline-block ml-1.5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                PRO
              </span>
            </div>
          </Link>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-xl mx-2">
          <button
            onClick={() => setIsSearchPaletteOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-2 text-sm bg-gray-100 dark:bg-gray-800/70 hover:bg-gray-200/70 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-xl border border-gray-200 dark:border-gray-700/60 transition-colors shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <span>Search topics, notes, resources, tags...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-mono font-medium rounded-md bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 shadow-xs">
              ⌘ K
            </kbd>
          </button>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsQuickNotesOpen(true)}
            title="Quick Notes Scratchpad"
            className="p-2 sm:px-3 sm:py-2 text-sm font-medium rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-1.5 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
          >
            <StickyNote className="w-4 h-4 text-amber-500" />
            <span className="hidden md:inline">Quick Note</span>
            {quickNotes.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
                {quickNotes.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setDarkMode(!darkMode)}
            title="Toggle theme"
            className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700/70 transition-colors"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          <button
            onClick={() => {
              setEditingTopic(null);
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">New Topic</span>
          </button>

          {/* User Profile Avatar */}
          <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-800">
            <div
              title={user?.email}
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-sm"
            >
              {(user?.username || '?').charAt(0).toUpperCase()}
            </div>
            <span className="hidden xl:inline text-xs font-semibold text-gray-700 dark:text-gray-300">
              {user?.username}
            </span>
            <button
              onClick={logout}
              title="Sign out"
              className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Two-Column Layout */}
      <div className="flex-1 flex max-w-[1720px] w-full mx-auto">
        {/* Left Navigation Sidebar */}
        <aside className="w-64 border-r border-gray-200 dark:border-gray-800/80 bg-white/50 dark:bg-gray-900/50 p-4 hidden lg:flex flex-col gap-6 shrink-0 backdrop-blur-sm">
          {/* Main Navigation links */}
          <nav className="space-y-1">
            <button
              onClick={() => {
                setSelectedTopicId(null);
                setCurrentView('home');
                setSelectedCollection(null);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                currentView === 'home' && !selectedCollection
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Board Overview</span>
            </button>

            <button
              onClick={() => {
                setSelectedTopicId(null);
                setCurrentView('revision');
                setSelectedCollection(null);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                currentView === 'revision'
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-semibold shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <RotateCcw className="w-4 h-4" />
                <span>Revision Tracker</span>
              </div>
              {stats.needsRevision > 0 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-rose-500 text-white font-bold">
                  {stats.needsRevision}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsQuickNotesOpen(true)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-all"
            >
              <div className="flex items-center gap-3">
                <StickyNote className="w-4 h-4" />
                <span>Quick Notes</span>
              </div>
              <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-md text-gray-500">
                {quickNotes.length}
              </span>
            </button>

            <button
              onClick={() => {
                setSelectedTopicId(null);
                setCurrentView('transcripts');
                setSelectedCollection(null);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                currentView === 'transcripts'
                  ? 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 font-semibold shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60'
              }`}
            >
              <YoutubeIcon className="w-4 h-4" />
              <span>Transcripts</span>
            </button>

            <button
              onClick={() => {
                setSelectedTopicId(null);
                setCurrentView('analytics');
                setSelectedCollection(null);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                currentView === 'analytics'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Learning Analytics</span>
            </button>
          </nav>

          {/* Categories Sidebar Section */}
          <div>
            <div className="px-3 mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              <span>Categories</span>
            </div>
            <div className="space-y-0.5">
              {allCategories.filter((c) => c !== 'All').map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedTopicId(null);
                    setSelectedCategory(cat);
                    setCurrentView('home');
                    setSelectedCollection(null);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    selectedCategory === cat && !selectedCollection
                      ? 'bg-gray-200/70 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <span className="truncate">{cat}</span>
                  <span className="text-[11px] text-gray-400 font-mono">
                    {categoryCounts[cat] || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Collections Sidebar Section */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-3 mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              <span>Collections</span>
              <button
                type="button"
                onClick={() => setIsAddingCollection((value) => !value)}
                title="New collection"
                className="rounded-md px-1.5 text-sm font-normal text-indigo-500 transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-950/60"
              >
                {isAddingCollection ? '\u00d7' : '+'}
              </button>
            </div>

            {isAddingCollection && (
              <form onSubmit={submitCollection} className="mb-2 px-1">
                <input
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Collection name"
                  autoFocus
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </form>
            )}
            <div className="space-y-0.5">
              {collections.map((col) => (
                <button
                  key={col._id}
                  onClick={() => {
                    setSelectedTopicId(null);
                    setSelectedCollection(selectedCollection === col.name ? null : col.name);
                    setCurrentView('home');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    selectedCollection === col.name
                      ? 'bg-purple-100/70 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Folder
                      className="w-3.5 h-3.5 shrink-0"
                      style={{ color: col.color }}
                    />
                    <span className="truncate">{col.name}</span>
                  </div>
                  <span className="text-[11px] text-gray-400 font-mono">
                    {collectionCounts[col.name] || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-200/50 dark:border-indigo-900/30">
            <div className="flex items-center justify-between text-xs text-indigo-700 dark:text-indigo-300 font-semibold mb-1">
              <span>Learning Velocity</span>
              <span>{Math.round((stats.completed / (stats.total || 1)) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${(stats.completed / (stats.total || 1)) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
              {stats.completed} of {stats.total} topics mastered
            </p>
          </div>
        </aside>

        {/* Primary Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {selectedTopicId && activeTopic ? (
            /* Topic Workspace / Detail View */
            <TopicDetailWorkspace
              topic={activeTopic}
              onBack={() => setSelectedTopicId(null)}
              onUpdateTopic={(fields) => board.updateTopic(activeTopic._id, fields)}
              onSaveNotes={(notes) => saveNotes(activeTopic._id, notes)}
              onDeleteTopic={() => handleDeleteTopic(activeTopic._id)}
              onMarkReviewed={() => handleMarkAsReviewed(activeTopic._id)}
              onEditModal={() => {
                setEditingTopic(activeTopic);
                setIsCreateModalOpen(true);
              }}
              onAddResource={(data) => addResource(activeTopic._id, data)}
              onDeleteResource={(resourceId) => removeResource(activeTopic._id, resourceId)}
              onAddChecklistItem={(text) => addChecklistItem(activeTopic._id, text)}
              onToggleChecklistItem={(item) => toggleChecklistItem(activeTopic._id, item)}
              onDeleteChecklistItem={(itemId) => removeChecklistItem(activeTopic._id, itemId)}
              addToast={addToast}
            />
          ) : currentView === 'transcripts' ? (
            /* YouTube transcript generator: a parallel tool, not part of the board */
            <TranscriptStudio />
          ) : currentView === 'analytics' ? (
            /* Analytics View */
            <AnalyticsDashboard stats={stats} topics={topics} activities={activities} />
          ) : (
            /* Sticky Notes Dashboard / Board */
            <div className="space-y-6">
              {/* Dashboard Greeting Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">👋</span>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                      Good day, {user?.username?.split(' ')[0] || 'there'}
                    </h1>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Your Knowledge Board — Organize what you learn. Build what you know. 🚀
                  </p>
                </div>

                {selectedCollection && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 text-xs font-semibold self-start md:self-auto border border-purple-200 dark:border-purple-800">
                    <Folder className="w-3.5 h-3.5" />
                    <span>Viewing collection: <strong>{selectedCollection}</strong></span>
                    <button
                      onClick={() => setSelectedCollection(null)}
                      className="ml-1 hover:text-purple-900 dark:hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Statistics Row Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Total Topics</div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{stats.learning}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Learning</div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{stats.completed}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{stats.needsRevision}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Need Revision</div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs flex items-center gap-3.5 col-span-2 sm:col-span-1">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <LinkIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalResources}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Total Resources</div>
                  </div>
                </div>
              </div>

              {/* Category Pills & Filters Toolbar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-200 dark:border-gray-800">
                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {allCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setSelectedCollection(null);
                      }}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                        selectedCategory === cat && !selectedCollection
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Right Controls: Sort, Favorites, Layout */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Favorites Only Switch */}
                  <button
                    onClick={() => setFavoritesOnly(!favoritesOnly)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${
                      favoritesOnly
                        ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${favoritesOnly ? 'fill-amber-400 text-amber-500' : ''}`} />
                    <span>Favorites</span>
                  </button>

                  {/* Sort Dropdown */}
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="text-xs font-medium pl-3 pr-8 py-1.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="recently-updated">Sort: Recently Updated</option>
                      <option value="created">Sort: Created Date</option>
                      <option value="name">Sort: Name (A-Z)</option>
                      <option value="status">Sort: Status</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Grid / List switch */}
                  <div className="flex items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-0.5">
                    <button
                      onClick={() => setIsGridView(true)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isGridView
                          ? 'bg-gray-100 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                      title="Sticky Grid View"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setIsGridView(false)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        !isGridView
                          ? 'bg-gray-100 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                      title="Compact List View"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Topics Grid / List */}
              {filteredTopics.length === 0 ? (
                <EmptyState
                  searchQuery={searchQuery}
                  view={currentView}
                  onReset={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    setSelectedCollection(null);
                    setFavoritesOnly(false);
                  }}
                  onCreate={() => {
                    setEditingTopic(null);
                    setIsCreateModalOpen(true);
                  }}
                />
              ) : isGridView ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filteredTopics.map((topic, index) => (
                    <StickyTopicCard
                      key={topic._id}
                      topic={topic}
                      index={index}
                      onOpen={() => setSelectedTopicId(topic._id)}
                      onToggleFavorite={(e) => handleToggleFavorite(topic._id, e)}
                      onDuplicate={() => handleDuplicateTopic(topic)}
                      onEdit={() => {
                        setEditingTopic(topic);
                        setIsCreateModalOpen(true);
                      }}
                      onDelete={() => setDeleteConfirmDialog(topic)}
                      onChangeStatus={(status, e) => handleChangeStatus(topic._id, status, e)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredTopics.map((topic) => (
                    <CompactTopicRow
                      key={topic._id}
                      topic={topic}
                      onOpen={() => setSelectedTopicId(topic._id)}
                      onToggleFavorite={(e) => handleToggleFavorite(topic._id, e)}
                      onDelete={() => setDeleteConfirmDialog(topic)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {}
      {isCreateModalOpen && (
        <TopicFormModal
          isOpen={isCreateModalOpen}
          initialTopic={editingTopic}
          categories={CATEGORIES.filter((c) => c !== 'All')}
          collectionsList={collections.map((c) => c.name)}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingTopic(null);
          }}
          onSave={handleCreateOrUpdateTopic}
        />
      )}

      {}
      {isQuickNotesOpen && (
        <QuickNotesDrawer
          isOpen={isQuickNotesOpen}
          quickNotes={quickNotes}
          onClose={() => setIsQuickNotesOpen(false)}
          onAddQuickNote={handleAddQuickNote}
          onDeleteQuickNote={handleDeleteQuickNote}
          onConvertToTopic={handleConvertQuickNoteToTopic}
        />
      )}

      {}
      {isSearchPaletteOpen && (
        <GlobalSearchPalette
          isOpen={isSearchPaletteOpen}
          topics={topics}
          onClose={() => setIsSearchPaletteOpen(false)}
          onSelectTopic={(topicId) => {
            setSelectedTopicId(topicId);
            setIsSearchPaletteOpen(false);
          }}
        />
      )}

      {}
      {deleteConfirmDialog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Delete "{deleteConfirmDialog.title}"?
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Are you sure you want to delete this topic? All personal notes, resource links, and checklists inside it will be permanently removed.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmDialog(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTopic(deleteConfirmDialog._id)}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm shadow-rose-600/30"
              >
                Delete Topic
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
