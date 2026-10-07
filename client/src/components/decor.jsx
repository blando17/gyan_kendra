import React from "react";

/**
 * Decorative pieces for the marketing pages: hand-drawn underlines, curved
 * arrows, sparkle bursts, dotted grids and soft blobs.
 *
 * All of it is inline SVG so it scales, themes and costs nothing to load.
 * Everything here is presentational and hidden from assistive tech.
 */

// A hand-drawn swoosh under a highlighted word.
export function Underline({ className = "" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 12"
      preserveAspectRatio="none"
      className={`absolute -bottom-1 left-0 h-3 w-full text-violet-400/70 ${className}`}
    >
      <path
        d="M2 8.5C40 3.5 92 2.5 198 6"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

// Wraps a word in the underline. `as` keeps the heading semantics intact.
export function Marked({ children, className = "" }) {
  return (
    <span className={`relative inline-block ${className}`}>
      {children}
      <Underline />
    </span>
  );
}

// The curving arrows that point between elements.
export function CurvedArrow({ className = "", flip = false }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 80 60"
      fill="none"
      className={`text-violet-400 ${flip ? "-scale-x-100" : ""} ${className}`}
    >
      <path
        d="M4 8C34 6 62 18 70 46"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="0 0"
      />
      <path
        d="M60 40l10 8 2-12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Little three-stroke burst, as around the step icons.
export function Sparkle({ className = "", tone = "text-violet-400" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={`${tone} ${className}`}
    >
      <path d="M12 2v5M4 6l3 3M20 6l-3 3" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

// The faint dotted squares tucked into the corners.
export function DotGrid({ className = "", rows = 4, cols = 4 }) {
  const dots = [];

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      dots.push(<circle key={`${r}-${c}`} cx={4 + c * 12} cy={4 + r * 12} r="2" />);
    }
  }

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${cols * 12} ${rows * 12}`}
      className={`fill-violet-300/50 dark:fill-violet-700/30 ${className}`}
    >
      {dots}
    </svg>
  );
}

// Soft colour wash behind a section.
export function Blob({ className = "", tone = "bg-violet-300/30" }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute rounded-full blur-3xl ${tone} ${className}`}
    />
  );
}

// A small floating chip holding an icon, as scattered around the hero art.
export function FloatingIcon({ icon: Icon, className = "", tone = "text-violet-500" }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 bg-white/90 shadow-lg shadow-violet-500/10 backdrop-blur dark:border-gray-800 dark:bg-gray-900/90 ${className}`}
    >
      <Icon className={`h-5 w-5 ${tone}`} />
    </span>
  );
}
