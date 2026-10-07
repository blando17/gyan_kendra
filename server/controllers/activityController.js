const Activity = require("../models/Activity");
const { asyncHandler } = require("../utils/errors");

// The feed only ever shows a recent window.
const listActivities = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);

  const activities = await Activity.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .limit(limit);

  res.json({ activities });
});

module.exports = { listActivities };
