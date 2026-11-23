/**
 * High-Performance In-Memory Cache with TTL & Prefix-Based Invalidation
 * Used to cache read-heavy, low-churn catalog and category data.
 */

class MemoryCache {
  constructor() {
    this.store = new Map();
    this.hits = 0;
    this.misses = 0;
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.value;
  }

  set(key, value, ttlSeconds = 300) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    return value;
  }

  del(key) {
    return this.store.delete(key);
  }

  invalidatePrefix(prefix) {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  flush() {
    const size = this.store.size;
    this.store.clear();
    return size;
  }

  getStats() {
    return {
      hits: this.hits,
      misses: this.misses,
      keysCount: this.store.size,
    };
  }
}

export const cache = new MemoryCache();
export default cache;

