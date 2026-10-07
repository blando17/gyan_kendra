const mongoose = require("mongoose");

// The scratchpad: fleeting thoughts that can later become a Topic.
const QuickNoteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true },
);

QuickNoteSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("QuickNote", QuickNoteSchema);
