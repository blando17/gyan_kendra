const Collection = require("../models/Collection");
const Topic = require("../models/Topic");
const { asyncHandler, badRequest, notFound } = require("../utils/errors");

// Each collection is returned with how many topics currently reference it.
const listCollections = asyncHandler(async (req, res) => {
  const collections = await Collection.find({ userId: req.user.id }).sort({
    name: 1,
  });

  const counts = await Topic.aggregate([
    { $match: { userId: require("mongoose").Types.ObjectId.createFromHexString(req.user.id) } },
    { $unwind: "$collections" },
    { $group: { _id: "$collections", count: { $sum: 1 } } },
  ]);

  const countByName = new Map(counts.map((row) => [row._id, row.count]));

  res.json({
    collections: collections.map((collection) => ({
      ...collection.toObject(),
      topicCount: countByName.get(collection.name) || 0,
    })),
  });
});

const createCollection = asyncHandler(async (req, res) => {
  const { name, description, color } = req.body;

  if (!name || !String(name).trim()) {
    throw badRequest("Collection name is required!");
  }

  const collection = await Collection.create({
    userId: req.user.id,
    name: String(name).trim(),
    description: description || "",
    color: color || "#f59e0b",
  });

  res.status(201).json({ message: "Collection created!", collection });
});

const updateCollection = asyncHandler(async (req, res) => {
  const { name, description, color } = req.body;

  const collection = await Collection.findOne({
    _id: req.params.id,
    userId: req.user.id,
  });

  if (!collection) throw notFound("Collection not found!");

  const previousName = collection.name;

  if (name !== undefined) collection.name = String(name).trim();

  if (description !== undefined) collection.description = description;

  if (color !== undefined) collection.color = color;

  await collection.save();

  // Topics store the collection by name, so a rename has to follow through.
  if (name !== undefined && collection.name !== previousName) {
    await Topic.updateMany(
      { userId: req.user.id, collections: previousName },
      { $set: { "collections.$": collection.name } },
    );
  }

  res.json({ message: "Collection updated!", collection });
});

const deleteCollection = asyncHandler(async (req, res) => {
  const collection = await Collection.findOneAndDelete({
    _id: req.params.id,
    userId: req.user.id,
  });

  if (!collection) throw notFound("Collection not found!");

  // Topics survive; they just lose the label.
  await Topic.updateMany(
    { userId: req.user.id, collections: collection.name },
    { $pull: { collections: collection.name } },
  );

  res.json({ message: "Collection deleted!" });
});

module.exports = {
  listCollections,
  createCollection,
  updateCollection,
  deleteCollection,
};
