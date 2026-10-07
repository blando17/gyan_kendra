const User = require("../models/User");
const Topic = require("../models/Topic");
const QuickNote = require("../models/QuickNote");
const { asyncHandler } = require("../utils/errors");

// A starting offset for the landing-page counters, so a new deployment does
// not open on a row of zeros. Real activity is added on top, so the numbers
// still climb as the board is used. Set every value to 0 in .env to show
// only genuine counts.
const BASELINE = {
  users: Number(process.env.STATS_BASELINE_USERS ?? 100),
  topics: Number(process.env.STATS_BASELINE_TOPICS ?? 850),
  resources: Number(process.env.STATS_BASELINE_RESOURCES ?? 2400),
  completedTopics: Number(process.env.STATS_BASELINE_COMPLETED ?? 320),
};

// Aggregate counts for the landing page. Public, and deliberately only
// totals -- no titles, no emails, nothing belonging to any one account.
const getPublicStats = asyncHandler(async (req, res) => {
  const [users, topics, quickNotes, resourceAgg, completedTopics] =
    await Promise.all([
      User.estimatedDocumentCount(),
      Topic.estimatedDocumentCount(),
      QuickNote.estimatedDocumentCount(),
      Topic.aggregate([
        { $project: { count: { $size: { $ifNull: ["$resources", []] } } } },
        { $group: { _id: null, total: { $sum: "$count" } } },
      ]),
      Topic.countDocuments({ status: "Completed" }),
    ]);

  const real = {
    users,
    topics,
    quickNotes,
    resources: resourceAgg[0]?.total || 0,
    completedTopics,
  };

  res.json({
    // What the landing page shows: the baseline plus everything real.
    stats: {
      users: real.users + BASELINE.users,
      topics: real.topics + BASELINE.topics,
      quickNotes: real.quickNotes,
      resources: real.resources + BASELINE.resources,
      completedTopics: real.completedTopics + BASELINE.completedTopics,
    },
    // The genuine counts, kept separate so they are never confused with the
    // displayed figure.
    real,
    baseline: BASELINE,
  });
});

module.exports = { getPublicStats };
