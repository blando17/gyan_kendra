const mongoose = require("mongoose");

const ACTIVITY_TYPES = [
  "create",
  "edit",
  "delete",
  "status",
  "review",
  "quicknote",
  "info",
];

// The activity feed. Capped to a recent window per user by the controller.
const ActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    text: { type: String, required: true, trim: true },
    type: { type: String, enum: ACTIVITY_TYPES, default: "info" },
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: "Topic", default: null },
  },
  { timestamps: true },
);

ActivitySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Activity", ActivitySchema);

module.exports.ACTIVITY_TYPES = ACTIVITY_TYPES;
