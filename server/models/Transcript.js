const mongoose = require("mongoose");

/**
 * History of generated transcripts.
 *
 * The transcript text itself is deliberately NOT stored: it is streamed back
 * to the browser, saved to the user's machine as a .txt, and forgotten here.
 * What stays is enough to show a history list and re-generate on demand.
 */
const TranscriptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    videoId: { type: String, required: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    channel: { type: String, default: "", trim: true },
    url: { type: String, required: true, trim: true },
    language: { type: String, default: "en" },
    segmentCount: { type: Number, default: 0 },
    wordCount: { type: Number, default: 0 },
    charCount: { type: Number, default: 0 },
    // How many times this video has been generated.
    generatedCount: { type: Number, default: 1 },
    // Same for AI notes. The notes themselves are not stored either.
    notesCount: { type: Number, default: 0 },
    lastNotesAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// One row per video per user; re-generating updates it rather than piling up.
TranscriptSchema.index({ userId: 1, videoId: 1 }, { unique: true });

TranscriptSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model("Transcript", TranscriptSchema);
