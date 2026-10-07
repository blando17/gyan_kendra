const express = require("express");

const quickNoteController = require("../controllers/quickNoteController");
const authenticateToken = require("../middleware/authMiddleware");

const quickNoteRouter = express.Router();

quickNoteRouter.use(authenticateToken);

quickNoteRouter.get("/", quickNoteController.listQuickNotes);

quickNoteRouter.post("/", quickNoteController.createQuickNote);

quickNoteRouter.delete("/:id", quickNoteController.deleteQuickNote);

quickNoteRouter.post("/:id/convert", quickNoteController.convertToTopic);

module.exports = quickNoteRouter;
