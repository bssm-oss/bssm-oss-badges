import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getRecentActivity, fetchAvatarDataUri } from "../lib/github.js";
import { cached, KEYS, TTL } from "../lib/cache.js";
import { renderActivity } from "../lib/svg/layouts/activity.js";
import { getTheme } from "../lib/svg/theme.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const limitRaw = Number(req.query.limit ?? 10);
  const limit = Math.min(Math.max(1, Number.isNaN(limitRaw) ? 10 : limitRaw), 20);

  try {
    const theme = getTheme(req.query.theme);
    const cacheKey = KEYS.svg(`activity:${limit}`, theme);

    const svg = await cached(cacheKey, TTL.activity, async () => {
      // 항상 최대치로 캐시해두고 슬라이스
      const events = await cached(KEYS.activity, TTL.activity, () =>
        getRecentActivity(20),
      );
      const sliced = events.slice(0, limit);
      // 아바타 base64 임베딩 (SVG <img> 샌드박스 외부 URL 차단 우회)
      const eventsWithAvatars = await Promise.all(
        sliced.map(async (ev) => ({
          ...ev,
          authorAvatar: await fetchAvatarDataUri(ev.authorAvatar),
        })),
      );
      return renderActivity(eventsWithAvatars, theme);
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
