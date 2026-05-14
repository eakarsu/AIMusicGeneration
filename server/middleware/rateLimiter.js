// Simple in-memory rate limiter: max 20 AI requests per user per minute
const requestCounts = new Map();

function rateLimiter(req, res, next) {
  const userId = req.user ? req.user.id : req.ip;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 20;

  if (!requestCounts.has(userId)) {
    requestCounts.set(userId, []);
  }

  const timestamps = requestCounts.get(userId).filter(t => now - t < windowMs);
  timestamps.push(now);
  requestCounts.set(userId, timestamps);

  if (timestamps.length > maxRequests) {
    return res.status(429).json({
      error: 'Too many AI requests. Please wait a minute before trying again.',
      retryAfter: Math.ceil(windowMs / 1000)
    });
  }

  next();
}

module.exports = { rateLimiter };
