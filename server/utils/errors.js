// Errors controllers throw, turned into JSON by the error handler.
class ApiError extends Error {
  constructor(status, message) {
    super(message);

    this.status = status;
  }
}

const badRequest = (message) => new ApiError(400, message);

const notFound = (message = "Not found!") => new ApiError(404, message);

// Wraps an async controller so a rejected promise reaches the error handler
// instead of hanging the request.
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { ApiError, badRequest, notFound, asyncHandler };
