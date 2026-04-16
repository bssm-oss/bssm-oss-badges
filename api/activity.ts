import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getRecentActivity } from "../lib/github";
import { cached, KEYS, TTL } from "../lib/cache";
import { renderActivity } from "../lib/svg/layouts/activity";
import { getTheme } from "../lib/svg/theme";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const limitRaw = Number(req.query.limit ?? 10);
  const limit = Math.min(Math.max(1, Number.isNaN(limitRaw) ? 10 : limitRaw), 20);

  try {
    const theme = getTheme(req.query.theme);
    const cacheKey = KEYS.svg(`activity:${limit}`, theme);

    const svg = await cached(cacheKey, TTL.activity, async () => {
      const events = await cached(KEYS.activity, TTL.activity, () =>
        getRecentActivity(limit),
      );
      return renderActivity(events.slice(0, limit), theme);
    });

    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    res.setHeader("Cache-Control", `public, max-age=${TTL.activity}, stale-while-revalidate=30`);
    res.status(200).send(svg);
  } catch (err) {
    console.error("[activity]", err);
    res.status(500).send(errorSvg());
  }
}

function errorSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="60">
  <rect width="400" height="60" fill="#1a1a1a" rx="8"/>
  <text x="16" y="36" fill="#ef4444" font-size="13" font-family="monospace">Error loading activity</text>
</svg>`;
}
