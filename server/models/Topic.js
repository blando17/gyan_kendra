const mongoose = require("mongoose");

const RESOURCE_TYPES = [
  "Article",
  "YouTube",
  "Documentation",
  "GitHub",
  "Problem",
  "PDF",
  "Other",
];

const STATUSES = ["To Learn", "Learning", "Completed", "Needs Revision"];

const CATEGORIES = [
  "DSA / CP",
  "Development",
  "Theory",
  "Machine Learning",
  "Research",
  "Others",
];

const ResourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    type: { type: String, enum: RESOURCE_TYPES, default: "Article" },
  },
  { timestamps: true },
);

const ChecklistItemSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  completed: { type: Boolean, default: false },
});

const TopicSchema = new mongoose.Schema(
  {
    // Every topic belongs to exactly one account.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, index: true },
    description: { type: String, default: "", trim: true },
    notes: { type: String, default: "" },
    // Free text rather than an enum: the built-in CATEGORIES are offered as
    // defaults, but a user can name their own.
    category: {
      type: String,
      default: "Others",
      trim: true,
      maxlength: [40, "Category must be 40 characters or fewer"],
      index: true,
    },
    tags: [{ type: String, trim: true }],
    status: { type: String, enum: STATUSES, default: "To Learn", index: true },
    themeId: { type: String, default: "yellow" },
    isFavorite: { type: Boolean, default: false, index: true },
    resources: [ResourceSchema],
    checklist: [ChecklistItemSchema],
    collections: [{ type: String, trim: true }],
    reviewCount: { type: Number, default: 0 },
    lastReviewedAt: { type: Date, default: null },
    nextReviewAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

// Compound indexes matching how the board actually queries.
TopicSchema.index({ userId: 1, updatedAt: -1 });

TopicSchema.index({ userId: 1, nextReviewAt: 1 });

TopicSchema.index({ title: "text", description: "text", notes: "text", tags: "text" });

module.exports = mongoose.model("Topic", TopicSchema);

module.exports.RESOURCE_TYPES = RESOURCE_TYPES;

module.exports.STATUSES = STATUSES;

module.exports.CATEGORIES = CATEGORIES;
