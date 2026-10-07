import React from 'react';
import { formatRelativeTime } from '../utils/format';
import { Clock } from 'lucide-react';

export default function AnalyticsDashboard({ stats, topics, activities }) {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Learning Analytics & Progress
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Detailed metrics of your learning journey and recent activity on GyanKendra.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-2">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Completion Rate</div>
          <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
            {Math.round((stats.completed / (stats.total || 1)) * 100)}%
          </div>
          <p className="text-xs text-gray-500">
            {stats.completed} of {stats.total} topics fully completed.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-2">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Topics Added This Week</div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.topicsThisWeek}
          </div>
          <p className="text-xs text-gray-500">Consistent learning cadence maintained.</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-2">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Learning Flow</div>
          <div className="text-3xl font-black text-amber-500">
            {stats.learning}
          </div>
          <p className="text-xs text-gray-500">Topics currently in progress.</p>
        </div>
      </div>

      {/* Activity History Feed */}
      <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-500" />
          <span>Recent Activity Log</span>
        </h3>

        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {activities.map((act) => (
            <div key={act._id} className="py-3 flex items-center justify-between text-xs">
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {act.text}
              </span>
              <span className="text-gray-400 font-mono text-[11px]">
                {formatRelativeTime(act.createdAt)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
