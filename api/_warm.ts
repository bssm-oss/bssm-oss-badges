// 캐시 워밍 엔드포인트 — 필요 시 수동 호출
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchSnapshot, getMembers, getRecentActivity } from "../lib/github.js";
import { cached, KEYS, TTL } from "../lib/cache.js";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const results: Record<string, string> = {};

  // 1. GraphQL 스냅샷
  try {
    await cached(KEYS.snapshot, TTL.snapshot, fetchSnapshot);
    results["snapshot"] = "ok";
  } catch (e) {
    results["snapshot"] = String(e);
  }

  // 2. 멤버
  try {
    await cached(KEYS.members, TTL.members, getMembers);
    results["members"] = "ok";
  } catch (e) {
    results["members"] = String(e);
  }

  // 3. 활동
  try {
    await cached(KEYS.activity, TTL.activity, () => getRecentActivity(10));
    results["activity"] = "ok";
  } catch (e) {
    results["activity"] = String(e);
  }

  res.status(200).json({ warmed: results, at: new Date().toISOString() });
}
