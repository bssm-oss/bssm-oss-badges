import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getOrgInfo } from "../lib/github.js";
import { cached, KEYS, TTL } from "../lib/cache.js";
import { renderStats } from "../lib/svg/layouts/stats.js";
import { getTheme } from "../lib/svg/theme.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const theme = getTheme(req.query.theme);
    const cacheKey = KEYS.svg("stats", theme);

    const svg = await cached(cacheKey, TTL.stats, async () => {
      const info = await cached(KEYS.orgInfo, TTL.stats, getOrgInfo);
      return renderStats(info, theme);
    });

    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    res.setHeader("Cache-Control", `public, max-age=${TTL.stats}, stale-while-revalidate=60`);
    res.status(200).send(svg);
  } catch (err) {
    console.error("[stats]", err);
    res.status(500).send(errorSvg());
  }
}

function errorSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="60">
  <rect width="400" height="60" fill="#1a1a1a" rx="8"/>
  <text x="16" y="36" fill="#ef4444" font-size="13" font-family="monospace">Error loading stats</text>
</svg>`;
}
