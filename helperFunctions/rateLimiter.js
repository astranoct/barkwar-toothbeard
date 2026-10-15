/**
 * Simple in-memory sliding-window rate limiter.
 * Allows `max` actions per `windowMs` for each key (e.g. a Discord user id).
 * State is per process, which is fine for a single bot instance.
 *
 * @param {{max: number, windowMs: number, now?: () => number}} options
 * @returns {(key: string) => number} Call once per action. Returns 0 if allowed,
 *   otherwise the number of seconds until the caller may try again.
 */
function createRateLimiter({ max, windowMs, now = Date.now }) {
  const hits = new Map(); // key -> timestamps of recent allowed actions

  return function check(key) {
    const time = now();
    const recent = (hits.get(key) || []).filter((t) => time - t < windowMs);

    if (recent.length >= max) {
      hits.set(key, recent);
      return Math.ceil((recent[0] + windowMs - time) / 1000);
    }

    recent.push(time);
    hits.set(key, recent);

    // Occasionally drop keys that have gone quiet so the map can't grow forever
    if (hits.size > 1000) {
      for (const [k, times] of hits) {
        if (times.every((t) => time - t >= windowMs)) hits.delete(k);
      }
    }
    return 0;
  };
}

module.exports = {
  createRateLimiter,
};
