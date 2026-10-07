const express = require("express");

const collectionController = require("../controllers/collectionController");
const authenticateToken = require("../middleware/authMiddleware");

const collectionRouter = express.Router();

collectionRouter.use(authenticateToken);

collectionRouter.get("/", collectionController.listCollections);

collectionRouter.post("/", collectionController.createCollection);

collectionRouter.put("/:id", collectionController.updateCollection);

collectionRouter.delete("/:id", collectionController.deleteCollection);

module.exports = collectionRouter;
