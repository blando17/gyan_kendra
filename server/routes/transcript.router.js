const express = require("express");

const transcriptController = require("../controllers/transcriptController");
const authenticateToken = require("../middleware/authMiddleware");
const rateLimit = require("../middleware/rateLimit");

const transcriptRouter = express.Router();

transcriptRouter.use(authenticateToken);

// Generating hits YouTube, so it is limited on two timescales: a burst guard
// so nobody hammers it, and an hourly cap so sustained use cannot get this
// server's IP throttled by YouTube. Reading or deleting history is local and
// needs neither.
const burstLimit = rateLimit({
  name: "transcript-burst",
  windowMs: 60 * 1000,
  max: Number(process.env.TRANSCRIPT_PER_MINUTE || 6),
  message:
    "That is a lot of transcripts at once. Wait a moment and try again.",
});

const hourlyLimit = rateLimit({
  name: "transcript-hourly",
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.TRANSCRIPT_PER_HOUR || 60),
  message:
    "You have reached the hourly transcript limit. Try again a little later.",
});

// Notes call a paid API, so they are capped on three levels:
//   per user, per minute   -- stops one person hammering it
//   per user, per hour     -- stops one person running up a bill overnight
//   server-wide, per hour  -- the only cap that actually bounds total spend,
//                             since per-user limits scale with user count
const notesGlobalLimit = rateLimit({
  name: "notes-global",
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.NOTES_GLOBAL_PER_HOUR || 120),
  key: () => "all",
  message:
    "The notes service is busy across all users right now. Try again shortly.",
});

const notesLimit = rateLimit({
  name: "notes",
  windowMs: 60 * 1000,
  max: Number(process.env.NOTES_PER_MINUTE || 3),
  message: "Notes are limited to a few per minute. Please wait a moment.",
});

const notesHourlyLimit = rateLimit({
  name: "notes-hourly",
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.NOTES_PER_HOUR || 20),
  message: "You have reached the hourly notes limit. Try again later.",
});

transcriptRouter.get("/capabilities", transcriptController.capabilities);

transcriptRouter.get("/", transcriptController.list);

transcriptRouter.post("/", burstLimit, hourlyLimit, transcriptController.generate);

transcriptRouter.post(
  "/notes",
  notesGlobalLimit,
  notesLimit,
  notesHourlyLimit,
  transcriptController.notes,
);

transcriptRouter.delete("/:id", transcriptController.remove);

module.exports = transcriptRouter;
