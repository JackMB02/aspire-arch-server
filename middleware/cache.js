const NodeCache = require('node-cache');

// Create cache instances with different TTLs
const shortCache = new NodeCache({ 
  stdTTL: 60, // 1 minute for frequently changing data
  checkperiod: 120 
});

const mediumCache = new NodeCache({ 
  stdTTL: 300, // 5 minutes for moderately stable data
  checkperiod: 600 
});

const longCache = new NodeCache({ 
  stdTTL: 1800, // 30 minutes for stable data
  checkperiod: 3600 
});

/**
 * Cache middleware factory
 * @param {Number} duration - Cache duration in seconds
 * @param {Function} keyGenerator - Function to generate cache key from req
 * @returns {Function} Express middleware
 */
const cacheMiddleware = (duration = 300, keyGenerator = null) => {
  const cache = duration <= 60 ? shortCache : duration <= 300 ? mediumCache : longCache;
  
  return (req, res, next) => {
    // Skip caching for authenticated requests (admin operations)
    if (req.headers.authorization) {
      return next();
    }

    // Generate cache key
    const key = keyGenerator ? keyGenerator(req) : `${req.method}:${req.originalUrl}`;
    
    // Check cache
    const cachedData = cache.get(key);
    if (cachedData) {
      console.log(`📦 Cache HIT: ${key}`);
      return res.json(cachedData);
    }

    // Store original res.json
    const originalJson = res.json.bind(res);
    
    // Override res.json to cache the response
    res.json = (body) => {
      // Only cache successful responses
      if (res.statusCode === 200) {
        cache.set(key, body);
        console.log(`💾 Cache SET: ${key} (${duration}s TTL)`);
      }
      return originalJson(body);
    };

    next();
  };
};

/**
 * Auto cache invalidation middleware
 * Clears cache when POST/PUT/DELETE requests succeed
 * @param {String} pattern - Cache key pattern to clear
 * @returns {Function} Express middleware
 */
const autoClearCache = (pattern) => {
  return (req, res, next) => {
    // Only process POST, PUT, DELETE
    if (!['POST', 'PUT', 'DELETE'].includes(req.method)) {
      return next();
    }

    // Store original res.json and res.status
    const originalJson = res.json.bind(res);
    const originalStatus = res.status.bind(res);

    // Track status code
    let statusCode = 200;
    res.status = (code) => {
      statusCode = code;
      return originalStatus(code);
    };

    // Override res.json to clear cache on success
    res.json = (body) => {
      if (statusCode >= 200 && statusCode < 300) {
        clearCachePattern(pattern);
      }
      return originalJson(body);
    };

    next();
  };
};

/**
 * Clear cache by pattern
 * @param {String} pattern - Pattern to match keys (supports wildcards)
 */
const clearCachePattern = (pattern) => {
  const allKeys = [
    ...shortCache.keys(),
    ...mediumCache.keys(),
    ...longCache.keys()
  ];
  
  const regex = new RegExp(pattern.replace(/\*/g, '.*'));
  const matchedKeys = allKeys.filter(key => regex.test(key));
  
  matchedKeys.forEach(key => {
    shortCache.del(key);
    mediumCache.del(key);
    longCache.del(key);
  });
  
  console.log(`🗑️ Cleared ${matchedKeys.length} cache entries matching: ${pattern}`);
  return matchedKeys.length;
};

/**
 * Clear all caches
 */
const clearAllCache = () => {
  const count = shortCache.keys().length + mediumCache.keys().length + longCache.keys().length;
  shortCache.flushAll();
  mediumCache.flushAll();
  longCache.flushAll();
  console.log(`🗑️ Cleared all ${count} cache entries`);
  return count;
};

/**
 * Get cache statistics
 */
const getCacheStats = () => {
  return {
    short: shortCache.getStats(),
    medium: mediumCache.getStats(),
    long: longCache.getStats()
  };
};

module.exports = {
  cacheMiddleware,
  autoClearCache,
  clearCachePattern,
  clearAllCache,
  getCacheStats,
  shortCache,
  mediumCache,
  longCache
};
