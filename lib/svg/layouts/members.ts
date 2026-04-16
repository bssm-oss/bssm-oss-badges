import { FONT_FAMILY, THEMES, getTheme } from "../theme.js";
import { avatarImage, rect, svgRoot, text, truncate } from "../primitives.js";
import type { MemberInfo } from "../../types.js";

const AVATAR_R = 32;
const CELL_W = 120;
const CELL_H = 100;
const COLS = 3;
const PAD = 40;

const PALETTE = [
  "#3b82f6", "#8b5cf6", "#ec4899",
  "#10b981", "#f59e0b", "#ef4444",
  "#06b6d4", "#84cc16", "#f97316",
];

function memberStyles(count: number): string {
  const delays = Array.from({ length: count }, (_, i) =>
    `.m${i} { animation: mPopIn .35s ease-out ${(i * 0.06).toFixed(2)}s both }`
  ).join("\n");
  return `
@keyframes mPopIn {
  from { opacity: 0; transform: scale(.8) }
  to   { opacity: 1; transform: scale(1) }
}
${delays}`;
}

export function renderMembers(members: MemberInfo[], themeRaw: unknown): string {
  const theme = getTheme(themeRaw);
  const t = THEMES[theme];

  const visible = members.slice(0, 9);
  const rows = Math.ceil(visible.length / COLS);
  const W = COLS * CELL_W + PAD * 2;
  const H = rows * CELL_H + PAD * 2;

  const cells = visible
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
    <g class="m${i}">
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
    </g>
    </a>`;
    })
    .join("");

  const content = `
  ${rect({ x: 0, y: 0, width: W, height: H, fill: t.bg, rx: 12 })}
  ${cells}
  `.trim();

  return svgRoot(W, H, content, memberStyles(visible.length));
}
