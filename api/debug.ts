import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const results: Record<string, string> = {};

  try {
    const { Octokit } = await import("@octokit/rest");
    results["octokit"] = "ok: " + typeof Octokit;
  } catch (e) {
    results["octokit"] = "FAIL: " + String(e);
  }

  try {
    const { getTheme } = await import("../lib/svg/theme");
    results["theme"] = "ok: " + getTheme("dark");
  } catch (e) {
    results["theme"] = "FAIL: " + String(e);
  }

  try {
    const { escape } = await import("../lib/svg/primitives");
    results["primitives"] = "ok: " + escape("<test>");
  } catch (e) {
    results["primitives"] = "FAIL: " + String(e);
  }

  try {
    const { renderBanner } = await import("../lib/svg/layouts/banner");
    const svg = renderBanner({ repoCount: 1, memberCount: 1, totalStars: 1 }, "dark");
    results["banner"] = "ok: " + svg.slice(0, 30);
  } catch (e) {
    results["banner"] = "FAIL: " + String(e);
  }

  res.status(200).json(results);
}
