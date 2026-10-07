import React, { useCallback, useEffect, useState } from "react";
import {
  Youtube,
  Download,
  Loader2,
  Trash2,
  ExternalLink,
  Clock,
  FileText,
  RotateCcw,
  Sparkles,
} from "lucide-react";

import { transcripts as api } from "../api/endpoints";
import { errorMessage } from "../api/client";
import { useToast } from "../context/ToastContext";
import { formatRelativeTime } from "../utils/format";

/**
 * Paste a YouTube link, get a .txt of the captions.
 *
 * The file is built in the browser from the text the API returns and saved
 * straight to the user's machine -- nothing is written on the server. Only
 * the video id, title and a few counts are kept, as history.
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

export default function TranscriptStudio() {
  const { addToast } = useToast();

  const [url, setUrl] = useState("");

  const [withTimestamps, setWithTimestamps] = useState(false);

  const [busy, setBusy] = useState(false);

  const [history, setHistory] = useState([]);

  const [loadingHistory, setLoadingHistory] = useState(true);

  const [lastResult, setLastResult] = useState(null);

  // Mirrors the X-RateLimit headers so the limit is visible before it bites.
  const [quota, setQuota] = useState(null);

  const [cooldown, setCooldown] = useState(0);

  const [notesBusy, setNotesBusy] = useState(false);

  // Hidden entirely when the server has no Gemini key configured.
  const [notesAvailable, setNotesAvailable] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      const res = await api.list();

      setHistory(res.data.transcripts);
    } catch (error) {
      addToast(errorMessage(error, "Could not load your history."), "error");
    } finally {
      setLoadingHistory(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadHistory();

    api
      .capabilities()
      .then((res) => setNotesAvailable(Boolean(res.data.notes?.available)))
      .catch(() => setNotesAvailable(false));
  }, [loadHistory]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;

    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);

    return () => clearTimeout(timer);
  }, [cooldown]);

  // Turn the returned text into a file the browser saves locally.
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

  const generate = async (event, sourceUrl) => {
    event?.preventDefault();

    const target = sourceUrl || url;

    if (!target.trim()) return;

    setBusy(true);

    try {
      const res = await api.generate({
        url: target.trim(),
        withTimestamps,
      });

      const remaining = Number(res.headers["x-ratelimit-remaining"]);

      const limit = Number(res.headers["x-ratelimit-limit"]);

      if (!Number.isNaN(remaining)) setQuota({ remaining, limit });

      const { text, filename, entry } = res.data;

      saveToDisk(text, filename);

      setLastResult({ ...entry, filename });

      if (!sourceUrl) setUrl("");

      addToast(`Downloaded "${filename}"`);

      // The history row is created or bumped by the same request.
      setHistory((current) => [
        entry,
        ...current.filter((item) => item._id !== entry._id),
      ]);
    } catch (error) {
      if (error?.response?.status === 429) {
        const wait = error.response.data?.retryAfterSeconds || 60;

        setCooldown(wait);

        setQuota({ remaining: 0, limit: Number(error.response.headers["x-ratelimit-limit"]) || null });
      }

      addToast(errorMessage(error, "Could not generate that transcript."), "error");
    } finally {
      setBusy(false);
    }
  };

  const generateNotes = async (sourceUrl) => {
    const target = sourceUrl || url;

    if (!target.trim()) return;

    setNotesBusy(true);

    try {
      const res = await api.notes({ url: target.trim() });

      const { pdfBase64, filename, entry } = res.data;

      saveToDisk(base64ToBytes(pdfBase64), filename, "application/pdf");

      setLastResult({ ...entry, filename, kind: "notes" });

      if (!sourceUrl) setUrl("");

      addToast(`Notes saved as "${filename}"`);

      setHistory((current) => [
        entry,
        ...current.filter((item) => item._id !== entry._id),
      ]);
    } catch (error) {
      if (error?.response?.status === 429) {
        setCooldown(error.response.data?.retryAfterSeconds || 60);
      }

      addToast(errorMessage(error, "Could not generate notes."), "error");
    } finally {
      setNotesBusy(false);
    }
  };

  const removeEntry = async (entry) => {
    const previous = history;

    setHistory((current) => current.filter((item) => item._id !== entry._id));

    try {
      await api.remove(entry._id);
    } catch (error) {
      setHistory(previous);

      addToast(errorMessage(error, "Could not remove that entry."), "error");
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2.5 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
          <Youtube className="h-7 w-7 text-red-500" />
          Transcript Generator
        </h1>

        <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
          Paste a YouTube link and get its captions as a .txt file on your
          machine. Only the video title and id are kept here, as history.
        </p>
      </div>

      {/* ---- the form ---- */}
      <form
        onSubmit={generate}
        className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
        <label
          htmlFor="yt-url"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
        >
          YouTube link
        </label>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="yt-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />

          <button
            type="submit"
            disabled={busy || notesBusy || !url.trim() || cooldown > 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {busy
              ? "Fetching..."
              : cooldown > 0
                ? `Wait ${cooldown}s`
                : "Generate .txt"}
          </button>

          {notesAvailable && (
            <button
              type="button"
              onClick={() => generateNotes()}
              disabled={busy || notesBusy || !url.trim() || cooldown > 0}
              title="Summarise the transcript into structured notes"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {notesBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {notesBusy ? "Writing..." : "Generate Notes"}
            </button>
          )}
        </div>

        <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
          <input
            type="checkbox"
            checked={withTimestamps}
            onChange={(e) => setWithTimestamps(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <Clock className="h-3.5 w-3.5" />
          Include timestamps
        </label>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-gray-400 dark:text-gray-600">
            Works with watch links, youtu.be share links and Shorts. The video
            needs captions available.
          </p>

          {notesBusy && (
            <p className="shrink-0 text-xs font-medium text-purple-600 dark:text-purple-400">
              Reading the whole transcript — this takes up to a minute.
            </p>
          )}

          {!notesBusy && quota && (
            <p
              className={`shrink-0 text-xs font-medium ${
                quota.remaining === 0
                  ? "text-rose-500"
                  : quota.remaining <= 2
                    ? "text-amber-500"
                    : "text-gray-400 dark:text-gray-600"
              }`}
            >
              {cooldown > 0
                ? `Limit reached — ${cooldown}s left`
                : `${quota.remaining} of ${quota.limit} left this minute`}
            </p>
          )}
        </div>
      </form>

      {/* ---- what just happened ---- */}
      {lastResult && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
          <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
            {lastResult.kind === "notes"
              ? "Structured notes saved to your downloads"
              : "Transcript saved to your downloads"}
          </p>

          <p className="mt-1 break-words font-mono text-xs text-emerald-800 dark:text-emerald-300">
            {lastResult.filename}
          </p>

          <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">
            {lastResult.segmentCount?.toLocaleString() || 0} caption lines ·{" "}
            {lastResult.wordCount?.toLocaleString() || 0} words
          </p>
        </div>
      )}

      {/* ---- history ---- */}
      <section>
        <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-gray-200">
          <FileText className="h-4 w-4" />
          History
          <span className="font-normal text-gray-400">({history.length})</span>
        </h2>

        {loadingHistory ? (
          <div className="flex items-center gap-2 py-8 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading history...
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 py-10 text-center dark:border-gray-700">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Nothing generated yet
            </p>

            <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
              Transcripts you create will be listed here by video.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {history.map((entry) => (
              <li
                key={entry._id}
                className="flex flex-wrap items-start gap-3 rounded-2xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900"
              >
                <img
                  src={`https://img.youtube.com/vi/${entry.videoId}/default.jpg`}
                  alt=""
                  loading="lazy"
                  className="h-12 w-20 shrink-0 rounded-lg object-cover"
                />

                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {entry.title}
                  </p>

                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {[
                      entry.channel,
                      <span key="id" className="font-mono">
                        {entry.videoId}
                      </span>,
                      `${entry.wordCount.toLocaleString()} words`,
                      formatRelativeTime(entry.updatedAt),
                      entry.generatedCount > 1
                        ? `generated ${entry.generatedCount}x`
                        : null,
                      entry.notesCount > 0
                        ? `${entry.notesCount} notes`
                        : null,
                    ]
                      .filter(Boolean)
                      .map((part, index) => (
                        <React.Fragment key={index}>
                          {index > 0 && " · "}
                          {part}
                        </React.Fragment>
                      ))}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    title="Generate the .txt again"
                    disabled={busy || notesBusy || cooldown > 0}
                    onClick={() => generate(null, entry.url)}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-indigo-600 disabled:opacity-50 dark:hover:bg-gray-800"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>

                  {notesAvailable && (
                    <button
                      type="button"
                      title="Generate structured notes"
                      disabled={busy || notesBusy || cooldown > 0}
                      onClick={() => generateNotes(entry.url)}
                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-purple-50 hover:text-purple-600 disabled:opacity-50 dark:hover:bg-purple-950/50"
                    >
                      <Sparkles className="h-4 w-4" />
                    </button>
                  )}

                  <a
                    href={entry.url}
                    target="_blank"
                    rel="noreferrer"
                    title="Open on YouTube"
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>

                  <button
                    type="button"
                    title="Remove from history"
                    onClick={() => removeEntry(entry)}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
