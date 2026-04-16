import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchSnapshot, getMembers } from "../lib/github.js";
import { cached, KEYS, TTL } from "../lib/cache.js";
import { renderBanner } from "../lib/svg/layouts/banner.js";
import { getTheme } from "../lib/svg/theme.js";
import type { OrgInfo } from "../lib/types.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const theme = getTheme(req.query.theme);
    const cacheKey = KEYS.svg("banner", theme);

    const svg = await cached(cacheKey, TTL.banner, async () => {
      const [snapshot, members] = await Promise.all([
        cached(KEYS.snapshot, TTL.snapshot, fetchSnapshot),
        cached(KEYS.members, TTL.members, getMembers),
      ]);
      const info: OrgInfo = {
        repoCount: snapshot.repoCount,
        memberCount: members.length,
        totalStars: snapshot.totalStars,
      };
      return renderBanner(info, theme);
    });

    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    res.setHeader("Cache-Control", `public, max-age=${TTL.banner}, stale-while-revalidate=60`);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).send(svg);
  } catch (err) {
    console.error("[banner]", err);
    res.status(500).send(errorSvg(String(err)));
  }
}

function errorSvg(msg: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="60">
  <rect width="400" height="60" fill="#1a1a1a" rx="8"/>
  <text x="16" y="36" fill="#ef4444" font-size="13" font-family="monospace">Error: ${msg.slice(0, 50)}</text>
</svg>`;
}
