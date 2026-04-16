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
    const { kv: rawKv } = await import("@vercel/kv").catch(() => ({ kv: null }));
    if (rawKv) await (rawKv as { del: (k: string) => Promise<unknown> }).del(key);
  } else {
    memCache.delete(key);
  }
}

// 배포마다 SVG 캐시 키를 바꿔서 구버전 캐시가 자동으로 무효화됨
const DEPLOY_VER = (process.env.VERCEL_GIT_COMMIT_SHA ?? "dev").slice(0, 7);

/** 캐시 키 상수 */
export const KEYS = {
  snapshot: "bssm:snapshot",      // GraphQL 레포 스냅샷 (30분)
  members: "bssm:members",        // 멤버 목록 (1시간)
  activity: "bssm:activity",      // 최근 활동 (5분)
  svg: (endpoint: string, theme: string) => `bssm:svg:v${DEPLOY_VER}:${endpoint}:${theme}`,
} as const;

/** TTL 상수 (초) */
export const TTL = {
  snapshot: 1800,   // 30분 — GraphQL 레포 스냅샷
  members: 3600,    // 1시간
  activity: 300,    // 5분
  // SVG 캐시는 데이터 캐시와 동일하게 맞춤
  banner: 1800,
  stats: 1800,
  category: 1800,
  project: 1800,
} as const;
