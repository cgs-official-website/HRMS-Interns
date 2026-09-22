/**
 * Lightweight, zero-dependency in-memory sliding-window rate limiter
 */

const createRateLimiter = ({ 
  windowMs = 15 * 60 * 1000, 
  max = 20, 
  message = "Too many requests. Please try again later.",
  keyGenerator = null
}) => {
  const hits = new Map();

  // Periodic cleanup of expired entries every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of hits.entries()) {
      const valid = timestamps.filter(t => now - t < windowMs);
      if (valid.length === 0) {
        hits.delete(key);
      } else {
        hits.set(key, valid);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req, res, next) => {
    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || "global";
    const key = keyGenerator ? keyGenerator(req, ip) : ip;
    const now = Date.now();

    let clientHits = hits.get(key) || [];
    clientHits = clientHits.filter(t => now - t < windowMs);

    if (clientHits.length >= max) {
      const retryAfterSec = Math.ceil((clientHits[0] + windowMs - now) / 1000);
      res.setHeader("Retry-After", String(retryAfterSec));
      return res.status(429).json({ error: message });
    }

    clientHits.push(now);
    hits.set(key, clientHits);
    next();
  };
};

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Too many login attempts. Please wait 15 minutes before trying again."
});

export const passwordResetRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 30,
  keyGenerator: (req, ip) => `${ip}_${(req.body?.email || "").toLowerCase().trim()}`,
  message: "Too many password reset requests. Please wait a few moments before requesting again."
});
