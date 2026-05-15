/**
 * Simple in-memory client-side cache with TTL.
 * Lives for the browser session — cleared on hard refresh.
 * Eliminates redundant API calls when navigating back to visited pages.
 */

const cache = new Map<string, { data: unknown; ts: number }>();
const DEFAULT_TTL = 60_000; // 60 seconds

export function getCached<T>(key: string, ttl = DEFAULT_TTL): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() - entry.ts > ttl) return null;
  return entry.data as T;
}

export function setCached(key: string, data: unknown): void {
  cache.set(key, { data, ts: Date.now() });
}

/** Remove one or more exact keys. Call after mutations (create/update/delete). */
export function invalidateCache(...keys: string[]): void {
  keys.forEach((k) => cache.delete(k));
}

/** Remove all keys that start with a given prefix (e.g. "subject:abc123"). */
export function invalidateCachePrefix(prefix: string): void {
  for (const k of cache.keys()) {
    if (k.startsWith(prefix)) cache.delete(k);
  }
}
