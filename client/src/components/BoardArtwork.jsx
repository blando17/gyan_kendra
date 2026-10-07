import React from "react";

// A miniature of the board, used beside the "built for people who keep
// learning" copy. Drawn in markup so it themes with the page.
const CARDS = [
  "bg-violet-200/80 dark:bg-violet-900/50",
  "bg-amber-200/80 dark:bg-amber-900/50",
  "bg-emerald-200/80 dark:bg-emerald-900/50",
  "bg-sky-200/80 dark:bg-sky-900/50",
  "bg-rose-200/80 dark:bg-rose-900/50",
  "bg-indigo-200/80 dark:bg-indigo-900/50",
];

export default function BoardArtwork({ className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-3xl border border-gray-100 bg-white p-4 shadow-xl shadow-violet-500/10 dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />

        <span className="ml-3 h-2 flex-1 rounded-full bg-gray-100 dark:bg-gray-800" />
      </div>

      <div className="flex gap-3">
        <div className="hidden w-16 shrink-0 space-y-2 sm:block">
          {[0, 1, 2, 3].map((row) => (
            <span
              key={row}
              className={`block h-2 rounded-full ${
                row === 0
                  ? "bg-violet-300 dark:bg-violet-700"
                  : "bg-gray-150 bg-gray-100 dark:bg-gray-800"
              }`}
              style={{ width: `${90 - row * 12}%` }}
            />
          ))}
        </div>

        <div className="grid flex-1 grid-cols-3 gap-2.5">
          {CARDS.map((tone, index) => (
            <span
              key={index}
              className={`block rounded-xl ${tone}`}
              style={{ height: index % 2 === 0 ? 46 : 54 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
