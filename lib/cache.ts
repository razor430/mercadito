type Entry<T> = {
  expiresAt: number;
  value: T;
};

const store = new Map<string, Entry<unknown>>();

export async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.expiresAt > now) {
    return hit.value as T;
  }

  const value = await load();
  store.set(key, { value, expiresAt: now + ttlMs });
  return value;
}

export const ttl = {
  live: 45_000,
  macro: 45 * 60_000,
  history: 20 * 60_000,
  news: 8 * 60_000
};
