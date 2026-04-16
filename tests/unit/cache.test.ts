import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * lib/cache.ts in-memory fallback 테스트.
 * KV 환경변수가 없으면 자동으로 in-memory 경로를 사용한다.
 * 모듈을 매 테스트마다 동적으로 재임포트해서 memCache를 새로 시작한다.
 */

// KV 환경변수가 설정되어 있지 않은지 확인
beforeEach(() => {
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
});

describe('cached() — in-memory fallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
  });

  it('첫 번째 호출은 fetcher를 실행한다', async () => {
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
    const { cached } = await import('../../lib/cache.js');

    const fetcher = vi.fn().mockResolvedValue('value-a');
    const result = await cached('key1', 60, fetcher);

    expect(result).toBe('value-a');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('TTL 이내 두 번째 호출은 fetcher를 재호출하지 않는다', async () => {
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
    const { cached } = await import('../../lib/cache.js');

    const fetcher = vi.fn().mockResolvedValue('cached-value');

    const first = await cached('key2', 60, fetcher);
    expect(first).toBe('cached-value');
    expect(fetcher).toHaveBeenCalledTimes(1);

    // TTL(60s) 이내: 30초 경과
    vi.advanceTimersByTime(30_000);

    const second = await cached('key2', 60, fetcher);
    expect(second).toBe('cached-value');
    expect(fetcher).toHaveBeenCalledTimes(1); // 여전히 1번
  });

  it('TTL 만료 후 fetcher를 다시 호출한다', async () => {
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
    const { cached } = await import('../../lib/cache.js');

    const fetcher = vi.fn()
      .mockResolvedValueOnce('first-value')
      .mockResolvedValueOnce('second-value');

    const first = await cached('key3', 60, fetcher);
    expect(first).toBe('first-value');
    expect(fetcher).toHaveBeenCalledTimes(1);

    // TTL(60s) + 1ms 경과 → 만료
    vi.advanceTimersByTime(61_000);

    const second = await cached('key3', 60, fetcher);
    expect(second).toBe('second-value');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('서로 다른 키는 독립적으로 캐시된다', async () => {
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
    const { cached } = await import('../../lib/cache.js');

    const fetcherA = vi.fn().mockResolvedValue('value-for-a');
    const fetcherB = vi.fn().mockResolvedValue('value-for-b');

    const a = await cached('key-a', 60, fetcherA);
    const b = await cached('key-b', 60, fetcherB);

    expect(a).toBe('value-for-a');
    expect(b).toBe('value-for-b');
    expect(fetcherA).toHaveBeenCalledTimes(1);
    expect(fetcherB).toHaveBeenCalledTimes(1);

    // TTL 이내 재호출
    const a2 = await cached('key-a', 60, fetcherA);
    const b2 = await cached('key-b', 60, fetcherB);
    expect(a2).toBe('value-for-a');
    expect(b2).toBe('value-for-b');
    expect(fetcherA).toHaveBeenCalledTimes(1);
    expect(fetcherB).toHaveBeenCalledTimes(1);
  });

  it('TTL=0이면 즉시 만료되어 항상 fetcher를 호출한다', async () => {
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
    const { cached } = await import('../../lib/cache.js');

    const fetcher = vi.fn()
      .mockResolvedValueOnce('val1')
      .mockResolvedValueOnce('val2');

    const first = await cached('key-ttl0', 0, fetcher);
    expect(first).toBe('val1');

    // 1ms 경과만 해도 만료
    vi.advanceTimersByTime(1);

    const second = await cached('key-ttl0', 0, fetcher);
    expect(second).toBe('val2');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('fetcher가 객체를 반환해도 캐시된다', async () => {
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
    const { cached } = await import('../../lib/cache.js');

    const data = { repoCount: 10, memberCount: 5, totalStars: 100 };
    const fetcher = vi.fn().mockResolvedValue(data);

    const first = await cached('key-obj', 120, fetcher);
    expect(first).toEqual(data);

    vi.advanceTimersByTime(60_000);

    const second = await cached('key-obj', 120, fetcher);
    expect(second).toEqual(data);
    expect(fetcher).toHaveBeenCalledTimes(1); // 캐시 히트
  });

  it('fetcher가 실패하면 에러를 전파한다', async () => {
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
    const { cached } = await import('../../lib/cache.js');

    const fetcher = vi.fn().mockRejectedValue(new Error('fetch failed'));

    await expect(cached('key-err', 60, fetcher)).rejects.toThrow('fetch failed');
  });
});

// ---------------------------------------------------------------------------
// KEYS 상수 검증
// ---------------------------------------------------------------------------

describe('KEYS', () => {
  it('snapshot 키가 올바르다', async () => {
    const { KEYS } = await import('../../lib/cache.js');
    expect(KEYS.snapshot).toBe('bssm:snapshot');
  });

  it('members 키가 올바르다', async () => {
    const { KEYS } = await import('../../lib/cache.js');
    expect(KEYS.members).toBe('bssm:members');
  });

  it('activity 키가 올바르다', async () => {
    const { KEYS } = await import('../../lib/cache.js');
    expect(KEYS.activity).toBe('bssm:activity');
  });

  it('svg(endpoint, theme) 키를 동적으로 생성한다', async () => {
    const { KEYS } = await import('../../lib/cache.js');
    expect(KEYS.svg('banner', 'dark')).toBe('bssm:svg:banner:dark');
    expect(KEYS.svg('stats', 'light')).toBe('bssm:svg:stats:light');
  });
});

// ---------------------------------------------------------------------------
// TTL 상수 검증
// ---------------------------------------------------------------------------

describe('TTL', () => {
  it('TTL 값들이 양수이다', async () => {
    const { TTL } = await import('../../lib/cache.js');
    expect(TTL.banner).toBeGreaterThan(0);
    expect(TTL.stats).toBeGreaterThan(0);
    expect(TTL.members).toBeGreaterThan(0);
    expect(TTL.category).toBeGreaterThan(0);
    expect(TTL.project).toBeGreaterThan(0);
    expect(TTL.activity).toBeGreaterThan(0);
  });

  it('activity TTL이 banner TTL보다 짧다 (자주 갱신)', async () => {
    const { TTL } = await import('../../lib/cache.js');
    expect(TTL.activity).toBeLessThan(TTL.banner);
  });

  it('stats TTL이 members TTL보다 짧다', async () => {
    const { TTL } = await import('../../lib/cache.js');
    expect(TTL.stats).toBeLessThanOrEqual(TTL.members);
  });
});
