import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchSnapshot } from "../../lib/github.js";
import { cached, KEYS, TTL } from "../../lib/cache.js";
import { renderProject } from "../../lib/svg/layouts/project.js";
import { getTheme } from "../../lib/svg/theme.js";

// repo name: 영문, 숫자, ., _, - 만 허용
const VALID_NAME = /^[a-zA-Z0-9._-]{1,100}$/;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const rawName = req.query.name;
  const name = typeof rawName === "string" ? rawName.replace(/\.svg$/, "") : "";

  if (!VALID_NAME.test(name)) {
    return res.status(400).send(errorSvg("Invalid repo name"));
  }

  const compact = req.query.compact === "true";

  try {
    const theme = getTheme(req.query.theme);
    const cacheKey = KEYS.svg(`project:${name}:${compact}`, theme);

    const svg = await cached(cacheKey, TTL.project, async () => {
      const snapshot = await cached(KEYS.snapshot, TTL.snapshot, fetchSnapshot);
      const repo = snapshot.repos.find((r) => r.name === name);
      if (!repo) {
        return notFoundSvg(name);
      }
      return renderProject(repo, theme, compact);
    });

    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    res.setHeader("Cache-Control", `public, max-age=${TTL.project}, stale-while-revalidate=60`);
    res.status(200).send(svg);
  } catch (err) {
    console.error(`[project/${name}]`, err);
    res.status(500).send(errorSvg("Error loading repo"));
  }
}

function notFoundSvg(name: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="60">
  <rect width="400" height="60" fill="#1a1a1a" rx="8"/>
  <text x="16" y="36" fill="#f59e0b" font-size="13" font-family="monospace">Repo not found: ${name.slice(0, 30)}</text>
</svg>`;
}

function errorSvg(msg: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="60">
  <rect width="400" height="60" fill="#1a1a1a" rx="8"/>
  <text x="16" y="36" fill="#ef4444" font-size="13" font-family="monospace">${msg}</text>
</svg>`;
}
