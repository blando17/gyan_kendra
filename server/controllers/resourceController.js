const Topic = require("../models/Topic");
const Activity = require("../models/Activity");
const { asyncHandler, badRequest, notFound } = require("../utils/errors");

// Resources and checklist items are embedded in their topic, so owning the
// topic is owning them: every filter carries the topic id and the user id.
const scope = (req) => ({ _id: req.params.id, userId: req.user.id });

const LINK_TYPES = Topic.RESOURCE_TYPES;

// Guess the type from the host so the user rarely has to pick one.
function detectType(url = "") {
  const value = url.toLowerCase();

  if (/youtube\.com|youtu\.be/.test(value)) return "YouTube";

  if (/github\.com/.test(value)) return "GitHub";

  if (/leetcode\.com|codeforces\.com|hackerrank\.com|codechef\.com/.test(value))
    return "Problem";

  if (/\.pdf($|\?)/.test(value)) return "PDF";

  if (/docs\.|developer\.|\/docs|mdn|readthedocs/.test(value))
    return "Documentation";

  return "Article";
}

function validUrl(url) {
  try {
    const parsed = new URL(url);

    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// ========================================
// ADD RESOURCE
// ========================================

const addResource = asyncHandler(async (req, res) => {
  const { title, url, type } = req.body;

  if (!title || !String(title).trim()) throw badRequest("Title is required!");

  if (!url || !validUrl(url)) {
    throw badRequest("Please enter a valid http(s) link!");
  }

  const resolved = LINK_TYPES.includes(type) ? type : detectType(url);

  const topic = await Topic.findOneAndUpdate(
    scope(req),
    { $push: { resources: { title: String(title).trim(), url, type: resolved } } },
    { new: true, runValidators: true },
  );

  if (!topic) throw notFound("Topic not found!");

  await Activity.create({
    userId: req.user.id,
    text: `Added a resource to "${topic.title}"`,
    type: "edit",
    topicId: topic._id,
  });

  res.status(201).json({
    message: "Resource added successfully!",
    resource: topic.resources[topic.resources.length - 1],
    topic,
  });
});

// ========================================
// UPDATE RESOURCE
// ========================================

const updateResource = asyncHandler(async (req, res) => {
  const { title, url, type } = req.body;

  const updates = {};

  if (title !== undefined) updates["resources.$[item].title"] = String(title).trim();

  if (url !== undefined) {
    if (!validUrl(url)) throw badRequest("Please enter a valid http(s) link!");

    updates["resources.$[item].url"] = url;
  }

  if (type !== undefined) {
    if (!LINK_TYPES.includes(type)) throw badRequest("Unknown resource type!");

    updates["resources.$[item].type"] = type;
  }

  if (Object.keys(updates).length === 0) {
    throw badRequest("No fields provided to update!");
  }

  // Matching the embedded id too means a resource id belonging to another
  // topic cannot be edited through this route.
  const topic = await Topic.findOneAndUpdate(
    { ...scope(req), "resources._id": req.params.resourceId },
    { $set: updates },
    {
      new: true,
      arrayFilters: [{ "item._id": req.params.resourceId }],
    },
  );

  if (!topic) throw notFound("Resource not found!");

  res.json({ message: "Resource updated successfully!", topic });
});

// ========================================
// DELETE RESOURCE
// ========================================

const deleteResource = asyncHandler(async (req, res) => {
  const topic = await Topic.findOneAndUpdate(
    { ...scope(req), "resources._id": req.params.resourceId },
    { $pull: { resources: { _id: req.params.resourceId } } },
    { new: true },
  );

  if (!topic) throw notFound("Resource not found!");

  res.json({ message: "Resource removed successfully!", topic });
});

// ========================================
// CHECKLIST
// ========================================

const addChecklistItem = asyncHandler(async (req, res) => {
  const { text } = req.body;

  if (!text || !String(text).trim()) throw badRequest("Item text is required!");

  const topic = await Topic.findOneAndUpdate(
    scope(req),
    { $push: { checklist: { text: String(text).trim(), completed: false } } },
    { new: true, runValidators: true },
  );

  if (!topic) throw notFound("Topic not found!");

  res.status(201).json({ message: "Checklist item added!", topic });
});

const updateChecklistItem = asyncHandler(async (req, res) => {
  const { text, completed } = req.body;

  const updates = {};

  if (text !== undefined) updates["checklist.$[item].text"] = String(text).trim();

  if (completed !== undefined) {
    updates["checklist.$[item].completed"] = Boolean(completed);
  }

  if (Object.keys(updates).length === 0) {
    throw badRequest("No fields provided to update!");
  }

  const topic = await Topic.findOneAndUpdate(
    { ...scope(req), "checklist._id": req.params.itemId },
    { $set: updates },
    { new: true, arrayFilters: [{ "item._id": req.params.itemId }] },
  );

  if (!topic) throw notFound("Checklist item not found!");

  res.json({ message: "Checklist updated!", topic });
});

const deleteChecklistItem = asyncHandler(async (req, res) => {
  const topic = await Topic.findOneAndUpdate(
    { ...scope(req), "checklist._id": req.params.itemId },
    { $pull: { checklist: { _id: req.params.itemId } } },
    { new: true },
  );

  if (!topic) throw notFound("Checklist item not found!");

  res.json({ message: "Checklist item removed!", topic });
});

module.exports = {
  detectType,
  addResource,
  updateResource,
  deleteResource,
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
};
