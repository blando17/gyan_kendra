import React from 'react';
import { Code, FileText, Github, Globe, Youtube } from 'lucide-react';

export function formatRelativeTime(dateString) {
  if (!dateString) return 'Never';
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  const days = Math.floor(diffInSeconds / 86400);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getResourceIcon(type, url = '') {
  const lowerUrl = url.toLowerCase();
  const lowerType = (type || '').toLowerCase();

  if (lowerType === 'youtube' || lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
    return <Youtube className="w-4 h-4 text-red-500" />;
  }
  if (lowerType === 'github' || lowerUrl.includes('github.com')) {
    return <Github className="w-4 h-4 text-gray-800 dark:text-gray-200" />;
  }
  if (lowerType === 'problem' || lowerUrl.includes('leetcode.com') || lowerUrl.includes('hackerrank.com')) {
    return <Code className="w-4 h-4 text-amber-500" />;
  }
  if (lowerType === 'documentation') {
    return <FileText className="w-4 h-4 text-blue-500" />;
  }
  if (lowerType === 'pdf') {
    return <FileText className="w-4 h-4 text-rose-500" />;
  }
  return <Globe className="w-4 h-4 text-emerald-500" />;
}

