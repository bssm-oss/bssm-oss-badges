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
  stars: number;
  updatedAt: string;
  htmlUrl: string;
}

export interface MemberInfo {
  login: string;
  avatarUrl: string;
  htmlUrl: string;
  repoCount: number;
}

export interface ActivityEvent {
  repo: string;
  message: string;
  author: string;
  authorAvatar: string;
  timestamp: string;
}
