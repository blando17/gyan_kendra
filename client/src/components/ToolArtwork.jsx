import React from "react";
import { Play, FileText } from "lucide-react";

/**
 * The two illustrations either side of the transcript tool: a video player on
 * the left, the notes it becomes on the right. Both are drawn with markup
 * rather than images so they theme and scale with the page.
 */

const skeleton = (width, tone = "bg-gray-200 dark:bg-gray-700") => (
  <span className={`block h-2 rounded-full ${tone}`} style={{ width }} />
);

export function VideoCard({ className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`w-60 -rotate-6 rounded-2xl border border-gray-100 bg-white p-3 shadow-xl shadow-violet-500/10 dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      {/* the player */}
      <div className="relative overflow-hidden rounded-xl bg-gray-900 p-4">
        <span className="absolute left-3 top-3 flex h-6 w-8 items-center justify-center rounded bg-red-600">
          <Play className="h-3 w-3 fill-white text-white" />
        </span>

        {/* faint geometry doodles, as on a lecture slide */}
        <svg viewBox="0 0 160 70" className="mt-6 w-full stroke-gray-600" fill="none">
          <path d="M18 56L34 26l16 30z" strokeWidth="1.5" />
          <circle cx="86" cy="42" r="15" strokeWidth="1.5" />
          <path d="M116 28h28v28h-28z" strokeWidth="1.5" />
          <path d="M60 14h40M64 66h34" strokeWidth="1.5" strokeLinecap="round" />
        </svg>

        <span className="mt-3 block h-1 w-full rounded-full bg-gray-700">
          <span className="block h-1 w-1/3 rounded-full bg-red-500" />
        </span>
      </div>

      <div className="space-y-2 p-2 pt-3">
        {skeleton("85%")}
        {skeleton("60%")}
      </div>
    </div>
  );
}

export function NotesCard({ className = "" }) {
  const rows = [
    { dot: "bg-violet-400", width: "88%" },
    { dot: "bg-rose-400", width: "72%" },
    { dot: "bg-amber-400", width: "80%" },
    { dot: "bg-emerald-400", width: "64%" },
  ];

  return (
    <div
      aria-hidden="true"
      className={`w-56 rotate-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl shadow-violet-500/10 dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950/60">
          <FileText className="h-4 w-4 text-violet-600 dark:text-violet-300" />
        </span>

        <span className="font-hand text-lg text-gray-800 dark:text-gray-100">
          Structured Notes
        </span>
      </div>

      <div className="space-y-3">
        {rows.map((row, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className={`h-2 w-2 shrink-0 rounded-full ${row.dot}`} />

            <span
              className="block h-2 rounded-full bg-gray-200 dark:bg-gray-700"
              style={{ width: row.width }}
            />
          </div>
        ))}

        <div className="space-y-2 pt-1">
          {skeleton("92%")}
          {skeleton("78%")}
          {skeleton("85%")}
        </div>
      </div>
    </div>
  );
}
