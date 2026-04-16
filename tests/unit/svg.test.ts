import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  escape,
  relativeTime,
  truncate,
  text,
  rect,
  svgRoot,
} from '../../lib/svg/primitives.js';
import { getTheme, langColor, THEMES, LANGUAGE_COLORS } from '../../lib/svg/theme.js';
import { renderBanner } from '../../lib/svg/layouts/banner.js';
import { renderStats } from '../../lib/svg/layouts/stats.js';
import { renderProject } from '../../lib/svg/layouts/project.js';
import { renderCategory } from '../../lib/svg/layouts/category.js';
import { renderActivity } from '../../lib/svg/layouts/activity.js';
import { renderMembers } from '../../lib/svg/layouts/members.js';
import type { OrgInfo, RepoInfo, MemberInfo, ActivityEvent } from '../../lib/types.js';
import type { CategoryDef } from '../../lib/data/categories.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockOrgInfo: OrgInfo = {
  repoCount: 42,
  memberCount: 15,
  totalStars: 1234,
};

const mockRepo: RepoInfo = {
  name: 'CodeAgora',
  description: 'A collaborative coding platform for teams',
  language: 'TypeScript',
  languageColor: '#3178c6',
  stars: 88,
  updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
  htmlUrl: 'https://github.com/bssm-oss/CodeAgora',
};

const mockRepoNoStars: RepoInfo = {
  name: 'test-repo',
  description: null,
  language: null,
  languageColor: null,
  stars: 0,
  updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5m ago
  htmlUrl: 'https://github.com/bssm-oss/test-repo',
};

const mockRepoLongDesc: RepoInfo = {
  name: 'long-desc-repo',
  description: 'This is a very long description that exceeds the maximum character limit for SVG rendering and should be truncated with an ellipsis',
  language: 'JavaScript',
  languageColor: '#f7df1e',
  stars: 10,
  updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3d ago
  htmlUrl: 'https://github.com/bssm-oss/long-desc-repo',
};

const mockMembers: MemberInfo[] = [
  {
    login: 'alice',
    avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
    htmlUrl: 'https://github.com/alice',
  },
  {
    login: 'bob',
    avatarUrl: 'https://avatars.githubusercontent.com/u/2?v=4',
    htmlUrl: 'https://github.com/bob',
  },
  {
    login: 'charlie',
    avatarUrl: 'https://avatars.githubusercontent.com/u/3?v=4',
    htmlUrl: 'https://github.com/charlie',
  },
];

const mockMembersMany: MemberInfo[] = Array.from({ length: 12 }, (_, i) => ({
  login: `user${i}`,
  avatarUrl: `https://avatars.githubusercontent.com/u/${i + 10}?v=4`,
  htmlUrl: `https://github.com/user${i}`,
}));

const mockCategory: CategoryDef = {
  label: 'AI · Agent · Workflow',
  emoji: '🤖',
  repos: ['CodeAgora', 'cotor'],
};

const mockCategoryRepos: RepoInfo[] = [
  mockRepo,
  {
    name: 'cotor',
    description: 'AI-powered commit tool',
    language: 'Go',
    languageColor: '#00add8',
    stars: 25,
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    htmlUrl: 'https://github.com/bssm-oss/cotor',
  },
];

const mockActivityEvents: ActivityEvent[] = [
  {
    repo: 'CodeAgora',
    message: 'feat: add real-time collaboration',
    author: 'alice',
    authorAvatar: 'https://avatars.githubusercontent.com/u/1?v=4',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30m ago
  },
  {
    repo: 'cotor',
    message: 'fix: handle empty commit messages',
    author: 'bob',
    authorAvatar: 'https://avatars.githubusercontent.com/u/2?v=4',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
  },
];

// ---------------------------------------------------------------------------
// escape()
// ---------------------------------------------------------------------------

describe('escape()', () => {
  it('빈 문자열을 그대로 반환한다', () => {
    expect(escape('')).toBe('');
  });

  it('& 를 &amp; 로 이스케이프한다', () => {
    expect(escape('a & b')).toBe('a &amp; b');
  });

  it('< 를 &lt; 로 이스케이프한다', () => {
    expect(escape('<script>')).toBe('&lt;script&gt;');
  });

  it('> 를 &gt; 로 이스케이프한다', () => {
    expect(escape('1 > 0')).toBe('1 &gt; 0');
  });

  it('" 를 &quot; 로 이스케이프한다', () => {
    expect(escape('"quoted"')).toBe('&quot;quoted&quot;');
  });

  it("' 를 &#39; 로 이스케이프한다", () => {
    expect(escape("it's")).toBe("it&#39;s");
  });

  it('모든 XSS 문자를 동시에 이스케이프한다', () => {
    const input = `<script>alert("XSS & 'attack'");</script>`;
    const result = escape(input);
    expect(result).toContain('&lt;script&gt;');
    expect(result).toContain('&amp;');
    expect(result).toContain('&quot;');
    expect(result).toContain('&#39;');
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
    expect(result).not.toContain('"');
    expect(result).not.toContain("'");
    expect(result).not.toContain('&amp;amp;'); // 이중 이스케이프 없어야 함
  });

  it('이스케이프 불필요한 문자는 그대로 유지한다', () => {
    expect(escape('hello world 123')).toBe('hello world 123');
  });
});

// ---------------------------------------------------------------------------
// relativeTime()
// ---------------------------------------------------------------------------

describe('relativeTime()', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('분 단위 시간을 반환한다', () => {
    const ts = new Date('2025-01-01T11:45:00Z').toISOString(); // 15m ago
    expect(relativeTime(ts)).toBe('15m ago');
  });

  it('1분 전을 반환한다', () => {
    const ts = new Date('2025-01-01T11:59:00Z').toISOString(); // 1m ago
    expect(relativeTime(ts)).toBe('1m ago');
  });

  it('시간 단위 시간을 반환한다', () => {
    const ts = new Date('2025-01-01T09:00:00Z').toISOString(); // 3h ago
    expect(relativeTime(ts)).toBe('3h ago');
  });

  it('일 단위 시간을 반환한다', () => {
    const ts = new Date('2024-12-29T12:00:00Z').toISOString(); // 3d ago
    expect(relativeTime(ts)).toBe('3d ago');
  });

  it('월 단위 시간을 반환한다', () => {
    const ts = new Date('2024-10-01T12:00:00Z').toISOString(); // ~3mo ago
    expect(relativeTime(ts)).toBe('3mo ago');
  });

  it('23시간 59분은 시간 단위로 표시된다', () => {
    const ts = new Date('2024-12-31T12:01:00Z').toISOString(); // ~23h ago
    expect(relativeTime(ts)).toMatch(/^\d+h ago$/);
  });

  it('29일은 일 단위로 표시된다', () => {
    const ts = new Date('2024-12-03T12:00:00Z').toISOString(); // 29d ago
    expect(relativeTime(ts)).toBe('29d ago');
  });
});

// ---------------------------------------------------------------------------
// truncate()
// ---------------------------------------------------------------------------

describe('truncate()', () => {
  it('한계 이하의 문자열은 그대로 반환한다', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('한계와 정확히 같은 길이는 그대로 반환한다', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });

  it('한계를 초과하면 줄임표를 추가한다', () => {
    const result = truncate('hello world', 8);
    expect(result).toBe('hello w…');
    expect(result.length).toBe(8);
  });

  it('빈 문자열을 처리한다', () => {
    expect(truncate('', 5)).toBe('');
  });

  it('maxChars=1일 때 단일 문자 반환', () => {
    const result = truncate('hello', 1);
    expect(result).toBe('…');
  });

  it('긴 설명을 올바르게 자른다', () => {
    const longStr = 'A'.repeat(100);
    const result = truncate(longStr, 52);
    expect(result.length).toBe(52);
    expect(result.endsWith('…')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getTheme()
// ---------------------------------------------------------------------------

describe('getTheme()', () => {
  it('"dark"을 입력하면 "dark"를 반환한다', () => {
    expect(getTheme('dark')).toBe('dark');
  });

  it('"light"을 입력하면 "light"를 반환한다', () => {
    expect(getTheme('light')).toBe('light');
  });

  it('알 수 없는 문자열이면 "dark"를 반환한다', () => {
    expect(getTheme('unknown')).toBe('dark');
  });

  it('undefined이면 "dark"를 반환한다', () => {
    expect(getTheme(undefined)).toBe('dark');
  });

  it('null이면 "dark"를 반환한다', () => {
    expect(getTheme(null)).toBe('dark');
  });

  it('숫자이면 "dark"를 반환한다', () => {
    expect(getTheme(1)).toBe('dark');
  });

  it('빈 문자열이면 "dark"를 반환한다', () => {
    expect(getTheme('')).toBe('dark');
  });
});

// ---------------------------------------------------------------------------
// langColor()
// ---------------------------------------------------------------------------

describe('langColor()', () => {
  it('TypeScript에 대해 올바른 hex를 반환한다', () => {
    expect(langColor('TypeScript')).toBe('#3178c6');
  });

  it('JavaScript에 대해 올바른 hex를 반환한다', () => {
    expect(langColor('JavaScript')).toBe('#f7df1e');
  });

  it('Go에 대해 올바른 hex를 반환한다', () => {
    expect(langColor('Go')).toBe('#00add8');
  });

  it('알 수 없는 언어는 fallback (#8b8b8b)을 반환한다', () => {
    expect(langColor('Brainfuck')).toBe('#8b8b8b');
  });

  it('null은 fallback (#8b8b8b)을 반환한다', () => {
    expect(langColor(null)).toBe('#8b8b8b');
  });

  it('LANGUAGE_COLORS의 모든 언어를 올바르게 반환한다', () => {
    for (const [lang, color] of Object.entries(LANGUAGE_COLORS)) {
      expect(langColor(lang)).toBe(color);
    }
  });
});

// ---------------------------------------------------------------------------
// renderBanner()
// ---------------------------------------------------------------------------

describe('renderBanner()', () => {
  it('유효한 SVG 문자열을 반환한다', () => {
    const svg = renderBanner(mockOrgInfo, 'dark');
    expect(svg).toMatch(/^<svg/);
    expect(svg).toContain('</svg>');
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it('레포 수를 포함한다', () => {
    const svg = renderBanner(mockOrgInfo, 'dark');
    expect(svg).toContain('42');
  });

  it('멤버 수를 포함한다', () => {
    const svg = renderBanner(mockOrgInfo, 'dark');
    expect(svg).toContain('15');
  });

  it('스타 수를 포함한다', () => {
    const svg = renderBanner(mockOrgInfo, 'dark');
    expect(svg).toContain('1234');
  });

  it('조직명 BSSM OSS를 포함한다', () => {
    const svg = renderBanner(mockOrgInfo, 'dark');
    expect(svg).toContain('BSSM OSS');
  });

  it('dark 테마에서 dark 배경색을 사용한다', () => {
    const svg = renderBanner(mockOrgInfo, 'dark');
    expect(svg).toContain(THEMES.dark.bg);
  });

  it('light 테마에서 light 배경색 #ffffff를 사용한다', () => {
    const svg = renderBanner(mockOrgInfo, 'light');
    expect(svg).toContain('#ffffff');
  });

  it('light 테마에서 유효한 SVG를 반환한다', () => {
    const svg = renderBanner(mockOrgInfo, 'light');
    expect(svg).toMatch(/^<svg/);
    expect(svg).toContain('</svg>');
  });

  it('width=1200, height=300', () => {
    const svg = renderBanner(mockOrgInfo, 'dark');
    expect(svg).toContain('width="1200"');
    expect(svg).toContain('height="300"');
  });

  it('스냅샷과 일치한다', () => {
    const svg = renderBanner(mockOrgInfo, 'dark');
    expect(svg).toMatchSnapshot();
  });

  it('light 스냅샷과 일치한다', () => {
    const svg = renderBanner(mockOrgInfo, 'light');
    expect(svg).toMatchSnapshot();
  });
});

// ---------------------------------------------------------------------------
// renderStats()
// ---------------------------------------------------------------------------

describe('renderStats()', () => {
  it('유효한 SVG 문자열을 반환한다', () => {
    const svg = renderStats(mockOrgInfo, 'dark');
    expect(svg).toMatch(/^<svg/);
    expect(svg).toContain('</svg>');
  });

  it('4개 통계 카드 레이블을 포함한다', () => {
    const svg = renderStats(mockOrgInfo, 'dark');
    expect(svg).toContain('Repos');
    expect(svg).toContain('Members');
    expect(svg).toContain('Stars');
    expect(svg).toContain('Projects');
  });

  it('레포 수 값을 포함한다', () => {
    const svg = renderStats(mockOrgInfo, 'dark');
    expect(svg).toContain('42');
  });

  it('멤버 수 값을 포함한다', () => {
    const svg = renderStats(mockOrgInfo, 'dark');
    expect(svg).toContain('15');
  });

  it('스타 수 값을 포함한다', () => {
    const svg = renderStats(mockOrgInfo, 'dark');
    expect(svg).toContain('1234');
  });

  it('Projects 카드에 76을 표시한다', () => {
    const svg = renderStats(mockOrgInfo, 'dark');
    expect(svg).toContain('76');
  });

  it('light 테마에서도 유효한 SVG를 반환한다', () => {
    const svg = renderStats(mockOrgInfo, 'light');
    expect(svg).toMatch(/^<svg/);
    expect(svg).toContain('</svg>');
    expect(svg).toContain(THEMES.light.bg);
  });

  it('width=800, height=160', () => {
    const svg = renderStats(mockOrgInfo, 'dark');
    expect(svg).toContain('width="800"');
    expect(svg).toContain('height="160"');
  });

  it('스냅샷과 일치한다', () => {
    const svg = renderStats(mockOrgInfo, 'dark');
    expect(svg).toMatchSnapshot();
  });
});

// ---------------------------------------------------------------------------
// renderProject()
// ---------------------------------------------------------------------------

describe('renderProject()', () => {
  it('기본 모드에서 유효한 SVG를 반환한다', () => {
    const svg = renderProject(mockRepo, 'dark');
    expect(svg).toMatch(/^<svg/);
    expect(svg).toContain('</svg>');
  });

  it('레포 이름을 포함한다', () => {
    const svg = renderProject(mockRepo, 'dark');
    expect(svg).toContain('CodeAgora');
  });

  it('스타 수가 0보다 클 때 표시한다', () => {
    const svg = renderProject(mockRepo, 'dark');
    expect(svg).toContain('88');
  });

  it('스타 수가 0이면 표시하지 않는다', () => {
    const svg = renderProject(mockRepoNoStars, 'dark');
    // stars가 0이면 별 표시가 없어야 함
    expect(svg).not.toContain('⭐ 0');
  });

  it('설명이 있으면 표시한다', () => {
    const svg = renderProject(mockRepo, 'dark');
    expect(svg).toContain('A collaborative coding platform');
  });

  it('긴 설명은 truncate된다', () => {
    const svg = renderProject(mockRepoLongDesc, 'dark');
    expect(svg).toContain('…');
    expect(svg).not.toContain(mockRepoLongDesc.description);
  });

  it('description이 null이면 "No description"을 표시한다', () => {
    const svg = renderProject(mockRepoNoStars, 'dark');
    expect(svg).toContain('No description');
  });

  it('언어 색상 점을 포함한다 (TypeScript)', () => {
    const svg = renderProject(mockRepo, 'dark');
    expect(svg).toContain('#3178c6'); // TypeScript color
  });

  it('height=160 (기본 모드)', () => {
    const svg = renderProject(mockRepo, 'dark');
    expect(svg).toContain('height="160"');
  });

  it('compact 모드에서 height=80', () => {
    const svg = renderProject(mockRepo, 'dark', true);
    expect(svg).toContain('height="80"');
  });

  it('compact 모드에서 레포 이름을 포함한다', () => {
    const svg = renderProject(mockRepo, 'dark', true);
    expect(svg).toContain('CodeAgora');
  });

  it('compact 모드에서 스타 수를 표시한다', () => {
    const svg = renderProject(mockRepo, 'dark', true);
    expect(svg).toContain('88');
  });

  it('compact 모드에서 유효한 SVG를 반환한다', () => {
    const svg = renderProject(mockRepo, 'dark', true);
    expect(svg).toMatch(/^<svg/);
    expect(svg).toContain('</svg>');
  });

  it('light 테마에서 유효한 SVG를 반환한다', () => {
    const svg = renderProject(mockRepo, 'light');
    expect(svg).toMatch(/^<svg/);
    expect(svg).toContain('</svg>');
  });

  it('기본 모드 스냅샷과 일치한다', () => {
    // relativeTime이 시간에 의존하므로 fake timer 불필요 - 스냅샷 갱신으로 처리
    const svg = renderProject(mockRepo, 'dark');
    expect(svg).toMatchSnapshot();
  });

  it('compact 모드 스냅샷과 일치한다', () => {
    const svg = renderProject(mockRepo, 'dark', true);
    expect(svg).toMatchSnapshot();
  });
});

// ---------------------------------------------------------------------------
// renderCategory()
// ---------------------------------------------------------------------------

describe('renderCategory()', () => {
  it('유효한 SVG를 반환한다', () => {
    const svg = renderCategory(mockCategory, mockCategoryRepos, 'dark');
    expect(svg).toMatch(/^<svg/);
    expect(svg).toContain('</svg>');
  });

  it('각 레포 행을 렌더링한다', () => {
    const svg = renderCategory(mockCategory, mockCategoryRepos, 'dark');
    expect(svg).toContain('CodeAgora');
    expect(svg).toContain('cotor');
  });

  it('언어 색상 점을 포함한다', () => {
    const svg = renderCategory(mockCategory, mockCategoryRepos, 'dark');
    expect(svg).toContain('#3178c6'); // TypeScript
    expect(svg).toContain('#00add8'); // Go
  });

  it('레포 설명을 포함한다', () => {
    const svg = renderCategory(mockCategory, mockCategoryRepos, 'dark');
    expect(svg).toContain('A collaborative coding platform');
    expect(svg).toContain('AI-powered commit tool');
  });

  it('스타 수를 포함한다', () => {
    const svg = renderCategory(mockCategory, mockCategoryRepos, 'dark');
    expect(svg).toContain('88');
    expect(svg).toContain('25');
  });

  it('레포 수에 따라 height가 결정된다', () => {
    const svg1 = renderCategory(mockCategory, [mockRepo], 'dark');
    const svg2 = renderCategory(mockCategory, mockCategoryRepos, 'dark');
    // 2개 레포는 1개보다 높이가 더 커야 함
    const h1 = parseInt(svg1.match(/height="(\d+)"/)?.[1] ?? '0');
    const h2 = parseInt(svg2.match(/height="(\d+)"/)?.[1] ?? '0');
    expect(h2).toBeGreaterThan(h1);
  });

  it('light 테마에서 유효한 SVG를 반환한다', () => {
    const svg = renderCategory(mockCategory, mockCategoryRepos, 'light');
    expect(svg).toMatch(/^<svg/);
    expect(svg).toContain('#ffffff');
  });

  it('빈 레포 목록으로도 SVG를 반환한다', () => {
    const svg = renderCategory(mockCategory, [], 'dark');
    expect(svg).toMatch(/^<svg/);
    expect(svg).toContain('</svg>');
  });

  it('스냅샷과 일치한다', () => {
    const svg = renderCategory(mockCategory, mockCategoryRepos, 'dark');
    expect(svg).toMatchSnapshot();
  });
});

// ---------------------------------------------------------------------------
// renderActivity()
// ---------------------------------------------------------------------------

describe('renderActivity()', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const fixedEvents: ActivityEvent[] = [
    {
      repo: 'CodeAgora',
      message: 'feat: add real-time collaboration',
      author: 'alice',
      authorAvatar: 'https://avatars.githubusercontent.com/u/1?v=4',
      timestamp: new Date('2025-01-01T11:30:00Z').toISOString(), // 30m ago
    },
    {
      repo: 'cotor',
      message: 'fix: handle empty commit messages',
      author: 'bob',
      authorAvatar: 'https://avatars.githubusercontent.com/u/2?v=4',
      timestamp: new Date('2025-01-01T10:00:00Z').toISOString(), // 2h ago
    },
  ];

  it('유효한 SVG를 반환한다', () => {
    const svg = renderActivity(fixedEvents, 'dark');
    expect(svg).toMatch(/^<svg/);
    expect(svg).toContain('</svg>');
  });

  it('이벤트 행을 렌더링한다', () => {
    const svg = renderActivity(fixedEvents, 'dark');
    expect(svg).toContain('CodeAgora');
    expect(svg).toContain('cotor');
    expect(svg).toContain('alice');
    expect(svg).toContain('bob');
  });

  it('커밋 메시지를 포함한다', () => {
    const svg = renderActivity(fixedEvents, 'dark');
    expect(svg).toContain('feat: add real-time collaboration');
    expect(svg).toContain('fix: handle empty commit messages');
  });

  it('상대 시간을 포함한다', () => {
    const svg = renderActivity(fixedEvents, 'dark');
    expect(svg).toContain('30m ago');
    expect(svg).toContain('2h ago');
  });

  it('헤더 "Recent Activity"를 포함한다', () => {
    const svg = renderActivity(fixedEvents, 'dark');
    expect(svg).toContain('Recent Activity');
  });

  it('clipPath로 원형 아바타 크롭을 포함한다', () => {
    const svg = renderActivity(fixedEvents, 'dark');
    expect(svg).toContain('clipPath');
    expect(svg).toContain('clip-path');
  });

  it('GitHub avatars.githubusercontent.com URL을 사용한다', () => {
    const svg = renderActivity(fixedEvents, 'dark');
    expect(svg).toContain('https://avatars.githubusercontent.com/u/1?v=4');
  });

  it('긴 커밋 메시지는 80자로 truncate된다', () => {
    const longMsgEvent: ActivityEvent[] = [{
      repo: 'test',
      message: 'a'.repeat(100),
      author: 'user',
      authorAvatar: 'https://avatars.githubusercontent.com/u/99?v=4',
      timestamp: new Date('2025-01-01T11:00:00Z').toISOString(),
    }];
    const svg = renderActivity(longMsgEvent, 'dark');
    expect(svg).toContain('…');
  });

  it('light 테마에서 유효한 SVG를 반환한다', () => {
    const svg = renderActivity(fixedEvents, 'light');
    expect(svg).toMatch(/^<svg/);
    expect(svg).toContain(THEMES.light.bg);
  });

  it('스냅샷과 일치한다', () => {
    const svg = renderActivity(fixedEvents, 'dark');
    expect(svg).toMatchSnapshot();
  });
});

// ---------------------------------------------------------------------------
// renderMembers()
// ---------------------------------------------------------------------------

describe('renderMembers()', () => {
  it('유효한 SVG를 반환한다', () => {
    const svg = renderMembers(mockMembers, 'dark');
    expect(svg).toMatch(/^<svg/);
    expect(svg).toContain('</svg>');
  });

  it('멤버 로그인 이름을 포함한다', () => {
    const svg = renderMembers(mockMembers, 'dark');
    expect(svg).toContain('alice');
    expect(svg).toContain('bob');
    expect(svg).toContain('charlie');
  });

  it('clipPath로 원형 아바타 크롭을 포함한다', () => {
    const svg = renderMembers(mockMembers, 'dark');
    expect(svg).toContain('clipPath');
    expect(svg).toContain('clip-path');
  });

  it('GitHub 아바타 URL을 사용한다', () => {
    const svg = renderMembers(mockMembers, 'dark');
    expect(svg).toContain('https://avatars.githubusercontent.com/u/1?v=4');
  });

  it('멤버 login이 SVG에 포함된다', () => {
    const svg = renderMembers(mockMembers, 'dark');
    expect(svg).toContain('alice');
    expect(svg).toContain('bob');
  });

  it('단일 멤버도 정상 렌더링된다', () => {
    const svg = renderMembers([{ login: 'solo', avatarUrl: 'https://avatars.githubusercontent.com/u/99?v=4', htmlUrl: 'https://github.com/solo' }], 'dark');
    expect(svg).toContain('solo');
  });

  it('9명을 초과하는 목록은 9명만 렌더링한다', () => {
    const svg = renderMembers(mockMembersMany, 'dark');
    // 10번째 멤버(user9)는 렌더링되지 않아야 함
    expect(svg).not.toContain('user9');
    expect(svg).not.toContain('user10');
    expect(svg).not.toContain('user11');
    // 처음 9명은 있어야 함
    for (let i = 0; i < 9; i++) {
      expect(svg).toContain(`user${i}`);
    }
  });

  it('멤버 수에 따라 3열로 배치된다', () => {
    const svg = renderMembers(mockMembers, 'dark');
    // 3명 → 1행 3열: height = 1 * CELL_H + PAD * 2 = 100 + 80 = 180
    expect(svg).toContain('height="180"');
  });

  it('light 테마에서 유효한 SVG를 반환한다', () => {
    const svg = renderMembers(mockMembers, 'light');
    expect(svg).toMatch(/^<svg/);
    expect(svg).toContain(THEMES.light.bg);
  });

  it('외부 URL은 아바타에 사용되지 않는다', () => {
    const unsafeMembers: MemberInfo[] = [{
      login: 'hacker',
      avatarUrl: 'https://evil.com/malicious.png',
      htmlUrl: 'https://github.com/hacker',
    }];
    const svg = renderMembers(unsafeMembers, 'dark');
    expect(svg).not.toContain('https://evil.com/malicious.png');
  });

  it('스냅샷과 일치한다', () => {
    const svg = renderMembers(mockMembers, 'dark');
    expect(svg).toMatchSnapshot();
  });
});
