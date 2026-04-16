import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getMembers, fetchAvatarDataUri } from "../lib/github.js";
import { cached, KEYS, TTL } from "../lib/cache.js";
import { renderMembers } from "../lib/svg/layouts/members.js";
import { getTheme } from "../lib/svg/theme.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const theme = getTheme(req.query.theme);
    const cacheKey = KEYS.svg("members", theme);

    const svg = await cached(cacheKey, TTL.members, async () => {
      const members = await cached(KEYS.members, TTL.members, getMembers);
      // SVG <img> 샌드박스 환경에서 외부 URL 차단됨 → 서버에서 base64 임베딩
      const membersWithAvatars = await Promise.all(
        members.slice(0, 9).map(async (m) => ({
          ...m,
          avatarUrl: await fetchAvatarDataUri(m.avatarUrl),
        })),
      );
      return renderMembers(membersWithAvatars, theme);
    });

    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    res.setHeader("Cache-Control", `public, max-age=${TTL.members}, stale-while-revalidate=60`);
    res.status(200).send(svg);
  } catch (err) {
    console.error("[members]", err);
    res.status(500).send(errorSvg());
  }
}

function errorSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="60">
  <rect width="400" height="60" fill="#1a1a1a" rx="8"/>
  <text x="16" y="36" fill="#ef4444" font-size="13" font-family="monospace">Error loading members</text>
</svg>`;
}
