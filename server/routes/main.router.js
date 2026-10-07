const express = require("express");

const authRouter = require("./auth.router");
const topicRouter = require("./topic.router");
const quickNoteRouter = require("./quickNote.router");
const collectionRouter = require("./collection.router");
const activityRouter = require("./activity.router");

const statsRouter = require("./stats.router");

const transcriptRouter = require("./transcript.router");

const mainRouter = express.Router();

mainRouter.use("/auth", authRouter);

mainRouter.use("/topics", topicRouter);

mainRouter.use("/quick-notes", quickNoteRouter);

mainRouter.use("/collections", collectionRouter);

mainRouter.use("/activities", activityRouter);

mainRouter.use("/transcripts", transcriptRouter);

// Public: aggregate counts for the landing page.
mainRouter.use("/stats", statsRouter);

mainRouter.get("/", (req, res) => {
  res.json({ message: "GyanKendra API running" });
});

module.exports = mainRouter;
