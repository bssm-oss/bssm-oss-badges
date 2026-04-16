import { Octokit } from "@octokit/rest";
import type { ActivityEvent, MemberInfo, OrgSnapshot, RepoInfo } from "./types.js";

const ORG = "bssm-oss";

function getToken(): string {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is not set");
  return token;
}

// ─────────────────────────────────────────────
//  GraphQL 스냅샷 (레포 전체, 1 포인트/쿼리)
// ─────────────────────────────────────────────

const SNAPSHOT_QUERY = `
  query {
    organization(login: "${ORG}") {
      repositories(
        first: 100
        privacy: PUBLIC
        orderBy: { field: UPDATED_AT, direction: DESC }
      ) {
        totalCount
        nodes {
          name
          description
          primaryLanguage { name color }
          stargazerCount
          updatedAt
          url
        }
      }
    }
  }
`;

interface GQLRepo {
  name: string;
  description: string | null;
  primaryLanguage: { name: string; color: string } | null;
  stargazerCount: number;
  updatedAt: string;
  url: string;
}

export async function fetchSnapshot(): Promise<OrgSnapshot> {
  const token = getToken();

  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "bssm-oss-badges/1.0",
    },
    body: JSON.stringify({ query: SNAPSHOT_QUERY }),
  });

  if (!res.ok) {
    throw new Error(`GitHub GraphQL ${res.status}: ${await res.text()}`);
  }

  const json = (await res.json()) as {
    data?: { organization: { repositories: { totalCount: number; nodes: GQLRepo[] } } };
    errors?: Array<{ message: string }>;
  };

  if (json.errors?.length) {
    throw new Error(`GraphQL error: ${json.errors[0].message}`);
  }
  if (!json.data?.organization) {
    throw new Error("GraphQL response missing organization data");
  }

  const orgRepos = json.data.organization.repositories;

  if (orgRepos.totalCount > orgRepos.nodes.length) {
    console.warn(
      `[fetchSnapshot] truncated: got ${orgRepos.nodes.length} of ${orgRepos.totalCount} repos`,
    );
  }

  const repos: RepoInfo[] = orgRepos.nodes.map((r) => ({
    name: r.name,
    description: r.description,
    language: r.primaryLanguage?.name ?? null,
    languageColor: r.primaryLanguage?.color ?? null,
    stars: r.stargazerCount,
    updatedAt: r.updatedAt,
    htmlUrl: r.url,
  }));

  return {
    repos,
    repoCount: orgRepos.totalCount,
    totalStars: repos.reduce((sum, r) => sum + r.stars, 0),
  };
}

// ─────────────────────────────────────────────
//  멤버 목록 (REST, 1 call)
// ─────────────────────────────────────────────

export async function getMembers(): Promise<MemberInfo[]> {
  const octokit = new Octokit({ auth: getToken() });

  const members = await octokit.paginate(octokit.orgs.listMembers, {
    org: ORG,
    per_page: 100,
  });

  return members.map((m) => ({
    login: m.login,
    avatarUrl: m.avatar_url,
    htmlUrl: m.html_url,
  }));
}

// ─────────────────────────────────────────────
//  최근 활동 (REST, 1 call)
// ─────────────────────────────────────────────

/** 아바타 URL을 base64 data URI로 변환 (SVG <img> 샌드박스 우회) */
export async function fetchAvatarDataUri(url: string, size = 64): Promise<string> {
  if (!url.startsWith("https://avatars.githubusercontent.com")) return url;
  try {
    const res = await fetch(`${url}&s=${size}`, {
      headers: { "User-Agent": "bssm-oss-badges/1.0" },
    });
    if (!res.ok) return url;
    const ct = res.headers.get("content-type") ?? "image/png";
    const buf = await res.arrayBuffer();
    const b64 = Buffer.from(buf).toString("base64");
    return `data:${ct};base64,${b64}`;
  } catch {
    return url;
  }
}

// ─────────────────────────────────────────────
//  최근 활동 (GraphQL — 최근 push 레포의 커밋)
//  org events API는 payload.commits를 제공하지 않음
// ─────────────────────────────────────────────

const ACTIVITY_QUERY = `
  query RecentActivity($org: String!, $repoCount: Int!, $commitCount: Int!) {
    organization(login: $org) {
      repositories(
        first: $repoCount
        privacy: PUBLIC
        orderBy: { field: PUSHED_AT, direction: DESC }
      ) {
        nodes {
          name
          defaultBranchRef {
            target {
              ... on Commit {
                history(first: $commitCount) {
                  nodes {
                    message
                    committedDate
                    author {
                      user { login avatarUrl }
                      name
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

interface GQLCommitNode {
  message: string;
  committedDate: string;
  author: {
    user: { login: string; avatarUrl: string } | null;
    name: string;
  };
}

interface GQLActivityRepo {
  name: string;
  defaultBranchRef: {
    target: { history: { nodes: GQLCommitNode[] } } | null;
  } | null;
}

export async function getRecentActivity(limit = 20): Promise<ActivityEvent[]> {
  const token = getToken();

  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "bssm-oss-badges/1.0",
    },
    body: JSON.stringify({
      query: ACTIVITY_QUERY,
      variables: { org: ORG, repoCount: 20, commitCount: 3 },
    }),
  });

  const json = (await res.json()) as {
    data?: { organization: { repositories: { nodes: GQLActivityRepo[] } } };
    errors?: Array<{ message: string }>;
  };

  if (json.errors?.length) throw new Error(`GraphQL: ${json.errors[0].message}`);
  if (!json.data?.organization) throw new Error("GraphQL response missing org data");

  // 레포 × 커밋 펼쳐서 committedDate 기준 정렬 후 상위 limit개
  const flat: ActivityEvent[] = [];

  for (const repo of json.data.organization.repositories.nodes) {
    const commits = repo.defaultBranchRef?.target?.history?.nodes ?? [];
    for (const commit of commits) {
      flat.push({
        repo: repo.name,
        message: commit.message.split("\n")[0].slice(0, 60),
        author: commit.author.user?.login ?? commit.author.name,
        authorAvatar: commit.author.user?.avatarUrl ?? "",
        timestamp: commit.committedDate,
      });
    }
  }

  flat.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return flat.slice(0, limit);
}
