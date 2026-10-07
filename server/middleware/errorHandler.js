const { ApiError } = require("../utils/errors");

function notFoundHandler(req, res) {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

// One place that turns every thrown error into { message }. Stack traces and
// driver internals never reach the client.
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err instanceof ApiError) {
    return res.status(err.status).json({ message: err.message });
  }

  // Mongoose schema validation
  if (err.name === "ValidationError") {
    const detail = Object.values(err.errors)[0]?.message;

    return res.status(400).json({ message: detail || "Invalid data provided." });
  }

  // Bad ObjectId in a URL
  if (err.name === "CastError") {
    return res.status(400).json({ message: `Invalid ${err.path}!` });
  }

  // Unique index violation (duplicate email, duplicate collection name)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "value";

    return res.status(400).json({ message: `That ${field} is already taken.` });
  }

  console.error(`Unhandled error on ${req.method} ${req.originalUrl}:`, err);

  res.status(500).json({ message: "Something went wrong. Please try again." });
}

module.exports = { notFoundHandler, errorHandler };
