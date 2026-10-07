const express = require("express");

const statsController = require("../controllers/statsController");

const statsRouter = express.Router();

// No authenticateToken here on purpose: the landing page is public.
statsRouter.get("/", statsController.getPublicStats);

module.exports = statsRouter;
