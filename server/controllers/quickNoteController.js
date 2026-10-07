const QuickNote = require("../models/QuickNote");
const Topic = require("../models/Topic");
const Activity = require("../models/Activity");
const { asyncHandler, badRequest, notFound } = require("../utils/errors");
const { firstReviewDate } = require("../utils/revision");

const THEME_IDS = ["yellow", "rose", "sky", "mint", "lavender", "peach"];

const listQuickNotes = asyncHandler(async (req, res) => {
  const quickNotes = await QuickNote.find({ userId: req.user.id }).sort({
    createdAt: -1,
  });

  res.json({ quickNotes });
});

const createQuickNote = asyncHandler(async (req, res) => {
  const { content, tags } = req.body;

  if (!content || !String(content).trim()) {
    throw badRequest("A quick note needs some text!");
  }

  const quickNote = await QuickNote.create({
    userId: req.user.id,
    content: String(content).trim(),
    tags: Array.isArray(tags) ? tags : [],
  });

  await Activity.create({
    userId: req.user.id,
    text: "Added a new quick note",
    type: "quicknote",
  });

  res.status(201).json({ message: "Quick note saved", quickNote });
});

const deleteQuickNote = asyncHandler(async (req, res) => {
  const quickNote = await QuickNote.findOneAndDelete({
    _id: req.params.id,
    userId: req.user.id,
  });

  if (!quickNote) throw notFound("Quick note not found!");

  res.json({ message: "Quick note removed" });
});

// ========================================
// CONVERT A QUICK NOTE INTO A TOPIC
// ========================================

const convertToTopic = asyncHandler(async (req, res) => {
  const quickNote = await QuickNote.findOne({
    _id: req.params.id,
    userId: req.user.id,
  });

  if (!quickNote) throw notFound("Quick note not found!");

  const title =
    quickNote.content.length > 32
      ? `${quickNote.content.slice(0, 32).trim()}...`
      : quickNote.content.trim();

  const topic = await Topic.create({
    userId: req.user.id,
    title,
    description: quickNote.content,
    category: req.body.category || "Others",
    tags: quickNote.tags.length ? quickNote.tags : ["QuickNote"],
    status: "To Learn",
    themeId: THEME_IDS[Math.floor(Math.random() * THEME_IDS.length)],
    notes: `# ${title}\n\n${quickNote.content}\n\n*Converted from a quick note on ${new Date().toLocaleDateString()}*`,
    checklist: [{ text: "Explore and organize topic structure", completed: false }],
    nextReviewAt: firstReviewDate(),
  });

  // The note has become a topic, so it leaves the scratchpad.
  await quickNote.deleteOne();

  await Activity.create({
    userId: req.user.id,
    text: `Converted quick note to topic "${topic.title}"`,
    type: "create",
    topicId: topic._id,
  });

  res.status(201).json({ message: `Converted to "${topic.title}"`, topic });
});

module.exports = {
  listQuickNotes,
  createQuickNote,
  deleteQuickNote,
  convertToTopic,
};
