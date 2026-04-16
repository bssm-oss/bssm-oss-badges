import { FONT_FAMILY, THEMES, getTheme, langColor } from "../theme";
import { escape, langDot, rect, svgRoot, text, truncate } from "../primitives";
import type { RepoInfo } from "../../types";
import type { CategoryDef } from "../../data/categories";

const ROW_H = 80;
const W = 800;
const PAD_X = 24;
const PAD_Y = 16;

export function renderCategory(
  category: CategoryDef,
  repos: RepoInfo[],
  themeRaw: unknown,
): string {
  const theme = getTheme(themeRaw);
  const t = THEMES[theme];
  const H = repos.length * ROW_H + PAD_Y * 2;

  const rows = repos
    .map((repo, i) => {
      const y = PAD_Y + i * ROW_H;
      const isLast = i === repos.length - 1;
      const lang = repo.language ?? "—";
      const color = langColor(repo.language);
      const desc = truncate(repo.description ?? "No description", 72);

      return `
    <!-- repo row ${i}: ${repo.name} -->
    ${rect({ x: PAD_X, y: y + 2, width: W - PAD_X * 2, height: ROW_H - 4, fill: t.bgCard, rx: 8 })}

    <!-- lang dot -->
    ${langDot(PAD_X + 20, y + ROW_H / 2 - 6, color)}

    <!-- repo name -->
    ${text({
      x: PAD_X + 36,
      y: y + 28,
      text: repo.name,
      fill: t.text,
      fontSize: 15,
      fontWeight: 600,
      fontFamily: FONT_FAMILY,
    })}

    <!-- lang label -->
    ${text({
      x: PAD_X + 36,
      y: y + 48,
      text: lang,
      fill: color,
      fontSize: 11,
      fontFamily: FONT_FAMILY,
    })}

    <!-- description -->
    ${text({
      x: PAD_X + 36,
      y: y + 64,
      text: escape(desc),
      fill: t.textSecondary,
      fontSize: 12,
      fontFamily: FONT_FAMILY,
    })}

    <!-- stars -->
    ${repo.stars > 0 ? `
    <text x="${W - PAD_X - 16}" y="${y + ROW_H / 2}" font-size="12" fill="${t.textMuted}" text-anchor="end" dominant-baseline="middle" font-family="${FONT_FAMILY}">⭐ ${repo.stars}</text>
    ` : ""}

    <!-- separator -->
    ${!isLast ? `<line x1="${PAD_X + 12}" y1="${y + ROW_H - 1}" x2="${W - PAD_X - 12}" y2="${y + ROW_H - 1}" stroke="${t.border}" stroke-width="1"/>` : ""}`;
    })
    .join("");

  const content = `
  ${rect({ x: 0, y: 0, width: W, height: H, fill: t.bg, rx: 12 })}
  ${rows}
  `.trim();

  return svgRoot(W, H, content);
}
