import { describe, it, expect } from 'vitest';

const BASE_URL = 'https://bssm-oss-badges.vercel.app';

// SVG 유효성 기본 검증
function assertValidSvg(body: string): void {
  expect(body.trim()).toMatch(/^<svg/);
  expect(body.trim()).toMatch(/<\/svg>\s*$/);
  expect(body).toContain('xmlns="http://www.w3.org/2000/svg"');
}

// Content-Type 검증
function assertSvgContentType(contentType: string | null): void {
  expect(contentType).not.toBeNull();
  expect(contentType!.toLowerCase()).toContain('image/svg+xml');
}

// ---------------------------------------------------------------------------
// Banner
// ---------------------------------------------------------------------------

describe('GET /api/banner.svg', () => {
  it('200을 반환하고 유효한 SVG이다', async () => {
    const res = await fetch(`${BASE_URL}/api/banner.svg`);
    expect(res.status).toBe(200);
    assertSvgContentType(res.headers.get('content-type'));
    const body = await res.text();
    assertValidSvg(body);
  });

  it('light 테마에서 200을 반환하고 #ffffff 배경을 포함한다', async () => {
    const res = await fetch(`${BASE_URL}/api/banner.svg?theme=light`);
    expect(res.status).toBe(200);
    const body = await res.text();
    assertValidSvg(body);
    expect(body).toContain('#ffffff');
  });

  it('dark 테마 쿼리를 처리한다', async () => {
    const res = await fetch(`${BASE_URL}/api/banner.svg?theme=dark`);
    expect(res.status).toBe(200);
    const body = await res.text();
    assertValidSvg(body);
    expect(body).toContain('#0a0a0a');
  });

  it('알 수 없는 테마는 dark 기본값으로 처리한다', async () => {
    const res = await fetch(`${BASE_URL}/api/banner.svg?theme=rainbow`);
    expect(res.status).toBe(200);
    const body = await res.text();
    assertValidSvg(body);
  });
});

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

describe('GET /api/stats.svg', () => {
  it('200을 반환하고 유효한 SVG이다', async () => {
    const res = await fetch(`${BASE_URL}/api/stats.svg`);
    expect(res.status).toBe(200);
    assertSvgContentType(res.headers.get('content-type'));
    const body = await res.text();
    assertValidSvg(body);
  });

  it('light 테마에서 동작한다', async () => {
    const res = await fetch(`${BASE_URL}/api/stats.svg?theme=light`);
    expect(res.status).toBe(200);
    const body = await res.text();
    assertValidSvg(body);
    expect(body).toContain('#ffffff');
  });
});

// ---------------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------------

describe('GET /api/members.svg', () => {
  it('200을 반환하고 유효한 SVG이다', async () => {
    const res = await fetch(`${BASE_URL}/api/members.svg`);
    expect(res.status).toBe(200);
    assertSvgContentType(res.headers.get('content-type'));
    const body = await res.text();
    assertValidSvg(body);
  });

  it('clipPath 요소를 포함한다 (원형 아바타)', async () => {
    const res = await fetch(`${BASE_URL}/api/members.svg`);
    const body = await res.text();
    expect(body).toContain('clipPath');
  });
});

// ---------------------------------------------------------------------------
// Activity
// ---------------------------------------------------------------------------

describe('GET /api/activity.svg', () => {
  it('200을 반환하고 유효한 SVG이다', async () => {
    const res = await fetch(`${BASE_URL}/api/activity.svg`);
    expect(res.status).toBe(200);
    assertSvgContentType(res.headers.get('content-type'));
    const body = await res.text();
    assertValidSvg(body);
  });

  it('light 테마에서 동작한다', async () => {
    const res = await fetch(`${BASE_URL}/api/activity.svg?theme=light`);
    expect(res.status).toBe(200);
    const body = await res.text();
    assertValidSvg(body);
  });
});

// ---------------------------------------------------------------------------
// Project
// ---------------------------------------------------------------------------

describe('GET /api/project/CodeAgora.svg', () => {
  it('200을 반환하고 유효한 SVG이다', async () => {
    const res = await fetch(`${BASE_URL}/api/project/CodeAgora.svg`);
    expect(res.status).toBe(200);
    assertSvgContentType(res.headers.get('content-type'));
    const body = await res.text();
    assertValidSvg(body);
  });

  it('"CodeAgora"를 SVG 본문에 포함한다', async () => {
    const res = await fetch(`${BASE_URL}/api/project/CodeAgora.svg`);
    const body = await res.text();
    expect(body).toContain('CodeAgora');
  });

  it('compact=true 모드에서 동작한다', async () => {
    const res = await fetch(`${BASE_URL}/api/project/CodeAgora.svg?compact=true`);
    expect(res.status).toBe(200);
    const body = await res.text();
    assertValidSvg(body);
  });

  it('light 테마에서 동작한다', async () => {
    const res = await fetch(`${BASE_URL}/api/project/CodeAgora.svg?theme=light`);
    expect(res.status).toBe(200);
    const body = await res.text();
    assertValidSvg(body);
    expect(body).toContain('#ffffff');
  });
});

// ---------------------------------------------------------------------------
// Category
// ---------------------------------------------------------------------------

describe('GET /api/category/ai.svg', () => {
  it('200을 반환하고 유효한 SVG이다', async () => {
    const res = await fetch(`${BASE_URL}/api/category/ai.svg`);
    expect(res.status).toBe(200);
    assertSvgContentType(res.headers.get('content-type'));
    const body = await res.text();
    assertValidSvg(body);
  });

  it('light 테마에서 동작한다', async () => {
    const res = await fetch(`${BASE_URL}/api/category/ai.svg?theme=light`);
    expect(res.status).toBe(200);
    const body = await res.text();
    assertValidSvg(body);
  });
});

describe('GET /api/category/apps.svg', () => {
  it('200을 반환하고 유효한 SVG이다', async () => {
    const res = await fetch(`${BASE_URL}/api/category/apps.svg`);
    expect(res.status).toBe(200);
    assertSvgContentType(res.headers.get('content-type'));
    const body = await res.text();
    assertValidSvg(body);
  });
});

// ---------------------------------------------------------------------------
// 보안: 잘못된 입력 거부
// ---------------------------------------------------------------------------

describe('보안 — 잘못된 입력 거부', () => {
  it('XSS 스크립트 태그를 포함한 레포 이름은 400을 반환한다', async () => {
    const malicious = encodeURIComponent('<script>alert(1)</script>');
    const res = await fetch(`${BASE_URL}/api/project/${malicious}.svg`);
    // 400 또는 404를 반환해야 함 (절대 200+XSS 실행 SVG면 안됨)
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it('path traversal 시도는 404를 반환한다', async () => {
    const traversal = encodeURIComponent('../../etc/passwd');
    const res = await fetch(`${BASE_URL}/api/category/${traversal}.svg`);
    expect(res.status).toBe(404);
  });

  it('알 수 없는 카테고리는 404를 반환한다', async () => {
    const res = await fetch(`${BASE_URL}/api/category/nonexistent-category.svg`);
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// 존재하지 않는 레포
// ---------------------------------------------------------------------------

describe('GET /api/project/nonexistent-repo-xyz-123.svg', () => {
  it('응답은 있어야 하며 crash 없이 처리된다', async () => {
    const res = await fetch(`${BASE_URL}/api/project/nonexistent-repo-xyz-123.svg`);
    // 500 이거나 에러 SVG여야 함, 응답 없음(network error)은 안됨
    expect(res.status).toBeGreaterThanOrEqual(400);
    // body가 있어야 함
    const body = await res.text();
    expect(body.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 응답 헤더 검증
// ---------------------------------------------------------------------------

describe('응답 헤더', () => {
  it('banner.svg — Content-Type이 image/svg+xml이다', async () => {
    const res = await fetch(`${BASE_URL}/api/banner.svg`);
    assertSvgContentType(res.headers.get('content-type'));
  });

  it('stats.svg — Content-Type이 image/svg+xml이다', async () => {
    const res = await fetch(`${BASE_URL}/api/stats.svg`);
    assertSvgContentType(res.headers.get('content-type'));
  });

  it('members.svg — Content-Type이 image/svg+xml이다', async () => {
    const res = await fetch(`${BASE_URL}/api/members.svg`);
    assertSvgContentType(res.headers.get('content-type'));
  });

  it('activity.svg — Content-Type이 image/svg+xml이다', async () => {
    const res = await fetch(`${BASE_URL}/api/activity.svg`);
    assertSvgContentType(res.headers.get('content-type'));
  });
});
