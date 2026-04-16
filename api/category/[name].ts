import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchSnapshot } from "../../lib/github.js";
import { cached, KEYS, TTL } from "../../lib/cache.js";
import { renderCategory } from "../../lib/svg/layouts/category.js";
import { getTheme } from "../../lib/svg/theme.js";
import { CATEGORIES } from "../../lib/data/categories.js";

const VALID_NAMES = new Set(Object.keys(CATEGORIES));

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const rawName = req.query.name;
  const name = typeof rawName === "string" ? rawName.replace(/\.svg$/, "") : "";

  if (!VALID_NAMES.has(name)) {
    return res.status(404).send(notFoundSvg(name));
  }

  try {
    const theme = getTheme(req.query.theme);
    const cacheKey = `bssm:svg:category:${name}:${theme}`;
    const category = CATEGORIES[name];

    const svg = await cached(cacheKey, TTL.category, async () => {
      const snapshot = await cached(KEYS.snapshot, TTL.snapshot, fetchSnapshot);
      // 카테고리 순서 유지하면서 snapshot에서 필터
      const repos = category.repos
        .map((repoName) => snapshot.repos.find((r) => r.name === repoName))
        .filter((r) => r !== undefined);
      return renderCategory(category, repos, theme);
    });

    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    res.setHeader("Cache-Control", `public, max-age=${TTL.category}, stale-while-revalidate=60`);
    res.status(200).send(svg);
  } catch (err) {
    console.error(`[category/${name}]`, err);
    res.status(500).send(errorSvg());
  }
}

function notFoundSvg(name: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="60">
  <rect width="400" height="60" fill="#1a1a1a" rx="8"/>
  <text x="16" y="36" fill="#f59e0b" font-size="13" font-family="monospace">Unknown category: ${name.slice(0, 20)}</text>
</svg>`;
}

function errorSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="60">
  <rect width="400" height="60" fill="#1a1a1a" rx="8"/>
  <text x="16" y="36" fill="#ef4444" font-size="13" font-family="monospace">Error loading category</text>
</svg>`;
}
