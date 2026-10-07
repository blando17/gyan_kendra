const express = require("express");

const topicController = require("../controllers/topicController");
const resourceController = require("../controllers/resourceController");
const authenticateToken = require("../middleware/authMiddleware");

const topicRouter = express.Router();

// Everything below this line needs a valid token.
topicRouter.use(authenticateToken);

// Fixed paths come before /:id so they are not read as an id.
topicRouter.get("/due", topicController.listDueForReview);

topicRouter.get("/stats", topicController.getStats);

topicRouter.get("/categories", topicController.listCategories);

topicRouter.get("/", topicController.listTopics);

topicRouter.post("/", topicController.createTopic);

topicRouter.get("/:id", topicController.getTopic);

topicRouter.put("/:id", topicController.updateTopic);

topicRouter.delete("/:id", topicController.deleteTopic);

topicRouter.patch("/:id/notes", topicController.updateNotes);

topicRouter.patch("/:id/review", topicController.markReviewed);

topicRouter.post("/:id/duplicate", topicController.duplicateTopic);

// Resources
topicRouter.post("/:id/resources", resourceController.addResource);

topicRouter.put("/:id/resources/:resourceId", resourceController.updateResource);

topicRouter.delete("/:id/resources/:resourceId", resourceController.deleteResource);

// Checklist
topicRouter.post("/:id/checklist", resourceController.addChecklistItem);

topicRouter.patch("/:id/checklist/:itemId", resourceController.updateChecklistItem);

topicRouter.delete("/:id/checklist/:itemId", resourceController.deleteChecklistItem);

module.exports = topicRouter;
