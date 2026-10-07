const express = require("express");

const authController = require("../controllers/authController");
const authenticateToken = require("../middleware/authMiddleware");
const rateLimit = require("../middleware/rateLimit");

const authRouter = express.Router();

// Keyed by address, not by user: the whole point is to slow down someone
// guessing passwords across many accounts.
const credentialLimit = rateLimit({
  name: "auth",
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_ATTEMPTS_PER_15MIN || 20),
  key: (req) => req.ip || "anonymous",
  message: "Too many sign-in attempts. Please wait a few minutes.",
});

authRouter.post("/signup", credentialLimit, authController.signUp);

authRouter.post("/login", credentialLimit, authController.login);

authRouter.get("/me", authenticateToken, authController.getMe);

authRouter.put("/me", authenticateToken, authController.updateProfile);

module.exports = authRouter;
