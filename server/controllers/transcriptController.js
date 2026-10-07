const Transcript = require("../models/Transcript");
const Activity = require("../models/Activity");
const { asyncHandler, notFound } = require("../utils/errors");
const {
  parseVideoId,
  fetchVideoMeta,
  fetchTranscript,
  formatTranscript,
  safeFilename,
} = require("../utils/youtube");
const {
  isConfigured,
  generateStructuredNotes,
  notesToMarkdown,
  MODEL,
} = require("../utils/gemini");
const { notesToPdf } = require("../utils/pdf");

// ========================================
// GENERATE A TRANSCRIPT
// ========================================

const generate = asyncHandler(async (req, res) => {
  const { url, withTimestamps = false, language } = req.body;

  const videoId = parseVideoId(url);

  // Metadata first: it is the check that tells a missing/private video apart
  // from a real one that simply has no captions. Running both in parallel let
  // the vaguer caption error win the race.
  const meta = await fetchVideoMeta(videoId);

  const segments = await fetchTranscript(videoId, language);

  const text = formatTranscript(
    segments,
    { ...meta, videoId },
    { withTimestamps: Boolean(withTimestamps) },
  );

  const wordCount = text.trim().split(/\s+/).length;

  // History only: the text above is returned to the browser and never saved.
  const entry = await Transcript.findOneAndUpdate(
    { userId: req.user.id, videoId },
    {
      $set: {
        title: meta.title,
        channel: meta.channel,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        language: language || segments[0]?.lang || "en",
        segmentCount: segments.length,
        wordCount,
        charCount: text.length,
      },
      $inc: { generatedCount: 1 },
      $setOnInsert: { userId: req.user.id, videoId },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  await Activity.create({
    userId: req.user.id,
    text: `Generated a transcript for "${meta.title}"`,
    type: "info",
  });

  res.json({
    message: "Transcript ready",
    entry,
    filename: safeFilename(meta.title, videoId),
    text,
  });
});

// ========================================
// STRUCTURED NOTES FROM A VIDEO
// ========================================

const notes = asyncHandler(async (req, res) => {
  const { url } = req.body;

  const videoId = parseVideoId(url);

  const meta = await fetchVideoMeta(videoId);

  const segments = await fetchTranscript(videoId, req.body.language);

  // The plain transcript text is what the model reads; it is built here and
  // never written to disk, same as the .txt the browser downloads.
  const transcript = segments.map((segment) => segment.text).join(" ");

  const {
    notes: structured,
    passes,
    model: usedModel,
  } = await generateStructuredNotes(transcript, { title: meta.title });

  const markdown = notesToMarkdown(structured, { ...meta, videoId });

  // The download is a PDF; the Markdown is kept in the response for anyone
  // who wants the raw text. Neither is written to disk here.
  const pdf = await notesToPdf(structured, { ...meta, videoId });

  const entry = await Transcript.findOneAndUpdate(
    { userId: req.user.id, videoId },
    {
      $set: {
        title: meta.title,
        channel: meta.channel,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        lastNotesAt: new Date(),
      },
      $inc: { notesCount: 1 },
      $setOnInsert: {
        userId: req.user.id,
        videoId,
        segmentCount: segments.length,
        wordCount: transcript.trim().split(/\s+/).length,
        charCount: transcript.length,
        generatedCount: 0,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  await Activity.create({
    userId: req.user.id,
    text: `Generated notes for "${meta.title}"`,
    type: "info",
  });

  res.json({
    message: "Notes ready",
    entry,
    model: usedModel || MODEL,
    passes,
    notes: structured,
    markdown,
    // base64 so the entry and the file arrive together in one response; the
    // browser turns it back into a Blob and saves it.
    pdfBase64: pdf.toString("base64"),
    filename: safeFilename(meta.title, videoId).replace(/\.txt$/, " notes.pdf"),
  });
});

// Lets the client hide the button when the server has no key configured.
const capabilities = asyncHandler(async (req, res) => {
  res.json({ notes: { available: isConfigured(), model: MODEL } });
});

// ========================================
// HISTORY
// ========================================

const list = asyncHandler(async (req, res) => {
  const transcripts = await Transcript.find({ userId: req.user.id }).sort({
    updatedAt: -1,
  });

  res.json({ transcripts });
});

const remove = asyncHandler(async (req, res) => {
  const entry = await Transcript.findOneAndDelete({
    _id: req.params.id,
    userId: req.user.id,
  });

  if (!entry) throw notFound("History entry not found!");

  res.json({ message: "Removed from history" });
});

module.exports = { generate, notes, capabilities, list, remove };
