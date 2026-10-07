const Topic = require("../models/Topic");
const Activity = require("../models/Activity");
const { asyncHandler, badRequest, notFound } = require("../utils/errors");
const { firstReviewDate, onReviewed } = require("../utils/revision");

// Ownership is part of every filter, never a separate check afterwards.
const scope = (req, extra = {}) => ({ userId: req.user.id, ...extra });

async function log(req, text, type, topicId = null) {
  await Activity.create({ userId: req.user.id, text, type, topicId });
}

// Fields a client is allowed to set. Anything else in the body is ignored,
// so userId, reviewCount and the review dates cannot be forged.
const WRITABLE = [
  "title",
  "description",
  "notes",
  "category",
  "tags",
  "status",
  "themeId",
  "isFavorite",
  "resources",
  "checklist",
  "collections",
];

function pickWritable(body) {
  return WRITABLE.reduce((acc, key) => {
    if (body[key] !== undefined) acc[key] = body[key];

    return acc;
  }, {});
}

// ========================================
// LIST TOPICS (search + filters)
// ========================================

const listTopics = asyncHandler(async (req, res) => {
  const { search, category, status, favorite, collection, tag, sort } = req.query;

  const filter = scope(req);

  if (category && category !== "All") filter.category = category;

  if (status && status !== "All") filter.status = status;

  if (favorite === "true") filter.isFavorite = true;

  if (collection) filter.collections = collection;

  if (tag) filter.tags = tag;

  if (search && search.trim()) {
    // Escaped so a user's own punctuation cannot act as a pattern.
    const pattern = new RegExp(
      search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i",
    );

    filter.$or = [
      { title: pattern },
      { description: pattern },
      { notes: pattern },
      { tags: pattern },
    ];
  }

  const sorts = {
    "recently-updated": { updatedAt: -1 },
    created: { createdAt: -1 },
    name: { title: 1 },
    status: { status: 1, updatedAt: -1 },
  };

  const topics = await Topic.find(filter).sort(sorts[sort] || sorts["recently-updated"]);

  res.json({ topics });
});

// ========================================
// TOPICS DUE FOR REVISION
// ========================================

const listDueForReview = asyncHandler(async (req, res) => {
  const topics = await Topic.find({
    ...scope(req),
    $or: [
      { nextReviewAt: { $ne: null, $lte: new Date() } },
      { status: "Needs Revision" },
    ],
  }).sort({ nextReviewAt: 1 });

  res.json({ topics });
});

// ========================================
// BOARD STATISTICS
// ========================================

const getStats = asyncHandler(async (req, res) => {
  const topics = await Topic.find(scope(req)).select(
    "status resources nextReviewAt createdAt",
  );

  const now = new Date();

  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const countBy = (status) => topics.filter((t) => t.status === status).length;

  // Seven buckets, oldest first, for the weekly velocity chart.
  const velocity = Array.from({ length: 7 }, (_, offset) => {
    const day = new Date(now.getTime() - (6 - offset) * 24 * 60 * 60 * 1000);

    const start = new Date(day).setHours(0, 0, 0, 0);

    const end = new Date(day).setHours(23, 59, 59, 999);

    return {
      date: new Date(start).toISOString(),
      count: topics.filter(
        (t) => t.createdAt >= new Date(start) && t.createdAt <= new Date(end),
      ).length,
    };
  });

  res.json({
    stats: {
      total: topics.length,
      toLearn: countBy("To Learn"),
      learning: countBy("Learning"),
      completed: countBy("Completed"),
      needsRevision: topics.filter(
        (t) =>
          t.status === "Needs Revision" ||
          (t.nextReviewAt && t.nextReviewAt <= now),
      ).length,
      totalResources: topics.reduce((sum, t) => sum + t.resources.length, 0),
      topicsThisWeek: topics.filter((t) => t.createdAt >= weekAgo).length,
      velocity,
    },
  });
});

// ========================================
// CATEGORIES IN USE
// ========================================

const listCategories = asyncHandler(async (req, res) => {
  const used = await Topic.distinct("category", scope(req));

  // Built-in defaults first, then anything the user has invented.
  const defaults = Topic.CATEGORIES;

  const custom = used
    .filter((name) => name && !defaults.includes(name))
    .sort((a, b) => a.localeCompare(b));

  res.json({ categories: [...defaults, ...custom], defaults, custom });
});

// ========================================
// GET ONE TOPIC
// ========================================

const getTopic = asyncHandler(async (req, res) => {
  const topic = await Topic.findOne(scope(req, { _id: req.params.id }));

  if (!topic) throw notFound("Topic not found!");

  res.json({ topic });
});

// ========================================
// CREATE TOPIC
// ========================================

const createTopic = asyncHandler(async (req, res) => {
  const data = pickWritable(req.body);

  if (!data.title || !String(data.title).trim()) {
    throw badRequest("Title is required!");
  }

  const topic = await Topic.create({
    ...data,
    userId: req.user.id,
    nextReviewAt: firstReviewDate(),
  });

  await log(req, `Created topic "${topic.title}"`, "create", topic._id);

  res.status(201).json({ message: "Topic created successfully!", topic });
});

// ========================================
// UPDATE TOPIC
// ========================================

const updateTopic = asyncHandler(async (req, res) => {
  const data = pickWritable(req.body);

  if (Object.keys(data).length === 0) {
    throw badRequest("No fields provided to update!");
  }

  const topic = await Topic.findOneAndUpdate(
    scope(req, { _id: req.params.id }),
    { $set: data },
    { new: true, runValidators: true },
  );

  if (!topic) throw notFound("Topic not found!");

  if (data.status) {
    await log(req, `Updated ${topic.title} to ${data.status}`, "status", topic._id);
  } else {
    await log(req, `Updated "${topic.title}"`, "edit", topic._id);
  }

  res.json({ message: "Topic updated successfully!", topic });
});

// ========================================
// AUTOSAVED NOTES
// ========================================

const updateNotes = asyncHandler(async (req, res) => {
  if (typeof req.body.notes !== "string") {
    throw badRequest("Notes must be text!");
  }

  // Autosave fires often, so it writes one field and logs nothing.
  const topic = await Topic.findOneAndUpdate(
    scope(req, { _id: req.params.id }),
    { $set: { notes: req.body.notes } },
    { new: true },
  ).select("_id notes updatedAt");

  if (!topic) throw notFound("Topic not found!");

  res.json({ message: "Notes saved", topic });
});

// ========================================
// MARK AS REVIEWED
// ========================================

const markReviewed = asyncHandler(async (req, res) => {
  const existing = await Topic.findOne(scope(req, { _id: req.params.id }));

  if (!existing) throw notFound("Topic not found!");

  // The interval is decided here, never sent by the client.
  const { intervalDays, ...fields } = onReviewed(existing.reviewCount);

  const topic = await Topic.findOneAndUpdate(
    scope(req, { _id: req.params.id }),
    { $set: fields },
    { new: true },
  );

  await log(req, `Reviewed "${topic.title}"`, "review", topic._id);

  res.json({
    message: `Marked as reviewed. Next review in ${intervalDays} days.`,
    intervalDays,
    topic,
  });
});

// ========================================
// DUPLICATE TOPIC
// ========================================

const duplicateTopic = asyncHandler(async (req, res) => {
  const source = await Topic.findOne(scope(req, { _id: req.params.id })).lean();

  if (!source) throw notFound("Topic not found!");

  const { _id, createdAt, updatedAt, ...rest } = source;

  const topic = await Topic.create({
    ...rest,
    userId: req.user.id,
    title: `${source.title} (Copy)`,
    isFavorite: false,
    reviewCount: 0,
    lastReviewedAt: null,
    nextReviewAt: firstReviewDate(),
  });

  await log(req, `Duplicated topic "${source.title}"`, "create", topic._id);

  res.status(201).json({ message: "Topic duplicated successfully!", topic });
});

// ========================================
// DELETE TOPIC
// ========================================

const deleteTopic = asyncHandler(async (req, res) => {
  const topic = await Topic.findOneAndDelete(scope(req, { _id: req.params.id }));

  if (!topic) throw notFound("Topic not found!");

  await log(req, `Deleted topic "${topic.title}"`, "delete");

  res.json({ message: "Topic deleted successfully!" });
});

module.exports = {
  listTopics,
  listCategories,
  listDueForReview,
  getStats,
  getTopic,
  createTopic,
  updateTopic,
  updateNotes,
  markReviewed,
  duplicateTopic,
  deleteTopic,
};
