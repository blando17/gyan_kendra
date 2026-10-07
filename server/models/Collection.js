const mongoose = require("mongoose");

// A named grouping of topics. Topics reference collections by name, so the
// name is unique per user.
const CollectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, default: "", trim: true, maxlength: 300 },
    color: { type: String, default: "#f59e0b" },
  },
  { timestamps: true },
);

CollectionSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Collection", CollectionSchema);
