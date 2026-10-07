import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Youtube,
  Download,
  Sparkles,
  Loader2,
  Clock,
  Link2,
  GraduationCap,
  FileText,
} from "lucide-react";

import { Blob, CurvedArrow, DotGrid, FloatingIcon, Marked } from "./decor";
import { NotesCard, VideoCard } from "./ToolArtwork";

import { transcripts as api } from "../api/endpoints";
import { errorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

/**
 * The transcript tool, on the home page.
 *
 * Both actions call the authenticated API, so a signed-out visitor is sent to
 * sign up rather than the endpoints being opened publicly -- notes cost money
 * per call, and transcripts are rate limited per account.
 */
// The PDF arrives base64-encoded in JSON; turn it back into bytes.
function base64ToBytes(base64) {
  const binary = atob(base64);

  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

export default function HomeTranscriptTool() {
  const { user } = useAuth();

  const { addToast } = useToast();

  const navigate = useNavigate();

  const [url, setUrl] = useState("");

  const [busy, setBusy] = useState(null); // 'txt' | 'notes'

  const [withTimestamps, setWithTimestamps] = useState(false);

  const [notesAvailable, setNotesAvailable] = useState(false);

  const [done, setDone] = useState(null);

  useEffect(() => {
    if (!user) return;

    api
      .capabilities()
      .then((res) => setNotesAvailable(Boolean(res.data.notes?.available)))
      .catch(() => setNotesAvailable(false));
  }, [user]);

  const saveToDisk = (content, filename, mimeType = "text/plain;charset=utf-8") => {
    const blob = new Blob([content], { type: mimeType });

    const href = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = href;

    link.download = filename;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(href);
  };

  const run = async (kind) => {
    if (!url.trim()) return;

    // Signed out: send them to sign up, carrying the link they pasted.
    if (!user) {
      navigate("/signup", { state: { pendingUrl: url.trim() } });

      return;
    }

    setBusy(kind);

    setDone(null);

    try {
      const res =
        kind === "notes"
          ? await api.notes({ url: url.trim() })
          : await api.generate({ url: url.trim(), withTimestamps });

      const filename = res.data.filename;

      if (kind === "notes") {
        saveToDisk(
          base64ToBytes(res.data.pdfBase64),
          filename,
          "application/pdf",
        );
      } else {
        saveToDisk(res.data.text, filename);
      }

      setDone({ kind, filename });

      addToast(`Saved "${filename}"`);
    } catch (error) {
      addToast(
        errorMessage(
          error,
          kind === "notes"
            ? "Could not generate notes."
            : "Could not generate that transcript.",
        ),
        "error",
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <section
      id="tools"
      className="relative scroll-mt-20 overflow-hidden border-y border-violet-100/80 bg-gradient-to-b from-violet-50/80 via-white to-indigo-50/60 py-20 dark:border-gray-900 dark:from-gray-900/60 dark:via-gray-950 dark:to-gray-900/40"
    >
      {/* soft colour wash */}
      <Blob className="-left-24 top-10 h-72 w-72" tone="bg-violet-300/30 dark:bg-violet-800/20" />
      <Blob className="-right-20 bottom-0 h-80 w-80" tone="bg-indigo-300/30 dark:bg-indigo-800/20" />

      <DotGrid className="absolute left-8 bottom-16 hidden h-16 w-16 lg:block" />
      <DotGrid className="absolute right-10 top-20 hidden h-16 w-16 lg:block" />

      {/* the before and after, either side of the form */}
      <VideoCard className="absolute left-4 top-24 hidden xl:block 2xl:left-16" />
      <NotesCard className="absolute right-4 top-20 hidden xl:block 2xl:right-16" />

      <CurvedArrow className="absolute left-[18rem] top-48 hidden h-14 w-16 xl:block 2xl:left-[22rem]" />
      <CurvedArrow className="absolute right-[18rem] top-52 hidden h-14 w-16 xl:block 2xl:right-[22rem]" flip />

      <FloatingIcon icon={FileText} className="left-[22%] top-10 hidden xl:flex" />
      <FloatingIcon icon={Sparkles} className="right-[20%] top-8 hidden xl:flex" tone="text-amber-500" />
      <FloatingIcon icon={GraduationCap} className="right-[14%] bottom-24 hidden xl:flex" tone="text-indigo-500" />
      <FloatingIcon icon={Link2} className="left-[16%] bottom-20 hidden xl:flex" tone="text-emerald-500" />

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-1.5 text-sm font-medium text-red-600 dark:bg-red-950/50 dark:text-red-300">
            <Youtube className="h-4 w-4" />
            Built in
          </span>

          <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-4xl dark:text-white">
            Turn any lecture
            <br className="sm:hidden" />{" "}
            <Marked className="text-violet-600 dark:text-violet-400">
              into notes
            </Marked>
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-gray-600 dark:text-gray-400">
            Paste a YouTube link. Get the full transcript as a text file, or let
            Gemini turn it into structured study notes.
          </p>
        </div>

        <div className="mt-9 rounded-3xl border border-white/80 bg-white/80 p-5 shadow-xl shadow-violet-500/10 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
          <div className="relative">
            <Link2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-violet-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => run("txt")}
              disabled={Boolean(busy) || !url.trim()}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-700 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-gray-900/10 transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              {busy === "txt" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {busy === "txt" ? "Fetching..." : "Generate .txt"}
            </button>

            <button
              type="button"
              onClick={() => run("notes")}
              disabled={Boolean(busy) || !url.trim() || (user && !notesAvailable)}
              title={
                user && !notesAvailable
                  ? "Notes need a Gemini API key on the server"
                  : "Summarise into structured notes"
              }
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-violet-500/30 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy === "notes" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {busy === "notes" ? "Writing notes..." : "Generate Notes"}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
              <input
                type="checkbox"
                checked={withTimestamps}
                onChange={(e) => setWithTimestamps(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <Clock className="h-3.5 w-3.5" />
              Timestamps in the .txt
            </label>

            {!user && (
              <p className="text-xs text-gray-500 dark:text-gray-500">
                <Link to="/signup" className="font-semibold underline">
                  Create a free account
                </Link>{" "}
                to run it — it takes a moment.
              </p>
            )}
          </div>

          {busy === "notes" && (
            <p className="mt-3 text-center text-xs font-medium text-purple-600 dark:text-purple-400">
              Reading the whole transcript — this takes up to a minute.
            </p>
          )}

          {done && (
            <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
              Saved <span className="font-mono">{done.filename}</span> to your
              downloads.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
