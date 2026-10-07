const { YoutubeTranscript } = require("youtube-transcript");

const { badRequest } = require("./errors");

// Accepts the shapes people actually paste: a full watch URL, a share link,
// a Shorts or embed URL, or just the bare id.
function parseVideoId(input) {
  const raw = String(input || "").trim();

  if (!raw) throw badRequest("Paste a YouTube link first.");

  if (/^[\w-]{11}$/.test(raw)) return raw;

  let url;

  try {
    url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
  } catch {
    throw badRequest("That does not look like a YouTube link.");
  }

  const host = url.hostname.replace(/^www\./, "");

  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];

    if (/^[\w-]{11}$/.test(id)) return id;
  }

  if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
    const v = url.searchParams.get("v");

    if (v && /^[\w-]{11}$/.test(v)) return v;

    const match = url.pathname.match(/^\/(shorts|embed|live|v)\/([\w-]{11})/);

    if (match) return match[2];
  }

  throw badRequest("Could not find a video id in that link.");
}

// Title and channel come from YouTube's own oEmbed endpoint, which is a
// documented public API rather than page scraping.
async function fetchVideoMeta(videoId) {
  const res = await fetch(
    `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
  );

  // oEmbed answers 404 for a removed video and 400 for an id that never
  // existed; both mean there is nothing to transcribe.
  if (res.status === 404 || res.status === 400) {
    throw badRequest("That video does not exist, or it is private.");
  }

  if (!res.ok) {
    // Some other hiccup (rate limit, outage). Carry on with a placeholder
    // title rather than failing the whole request.
    return { title: `YouTube video ${videoId}`, channel: "" };
  }

  const data = await res.json();

  return { title: data.title, channel: data.author_name || "" };
}

// Maps the library's errors onto something a person can act on.
function captionError(err) {
  const message = String(err?.message || "");

  if (/disabled|not available|Could not find|No transcript/i.test(message)) {
    return badRequest(
      "This video has no captions available, so there is nothing to transcribe.",
    );
  }

  if (/unavailable|private/i.test(message)) {
    return badRequest("That video is unavailable or private.");
  }

  return badRequest(
    "Could not fetch the transcript. YouTube may be rate limiting; try again shortly.",
  );
}

/**
 * Fetches captions, preferring English.
 *
 * Without an explicit language the library returns whichever track YouTube
 * lists first, which on multi-language videos is often not the spoken one --
 * a talk in English came back in Chinese. So ask for a language, and only
 * fall back to "whatever exists" if that language is genuinely absent.
 */
async function fetchTranscript(videoId, lang) {
  const preferred = lang || "en";

  let segments;

  try {
    segments = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: preferred,
    });
  } catch (err) {
    // An explicit request for a missing language is worth reporting.
    if (lang) throw captionError(err);

    try {
      segments = await YoutubeTranscript.fetchTranscript(videoId);
    } catch (fallbackError) {
      throw captionError(fallbackError);
    }
  }

  if (!segments?.length) {
    throw badRequest("No caption text was returned for this video.");
  }

  return segments;
}

const stamp = (ms) => {
  const total = Math.floor(ms / 1000);

  const h = Math.floor(total / 3600);

  const m = Math.floor((total % 3600) / 60);

  const s = total % 60;

  const pad = (n) => String(n).padStart(2, "0");

  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
};

// YouTube's caption text arrives HTML-escaped.
function decode(text = "") {
  return text
    .replace(/&amp;#39;|&#39;/g, "'")
    .replace(/&amp;quot;|&quot;/g, '"')
    .replace(/&amp;amp;|&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

// Builds the .txt the user downloads. The file is never written to disk here;
// it is returned to the browser, which saves it.
function formatTranscript(segments, meta, { withTimestamps = false } = {}) {
  const header = [
    meta.title,
    meta.channel ? `Channel: ${meta.channel}` : null,
    `Source: https://www.youtube.com/watch?v=${meta.videoId}`,
    `Generated: ${new Date().toLocaleString()}`,
    "",
    "-".repeat(60),
    "",
  ]
    .filter((line) => line !== null)
    .join("\n");

  const body = withTimestamps
    ? segments
        .map((s) => `[${stamp(s.offset)}] ${decode(s.text).trim()}`)
        .join("\n")
    : // Wrap the continuous text into readable paragraphs.
      decode(segments.map((s) => s.text).join(" "))
        .replace(/\s+/g, " ")
        .trim()
        .split(/(?<=[.!?])\s+/)
        .reduce((lines, sentence) => {
          const last = lines[lines.length - 1];

          if (last && (last + " " + sentence).length < 400) {
            lines[lines.length - 1] = `${last} ${sentence}`;
          } else {
            lines.push(sentence);
          }

          return lines;
        }, [])
        .join("\n\n");

  return `${header}${body}\n`;
}

// A filename the operating system will accept.
function safeFilename(title, videoId) {
  const base = String(title || "transcript")
    .replace(/[\\/:*?"<>|]+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);

  return `${base || "transcript"} [${videoId}].txt`;
}

module.exports = {
  parseVideoId,
  fetchVideoMeta,
  fetchTranscript,
  formatTranscript,
  safeFilename,
  decode,
};
