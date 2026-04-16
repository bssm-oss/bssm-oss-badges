import { Octokit } from "@octokit/rest";
import type { ActivityEvent, MemberInfo, OrgInfo, RepoInfo } from "./types";

const ORG = "bssm-oss";

function getOctokit(): Octokit {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is not set");
  return new Octokit({ auth: token });
}

export async function getOrgInfo(): Promise<OrgInfo> {
  const octokit = getOctokit();

  const [reposRes, membersRes] = await Promise.all([
    octokit.paginate(octokit.repos.listForOrg, {
      org: ORG,
      type: "public",
      per_page: 100,
    }),
    octokit.paginate(octokit.orgs.listMembers, {
      org: ORG,
      per_page: 100,
    }),
  ]);

  const totalStars = reposRes.reduce((sum, repo) => sum + (repo.stargazers_count ?? 0), 0);

  return {
    repoCount: reposRes.length,
    memberCount: membersRes.length,
    totalStars,
  };
}

export async function getRepo(name: string): Promise<RepoInfo> {
  const octokit = getOctokit();
  const { data } = await octokit.repos.get({ owner: ORG, repo: name });

  return {
    name: data.name,
    description: data.description,
    language: data.language ?? null,
    stars: data.stargazers_count ?? 0,
    updatedAt: data.updated_at ?? new Date().toISOString(),
    htmlUrl: data.html_url,
  };
}

export async function getRepos(names: string[]): Promise<RepoInfo[]> {
  const results = await Promise.allSettled(names.map((n) => getRepo(n)));
  return results
    .filter((r): r is PromiseFulfilledResult<RepoInfo> => r.status === "fulfilled")
    .map((r) => r.value);
}

export async function getAllPublicRepos(): Promise<RepoInfo[]> {
  const octokit = getOctokit();
  const repos = await octokit.paginate(octokit.repos.listForOrg, {
    org: ORG,
    type: "public",
    per_page: 100,
  });

  return repos.map((r) => ({
    name: r.name,
    description: r.description ?? null,
    language: r.language ?? null,
    stars: r.stargazers_count ?? 0,
    updatedAt: r.updated_at ?? new Date().toISOString(),
    htmlUrl: r.html_url,
  }));
}

export async function getMembers(): Promise<MemberInfo[]> {
  const octokit = getOctokit();

  const members = await octokit.paginate(octokit.orgs.listMembers, {
    org: ORG,
    per_page: 100,
  });

  const repos = await octokit.paginate(octokit.repos.listForOrg, {
    org: ORG,
    type: "public",
    per_page: 100,
  });

  // repo당 기여자 수 (commits 비용이 크므로 단순히 repo owner 기준)
  const memberRepoCounts: Record<string, number> = {};
  for (const member of members) {
    memberRepoCounts[member.login] = 0;
  }

  for (const repo of repos) {
    try {
      const contributors = await octokit.repos.listContributors({
        owner: ORG,
        repo: repo.name,
        per_page: 5,
      });
      for (const c of contributors.data) {
        if (c.login && memberRepoCounts[c.login] !== undefined) {
          memberRepoCounts[c.login]++;
        }
      }
    } catch {
      // 빈 레포 등 무시
    }
  }

  return members.map((m) => ({
    login: m.login,
    avatarUrl: m.avatar_url,
    htmlUrl: m.html_url,
    repoCount: memberRepoCounts[m.login] ?? 0,
  }));
}

export async function getRecentActivity(limit = 10): Promise<ActivityEvent[]> {
  const octokit = getOctokit();

  const { data: events } = await octokit.activity.listPublicOrgEvents({
    org: ORG,
    per_page: 50,
  });

  const pushEvents = events
    .filter((e) => e.type === "PushEvent" && e.payload)
    .slice(0, limit * 3); // 여분 확보

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
