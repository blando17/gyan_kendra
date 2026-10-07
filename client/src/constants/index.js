// Design tokens lifted from the GyanKendra reference so the board keeps its
// sticky-note look. Shared by the cards, the form and the workspace.

const PASTEL_THEMES = [
  {
    id: 'yellow',
    name: 'Butter Yellow',
    lightBg: 'bg-amber-100/80 hover:bg-amber-100 border-amber-200',
    darkBg: 'dark:bg-amber-950/30 dark:hover:bg-amber-950/45 dark:border-amber-800/40',
    pinColor: '#f59e0b',
    headerAccent: 'text-amber-900 dark:text-amber-200',
    tagColor: 'bg-amber-100/90 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
  },
  {
    id: 'rose',
    name: 'Blush Rose',
    lightBg: 'bg-rose-100/80 hover:bg-rose-100 border-rose-200',
    darkBg: 'dark:bg-rose-950/30 dark:hover:bg-rose-950/45 dark:border-rose-800/40',
    pinColor: '#f43f5e',
    headerAccent: 'text-rose-900 dark:text-rose-200',
    tagColor: 'bg-rose-100/90 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300'
  },
  {
    id: 'blue',
    name: 'Sky Blue',
    lightBg: 'bg-sky-100/80 hover:bg-sky-100 border-sky-200',
    darkBg: 'dark:bg-sky-950/30 dark:hover:bg-sky-950/45 dark:border-sky-800/40',
    pinColor: '#0ea5e9',
    headerAccent: 'text-sky-900 dark:text-sky-200',
    tagColor: 'bg-sky-100/90 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300'
  },
  {
    id: 'emerald',
    name: 'Mint Emerald',
    lightBg: 'bg-emerald-100/80 hover:bg-emerald-100 border-emerald-200',
    darkBg: 'dark:bg-emerald-950/30 dark:hover:bg-emerald-950/45 dark:border-emerald-800/40',
    pinColor: '#10b981',
    headerAccent: 'text-emerald-900 dark:text-emerald-200',
    tagColor: 'bg-emerald-100/90 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
  },
  {
    id: 'purple',
    name: 'Soft Lavender',
    lightBg: 'bg-purple-100/80 hover:bg-purple-100 border-purple-200',
    darkBg: 'dark:bg-purple-950/30 dark:hover:bg-purple-950/45 dark:border-purple-800/40',
    pinColor: '#8b5cf6',
    headerAccent: 'text-purple-900 dark:text-purple-200',
    tagColor: 'bg-purple-100/90 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300'
  },
  {
    id: 'orange',
    name: 'Warm Peach',
    lightBg: 'bg-orange-100/80 hover:bg-orange-100 border-orange-200',
    darkBg: 'dark:bg-orange-950/30 dark:hover:bg-orange-950/45 dark:border-orange-800/40',
    pinColor: '#f97316',
    headerAccent: 'text-orange-900 dark:text-orange-200',
    tagColor: 'bg-orange-100/90 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300'
  }
];

const CATEGORIES = [
  'All',
  'DSA / CP',
  'Development',
  'Theory',
  'Machine Learning',
  'Research',
  'Others'
];

const STATUS_CONFIG = {
  'To Learn': {
    label: 'To Learn',
    dot: 'bg-sky-500',
    pill: 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300 border-sky-300/50 dark:border-sky-700/50'
  },
  'Learning': {
    label: 'Learning',
    dot: 'bg-amber-500',
    pill: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border-amber-300/50 dark:border-amber-700/50'
  },
  'Completed': {
    label: 'Completed',
    dot: 'bg-emerald-500',
    pill: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border-emerald-300/50 dark:border-emerald-700/50'
  },
  'Needs Revision': {
    label: 'Needs Revision',
    dot: 'bg-rose-500',
    pill: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300 border-rose-300/50 dark:border-rose-700/50'
  }
};

export { PASTEL_THEMES, CATEGORIES, STATUS_CONFIG };

export const RESOURCE_TYPES = [
  'Article',
  'YouTube',
  'Documentation',
  'GitHub',
  'Problem',
  'PDF',
  'Other'
];

export const getTheme = (themeId) =>
  PASTEL_THEMES.find((theme) => theme.id === themeId) || PASTEL_THEMES[0];
