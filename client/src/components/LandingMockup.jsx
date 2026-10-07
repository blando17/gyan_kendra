import React from "react";
import { Home, Layers, StickyNote, Clock, Search, Link2, FileText, Star } from "lucide-react";

// The sticky cards shown inside the hero illustration. Static on purpose:
// this is a picture of the product, not the product.
const CARDS = [
  {
    title: "Binary Search",
    tags: ["DSA", "Algorithms"],
    resources: 3,
    pin: "bg-amber-400",
    card: "bg-amber-100/90 border-amber-200",
    tag: "bg-amber-200/70 text-amber-900",
    starred: true,
  },
  {
    title: "React Hooks",
    tags: ["Development", "React"],
    resources: 5,
    pin: "bg-rose-400",
    card: "bg-rose-100/90 border-rose-200",
    tag: "bg-rose-200/70 text-rose-900",
  },
  {
    title: "OS Process",
    tags: ["Theory", "Operating Systems"],
    resources: 2,
    pin: "bg-sky-400",
    card: "bg-sky-100/90 border-sky-200",
    tag: "bg-sky-200/70 text-sky-900",
  },
  {
    title: "Machine Learning",
    tags: ["ML", "AI"],
    resources: 4,
    pin: "bg-emerald-400",
    card: "bg-emerald-100/90 border-emerald-200",
    tag: "bg-emerald-200/70 text-emerald-900",
  },
];

const NAV = [
  { icon: Home, label: "Home", active: true },
  { icon: Layers, label: "All Topics" },
  { icon: StickyNote, label: "Quick Notes" },
  { icon: Clock, label: "Revision" },
];

// A hand-drawn style label with a small curving arrow pointing at the window.
// `arrow` is authored per position so each one actually aims somewhere useful.
function Annotation({ text, className, arrow }) {
  return (
    <div
      className={`pointer-events-none absolute hidden items-center gap-1 xl:flex ${className}`}
      aria-hidden="true"
    >
      {arrow === "left" && <Curve className="-scale-x-100" />}

      <span className="whitespace-nowrap font-hand text-lg text-gray-400 dark:text-gray-500">
        {text}
      </span>

      {arrow === "right" && <Curve />}
    </div>
  );
}

// A short arc with an arrowhead on the end, drawn in one path set.
function Curve({ className = "" }) {
  return (
    <svg
      viewBox="0 0 40 34"
      className={`h-8 w-9 shrink-0 text-gray-300 dark:text-gray-700 ${className}`}
      fill="none"
    >
      <path
        d="M2 4C14 4 28 10 33 26"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M27 23l6.3 4 1.2-7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function LandingMockup() {
  return (
    <div className="relative px-0 pb-12 pt-12 xl:px-10">
      {/* Soft colour wash behind the window */}
      <div
        aria-hidden="true"
        className="absolute -right-10 top-10 h-64 w-64 rounded-full bg-indigo-200/40 blur-3xl dark:bg-indigo-900/20"
      />
      <div
        aria-hidden="true"
        className="absolute -left-6 bottom-6 h-52 w-52 rounded-full bg-amber-200/40 blur-3xl dark:bg-amber-900/20"
      />

      <Annotation
        text="Organize Topics"
        arrow="right"
        className="left-0 top-0 -rotate-6"
      />

      <Annotation
        text="Save Resources"
        arrow="left"
        className="right-0 top-1 rotate-3"
      />

      <Annotation
        text="Write Notes"
        arrow="right"
        className="bottom-0 left-2 -rotate-3 [&>svg]:-scale-y-100"
      />

      <Annotation
        text="Track Progress"
        arrow="left"
        className="bottom-1 right-0 rotate-2 [&>svg]:-scale-y-100"
      />

      {/* The app window */}
      <div className="relative rotate-1 overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-2xl shadow-indigo-500/10 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <span className="h-3 w-3 rounded-full bg-rose-400" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />

          <div className="ml-4 flex flex-1 items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 dark:bg-gray-800">
            <Search className="h-3.5 w-3.5 text-gray-400" />

            <span className="text-xs text-gray-400">
              Search topics, notes, resources...
            </span>
          </div>
        </div>

        <div className="flex">
          <aside className="hidden w-44 shrink-0 border-r border-gray-100 p-3 sm:block dark:border-gray-800">
            <div className="mb-4 flex items-center gap-2 px-1">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 text-[10px] font-bold text-white">
                K
              </span>

              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                GyanKendra
              </span>
            </div>

            {NAV.map(({ icon: Icon, label, active }) => (
              <div
                key={label}
                className={`mb-1 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium ${
                  active
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </div>
            ))}
          </aside>

          <div className="grid flex-1 grid-cols-2 gap-3 p-4">
            {CARDS.map((card) => (
              <div
                key={card.title}
                className={`relative rounded-xl border p-3 shadow-sm ${card.card}`}
              >
                <span
                  className={`absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full ${card.pin} shadow`}
                />

                <Star
                  className={`absolute right-2 top-2 h-3.5 w-3.5 ${
                    card.starred
                      ? "fill-amber-400 text-amber-500"
                      : "text-gray-400/70"
                  }`}
                />

                <p className="mb-2 pr-5 text-sm font-bold text-gray-900">
                  {card.title}
                </p>

                <div className="mb-2 flex flex-wrap gap-1">
                  {card.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${card.tag}`}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <p className="flex items-center gap-1.5 text-[11px] text-gray-600">
                  <Link2 className="h-3 w-3" />
                  {card.resources} resources
                </p>

                <p className="mt-1 flex items-center gap-1.5 text-[11px] text-gray-600">
                  <FileText className="h-3 w-3" />
                  Notes available
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
