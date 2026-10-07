/**
 * A small sliding-window rate limiter.
 *
 * Counts are held in memory, which suits a single server process: they reset
 * if the process restarts, and they are not shared across instances. That is
 * fine for protecting one box and its IP reputation. If this is ever scaled to
 * several instances, move the store to Mongo or Redis.
 */

const buckets = new Map();

// Drop idle buckets so the map cannot grow without bound.
const SWEEP_EVERY_MS = 10 * 60 * 1000;

const sweeper = setInterval(() => {
  const now = Date.now();

  for (const [key, entry] of buckets) {
    if (entry.hits.length === 0 || now - entry.hits[entry.hits.length - 1] > entry.windowMs) {
      buckets.delete(key);
    }
  }
}, SWEEP_EVERY_MS);

// Never hold the event loop open just for the sweeper.
sweeper.unref?.();

// Default identity: the signed-in user, falling back to the caller's address.
const defaultKey = (req) => req.user?.id || req.ip || "anonymous";

function rateLimit({
  windowMs,
  max,
  name = "rl",
  key = defaultKey,
  message = "Too many requests. Please slow down.",
}) {
  return function rateLimitMiddleware(req, res, next) {
    const id = `${name}:${key(req)}`;

    const now = Date.now();

    const entry = buckets.get(id) || { hits: [], windowMs };

    // Sliding window: forget anything older than the window.
    entry.hits = entry.hits.filter((time) => now - time < windowMs);

    entry.windowMs = windowMs;

    const remaining = Math.max(0, max - entry.hits.length - 1);

    // Several limiters can guard one route. The header should report the
    // tightest of them, not whichever ran last.
    const reported = res.getHeader("X-RateLimit-Remaining");

    if (reported === undefined || remaining < Number(reported)) {
      res.setHeader("X-RateLimit-Limit", max);

      res.setHeader("X-RateLimit-Remaining", remaining);
    }

    if (entry.hits.length >= max) {
      const oldest = entry.hits[0];

      const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));

      buckets.set(id, entry);

      res.setHeader("Retry-After", retryAfterSec);

      res.setHeader("X-RateLimit-Limit", max);

      res.setHeader("X-RateLimit-Remaining", 0);

      res.setHeader("X-RateLimit-Reset", Math.ceil((now + retryAfterSec * 1000) / 1000));

      return res.status(429).json({
        message,
        retryAfterSeconds: retryAfterSec,
      });
    }

    entry.hits.push(now);

    buckets.set(id, entry);

    next();
  };
}

// Exposed for tests, so one case cannot leak counts into the next.
rateLimit.reset = () => buckets.clear();

module.exports = rateLimit;
