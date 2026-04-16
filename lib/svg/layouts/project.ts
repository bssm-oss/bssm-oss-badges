import { FONT_FAMILY, THEMES, getTheme, langColor } from "../theme.js";
import { escape, langDot, rect, relativeTime, svgRoot, text, truncate } from "../primitives.js";
import type { RepoInfo } from "../../types.js";

const W = 400;

export function renderProject(
  repo: RepoInfo,
  themeRaw: unknown,
  compact = false,
): string {
  const theme = getTheme(themeRaw);
  const t = THEMES[theme];
  const H = compact ? 80 : 160;
  const lang = repo.language ?? "—";
  const color = langColor(repo.language);

  let content: string;

  if (compact) {
    content = `
    ${rect({ x: 0, y: 0, width: W, height: H, fill: t.bgCard, rx: 10 })}
    ${rect({ x: 0, y: 0, width: W, height: H, fill: t.bg, rx: 10, stroke: t.border, strokeWidth: 1 })}

    ${langDot(20, H / 2, color)}

    ${text({
      x: 36,
      y: H / 2 - 6,
      text: repo.name,
      fill: t.text,
      fontSize: 14,
      fontWeight: 600,
      fontFamily: FONT_FAMILY,
    })}
    ${text({
      x: 36,
      y: H / 2 + 12,
      text: lang,
      fill: color,
      fontSize: 11,
      fontFamily: FONT_FAMILY,
    })}

    ${repo.stars > 0 ? text({
      x: W - 16,
      y: H / 2 - 2,
      text: `⭐ ${repo.stars}`,
      fill: t.textMuted,
      fontSize: 12,
      fontFamily: FONT_FAMILY,
      anchor: "end",
    }) : ""}
    `.trim();
  } else {
    const desc = truncate(repo.description ?? "No description", 52);
    const updated = relativeTime(repo.updatedAt);

    content = `
    ${rect({ x: 0, y: 0, width: W, height: H, fill: t.bg, rx: 10 })}
    ${rect({ x: 0, y: 0, width: W, height: H, fill: t.bg, rx: 10, stroke: t.border, strokeWidth: 1 })}

    <!-- header -->
    ${langDot(20, 32, color)}
    ${text({
      x: 36,
      y: 36,
      text: repo.name,
      fill: t.text,
      fontSize: 16,
      fontWeight: 700,
      fontFamily: FONT_FAMILY,
    })}

    ${repo.stars > 0 ? text({
      x: W - 16,
      y: 36,
      text: `⭐ ${repo.stars}`,
      fill: t.textMuted,
      fontSize: 13,
      fontFamily: FONT_FAMILY,
      anchor: "end",
    }) : ""}

    <!-- divider -->
    <line x1="16" y1="52" x2="${W - 16}" y2="52" stroke="${t.border}" stroke-width="1"/>

    <!-- description -->
    ${text({
      x: 20,
      y: 76,
      text: escape(desc),
      fill: t.textSecondary,
      fontSize: 13,
      fontFamily: FONT_FAMILY,
    })}

    <!-- lang + updated -->
    ${langDot(20, H - 24, color)}
    ${text({
      x: 36,
      y: H - 20,
      text: lang,
      fill: color,
      fontSize: 11,
      fontFamily: FONT_FAMILY,
    })}
    ${text({
      x: W - 16,
      y: H - 20,
      text: `Updated ${updated}`,
      fill: t.textMuted,
      fontSize: 11,
      fontFamily: FONT_FAMILY,
      anchor: "end",
    })}
    `.trim();
  }

  return svgRoot(W, H, content);
}
