export type Theme = "dark" | "light";

export interface OrgInfo {
  repoCount: number;
  memberCount: number;
  totalStars: number;
}

export interface RepoInfo {
  name: string;
  description: string | null;
  language: string | null;
  languageColor: string | null;
  stars: number;
  updatedAt: string;
  htmlUrl: string;
}

export interface MemberInfo {
  login: string;
  avatarUrl: string;
  htmlUrl: string;
}

export interface ActivityEvent {
  repo: string;
  message: string;
  author: string;
  authorAvatar: string;
  timestamp: string;
}

/** GraphQL 한 방 스냅샷 */
export interface OrgSnapshot {
  repos: RepoInfo[];
  repoCount: number;
  totalStars: number;
}
