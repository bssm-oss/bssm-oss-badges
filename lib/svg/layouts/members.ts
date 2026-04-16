import { FONT_FAMILY, THEMES, getTheme } from "../theme";
import { avatarImage, rect, svgRoot, text, truncate } from "../primitives";
import type { MemberInfo } from "../../types";

const AVATAR_R = 32;
const CELL_W = 120;
const CELL_H = 100;
const COLS = 3;
const PAD = 40;

// 아바타 fallback 컬러 팔레트
const PALETTE = [
  "#3b82f6", "#8b5cf6", "#ec4899",
  "#10b981", "#f59e0b", "#ef4444",
  "#06b6d4", "#84cc16", "#f97316",
];

export function renderMembers(members: MemberInfo[], themeRaw: unknown): string {
  const theme = getTheme(themeRaw);
  const t = THEMES[theme];

  const rows = Math.ceil(members.length / COLS);
  const W = COLS * CELL_W + PAD * 2;
  const H = rows * CELL_H + PAD * 2;

  const cells = members
    .slice(0, 9)
    .map((m, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const cx = PAD + col * CELL_W + CELL_W / 2;
      const cy = PAD + row * CELL_H + AVATAR_R + 8;
      const clipId = `av${i}`;
      const fallbackColor = PALETTE[i % PALETTE.length];
      const initial = m.login[0] ?? "?";

      return `
    <a href="${m.htmlUrl}" target="_blank">
      ${avatarImage(clipId, cx, cy, AVATAR_R, m.avatarUrl, initial, fallbackColor)}
      ${text({
        x: cx,
        y: cy + AVATAR_R + 18,
        text: truncate(m.login, 12),
        fill: t.text,
        fontSize: 12,
        fontWeight: 500,
        fontFamily: FONT_FAMILY,
        anchor: "middle",
      })}
      ${m.repoCount > 0 ? text({
        x: cx,
        y: cy + AVATAR_R + 32,
        text: `${m.repoCount} repos`,
        fill: t.textMuted,
        fontSize: 10,
        fontFamily: FONT_FAMILY,
        anchor: "middle",
      }) : ""}
    </a>`;
    })
    .join("");

  const content = `
  ${rect({ x: 0, y: 0, width: W, height: H, fill: t.bg, rx: 12 })}
  ${cells}
  `.trim();

  return svgRoot(W, H, content);
}
