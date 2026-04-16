// Vercel Cron schedule: every 30 minutes
// 모든 SVG 엔드포인트를 사전 호출해서 캐시 워밍
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getOrgInfo, getMembers, getRecentActivity, getRepos } from "../lib/github.js";
import { cached, KEYS, TTL } from "../lib/cache.js";
import { CATEGORIES } from "../lib/data/categories.js";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const results: Record<string, string> = {};

  // 1. org info
  try {
    await cached(KEYS.orgInfo, TTL.banner, getOrgInfo);
    results["orgInfo"] = "ok";
  } catch (e) {
    results["orgInfo"] = String(e);
  }

  // 2. members
  try {
    await cached(KEYS.members, TTL.members, getMembers);
    results["members"] = "ok";
  } catch (e) {
    results["members"] = String(e);
  }

  // 3. activity
  try {
    await cached(KEYS.activity, TTL.activity, () => getRecentActivity(10));
    results["activity"] = "ok";
  } catch (e) {
    results["activity"] = String(e);
  }

  // 4. category repos
  for (const [cat, def] of Object.entries(CATEGORIES)) {
    try {
      await cached(`bssm:repos:category:${cat}`, TTL.category, () =>
        getRepos(def.repos),
      );
      results[`category:${cat}`] = "ok";
    } catch (e) {
      results[`category:${cat}`] = String(e);
    }
  }

  res.status(200).json({ warmed: results, at: new Date().toISOString() });
}
