/**
 * 로컬 테스트: GitHub API 없이 더미 데이터로 SVG 생성 확인
 */
import { renderBanner } from "../lib/svg/layouts/banner.js";
import { renderStats } from "../lib/svg/layouts/stats.js";
import { renderProject } from "../lib/svg/layouts/project.js";
import { renderCategory } from "../lib/svg/layouts/category.js";
import { renderActivity } from "../lib/svg/layouts/activity.js";
import { CATEGORIES } from "../lib/data/categories.js";
import { writeFileSync, mkdirSync } from "node:fs";

mkdirSync("./scripts/out", { recursive: true });

const orgInfo = { repoCount: 76, memberCount: 8, totalStars: 82 };

// banner
const bannerDark = renderBanner(orgInfo, "dark");
const bannerLight = renderBanner(orgInfo, "light");
writeFileSync("./scripts/out/banner-dark.svg", bannerDark);
writeFileSync("./scripts/out/banner-light.svg", bannerLight);
console.log("✅ banner");

// stats
writeFileSync("./scripts/out/stats-dark.svg", renderStats(orgInfo, "dark"));
writeFileSync("./scripts/out/stats-light.svg", renderStats(orgInfo, "light"));
console.log("✅ stats");

// project
const repo = {
  name: "CodeAgora",
  description: "Code review, but with 5 models arguing first.",
  language: "TypeScript",
  stars: 6,
  updatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  htmlUrl: "https://github.com/bssm-oss/CodeAgora",
};
writeFileSync("./scripts/out/project-dark.svg", renderProject(repo, "dark", false));
writeFileSync("./scripts/out/project-compact-dark.svg", renderProject(repo, "dark", true));
console.log("✅ project");

// category
const aiCategory = CATEGORIES["ai"];
const repos = [repo, { ...repo, name: "cotor", description: "Local-first AI workflow runner", language: "Kotlin", stars: 5 }];
writeFileSync("./scripts/out/category-ai-dark.svg", renderCategory(aiCategory, repos, "dark"));
console.log("✅ category");

// activity
const events = [
  {
    repo: "CodeAgora",
    message: "fix: consensus logic edge case in multi-model vote",
    author: "justn-hyeok",
    authorAvatar: "https://avatars.githubusercontent.com/u/1?v=4",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    repo: "cotor",
    message: "feat: add local model support via Ollama",
    author: "heodongun",
    authorAvatar: "https://avatars.githubusercontent.com/u/2?v=4",
    timestamp: new Date(Date.now() - 18000000).toISOString(),
  },
];
writeFileSync("./scripts/out/activity-dark.svg", renderActivity(events, "dark"));
console.log("✅ activity");

console.log("\n📁 Output: ./scripts/out/");
