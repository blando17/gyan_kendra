import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BrainCircuit,
  Check,
  PlayCircle,
  Sparkles,
  Link2,
  FileText,
  FolderOpen,
  BarChart3,
  Moon,
  Sun,
  Linkedin,
  Video,
  GraduationCap,
  FileDown,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import LandingMockup from "../components/LandingMockup";
import StatsBand from "../components/StatsBand";
import HomeTranscriptTool from "../components/HomeTranscriptTool";
import { Blob, CurvedArrow, DotGrid, FloatingIcon, Marked, Sparkle } from "../components/decor";
import BoardArtwork from "../components/BoardArtwork";

const HIGHLIGHTS = [
  "Organize topics",
  "Save resources",
  "Write notes",
  "Track progress",
];

const FEATURES = [
  {
    icon: Link2,
    title: "Save Resources",
    body: "Keep all your useful links, videos, PDFs and more in one place.",
    tile: "bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300",
  },
  {
    icon: FileText,
    title: "Write Notes",
    body: "Capture your own understanding with a clean and focused editor.",
    tile: "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300",
  },
  {
    icon: FolderOpen,
    title: "Organize Easily",
    body: "Use categories and tags to keep everything structured.",
    tile: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300",
  },
  {
    icon: BarChart3,
    title: "Track Your Progress",
    body: "Know what you've learned, what to revise, and what's next.",
    tile: "bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300",
  },
];

const STEPS = [
  {
    step: "01",
    icon: FileText,
    tile: "bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300",
    glow: "text-violet-400",
    title: "Create a topic",
    body: "Give it a name, a category and a colour. It lands on your board as a sticky note.",
  },
  {
    step: "02",
    icon: Video,
    tile: "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300",
    glow: "text-amber-400",
    title: "Fill it with what you find",
    body: "Drop in links, papers and videos, then write your own notes in Markdown beside them.",
  },
  {
    step: "03",
    icon: Check,
    tile: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300",
    glow: "text-emerald-400",
    title: "Revise before you forget",
    body: "Mark a topic reviewed and GyanKendra schedules the next look for you automatically.",
  },
];

const NAV_LINKS = [
  { href: "#tools", label: "Transcripts" },
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#about", label: "About" },
];

export default function Landing() {
  const { user } = useAuth();

  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/60 via-white to-white dark:from-gray-950 dark:via-gray-950 dark:to-gray-950">
      {/* ---------------- Navigation ---------------- */}
      <header className="sticky top-0 z-40 border-b border-gray-100/80 bg-white/80 backdrop-blur-md dark:border-gray-900 dark:bg-gray-950/80">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20">
              <BrainCircuit className="h-5 w-5" />
            </span>

            <span className="text-lg font-extrabold tracking-tight text-gray-900 dark:text-white">
              GyanKendra
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleDarkMode}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              className="rounded-xl p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {user ? (
              <Link
                to="/board"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:bg-indigo-700"
              >
                Open board
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 sm:inline-flex dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-900"
                >
                  Log in
                </Link>

                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:bg-indigo-700"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* ---------------- Hero ---------------- */}
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 lg:px-8 lg:pb-20 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-10">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              <Sparkles className="h-4 w-4" />
              Your Personal Knowledge Space
            </span>

            <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-gray-900 sm:text-5xl lg:text-6xl dark:text-white">
              Your knowledge,
              <br />
              <span className="text-indigo-600 dark:text-indigo-400">
                beautifully organized.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-gray-600 dark:text-gray-400">
              A simple space to collect what you learn, connect resources, and
              build your own personal knowledge base.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to={user ? "/board" : "/signup"}
                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-7 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-700"
              >
                {user ? "Open your board" : "Start Building"}
                <ArrowRight className="h-5 w-5" />
              </Link>

              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2.5 rounded-2xl border border-gray-200 bg-white px-6 py-4 text-base font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <PlayCircle className="h-5 w-5 text-gray-400" />
                See how it works
              </a>
            </div>

            <ul className="mt-9 flex flex-wrap gap-x-7 gap-y-3">
              {HIGHLIGHTS.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400"
                >
                  <Check className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:pl-6">
            <LandingMockup />
          </div>
        </div>
      </section>

      {/* ---------------- The transcript tool, usable right here ------- */}
      <HomeTranscriptTool />

      {/* ---------------- Live numbers ---------------- */}
      <StatsBand />

      {/* ---------------- Features ---------------- */}
      <section
        id="features"
        className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6 lg:px-8"
      >
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, body, tile }) => (
            <div key={title} className="flex gap-4">
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tile}`}
              >
                <Icon className="h-5 w-5" />
              </span>

              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {title}
                </h3>

                <p className="mt-1.5 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section
        id="how-it-works"
        className="relative scroll-mt-20 overflow-hidden border-y border-violet-100/80 bg-gradient-to-b from-white via-violet-50/50 to-white py-20 dark:border-gray-900 dark:from-gray-950 dark:via-gray-900/40 dark:to-gray-950"
      >
        <DotGrid className="absolute left-10 top-24 hidden h-16 w-16 lg:block" />
        <DotGrid className="absolute right-10 top-28 hidden h-16 w-16 lg:block" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            How it{" "}
            <Marked className="text-violet-600 dark:text-violet-400">works</Marked>
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-center text-gray-600 dark:text-gray-400">
            Three steps, and the thing you learned last month is still there
            when you need it.
          </p>

          <div className="relative mt-14 grid gap-6 md:grid-cols-3">
            {/* arrows linking one step to the next */}
            <CurvedArrow className="absolute left-[31%] -top-8 hidden h-10 w-14 md:block" />
            <CurvedArrow className="absolute left-[64%] -top-8 hidden h-10 w-14 md:block" />

            {STEPS.map(({ step, title, body, icon: Icon, tile, glow }) => (
              <div
                key={step}
                className="relative rounded-3xl border border-white bg-white p-6 shadow-lg shadow-violet-500/5 transition hover:shadow-xl dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="mb-4 flex items-start justify-between">
                  <span className="rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-extrabold tracking-widest text-violet-600 dark:bg-violet-950/60 dark:text-violet-300">
                    {step}
                  </span>

                  <span className="relative">
                    <Sparkle className="absolute -left-5 -top-1 h-4 w-4" tone={glow} />
                    <Sparkle className="absolute -right-3 top-6 h-3 w-3 rotate-45" tone={glow} />

                    <span
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl ${tile}`}
                    >
                      <Icon className="h-7 w-7" />
                    </span>
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {title}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- About ---------------- */}
      <section
        id="about"
        className="relative scroll-mt-20 overflow-hidden px-4 py-20 sm:px-6"
      >
        <Blob className="-left-24 bottom-0 h-72 w-72" tone="bg-violet-300/25 dark:bg-violet-800/15" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-4xl dark:text-white">
              Built for people who{" "}
              <Marked className="text-violet-600 dark:text-violet-400">
                keep learning
              </Marked>
            </h2>

            <p className="mt-5 text-lg leading-relaxed text-gray-600 dark:text-gray-400">
              Bookmarks pile up, notes scatter across apps, and the thing you
              understood perfectly in October is gone by December. GyanKendra
              keeps the link, your own explanation and your revision schedule
              together on one card, so the understanding survives.
            </p>

            <Link
              to={user ? "/board" : "/signup"}
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 py-4 text-base font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:opacity-90"
            >
              {user ? "Open your board" : "Start Building"}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          <div className="relative">
            <BoardArtwork />

            <FloatingIcon icon={GraduationCap} className="-left-5 -top-5" tone="text-indigo-500" />
            <FloatingIcon icon={FileDown} className="-right-4 -top-6" tone="text-rose-500" />
            <FloatingIcon icon={Link2} className="-left-6 bottom-8" tone="text-violet-500" />
            <FloatingIcon icon={Video} className="-right-5 bottom-4" tone="text-amber-500" />
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-8 dark:border-gray-900">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 text-white">
              <BrainCircuit className="h-4 w-4" />
            </span>

            <span className="text-sm font-bold text-gray-900 dark:text-white">
              GyanKendra
            </span>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-500">
            Your knowledge, pinned in one place.
          </p>

          <p className="text-xs text-gray-500 dark:text-gray-500">
            Contributed by{' '}
            <a
              href="https://www.linkedin.com/in/soumyadeep-de-217597324/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-gray-700 underline decoration-gray-300 underline-offset-2 transition-colors hover:text-indigo-600 dark:text-gray-300 dark:decoration-gray-700 dark:hover:text-indigo-400"
            >
              Soumyadeep De
              <Linkedin className="h-3.5 w-3.5" />
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
