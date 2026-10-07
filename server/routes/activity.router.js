const express = require("express");

const activityController = require("../controllers/activityController");
const authenticateToken = require("../middleware/authMiddleware");

const activityRouter = express.Router();

activityRouter.use(authenticateToken);

activityRouter.get("/", activityController.listActivities);

module.exports = activityRouter;
