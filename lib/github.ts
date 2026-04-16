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

  const orgRepos = json.data!.organization.repositories;

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

export async function getRecentActivity(limit = 10): Promise<ActivityEvent[]> {
  const octokit = new Octokit({ auth: getToken() });

  const { data: events } = await octokit.activity.listPublicOrgEvents({
    org: ORG,
    per_page: 50,
  });

  const pushEvents = events
    .filter((e) => e.type === "PushEvent" && e.payload)
    .slice(0, limit * 3);

  const activities: ActivityEvent[] = [];

  for (const event of pushEvents) {
    if (activities.length >= limit) break;
    const payload = event.payload as {
      commits?: Array<{ message: string }>;
    };
    const commits = payload.commits ?? [];
    if (commits.length === 0) continue;

    activities.push({
      repo: event.repo.name.replace(`${ORG}/`, ""),
      message: commits[0].message.split("\n")[0].slice(0, 60),
      author: event.actor.login,
      authorAvatar: event.actor.avatar_url ?? "",
      timestamp: event.created_at ?? new Date().toISOString(),
    });
  }

  return activities;
}
