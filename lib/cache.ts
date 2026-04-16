/**
 * Vercel KV 캐시 래퍼.
 * KV가 없는 환경(로컬 dev)에서는 in-memory fallback 사용.
 */

// Vercel KV는 런타임에 동적 import — 없으면 graceful fallback
type KVClient = {
  get: <T>(key: string) => Promise<T | null>;
  set: (key: string, value: unknown, opts?: { ex: number }) => Promise<unknown>;
};

const memCache = new Map<string, { value: unknown; expiresAt: number }>();

async function getKV(): Promise<KVClient | null> {
  if (
    !process.env.KV_REST_API_URL ||
    !process.env.KV_REST_API_TOKEN
  ) {
    return null; // 로컬 dev: in-memory fallback
  }
  try {
    const { kv } = await import("@vercel/kv");
    return kv as unknown as KVClient;
  } catch {
    return null;
  }
}

export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const kv = await getKV();

  if (kv) {
    const hit = await kv.get<T>(key);
    if (hit !== null) return hit;
    const fresh = await fetcher();
    await kv.set(key, fresh, { ex: ttlSeconds });
    return fresh;
  }

  // in-memory fallback
  const entry = memCache.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    return entry.value as T;
  }
  const fresh = await fetcher();
  memCache.set(key, { value: fresh, expiresAt: Date.now() + ttlSeconds * 1000 });
  return fresh;
}

export async function invalidate(key: string): Promise<void> {
  const kv = await getKV();
  if (kv) {
    // @vercel/kv del은 별도 메서드
    const { kv: rawKv } = await import("@vercel/kv").catch(() => ({ kv: null }));
    if (rawKv) await (rawKv as { del: (k: string) => Promise<unknown> }).del(key);
  } else {
    memCache.delete(key);
  }
}

/** 캐시 키 상수 */
export const KEYS = {
  orgInfo: "bssm:org:info",
  members: "bssm:members",
  activity: "bssm:activity",
  repo: (name: string) => `bssm:repo:${name}`,
  svg: (endpoint: string, theme: string) => `bssm:svg:${endpoint}:${theme}`,
} as const;

/** TTL 상수 (초) */
export const TTL = {
  banner: 3600,      // 1시간
  stats: 900,        // 15분
  members: 3600,     // 1시간
  category: 1800,    // 30분
  project: 900,      // 15분
  activity: 300,     // 5분
} as const;
