import { FONT_FAMILY, THEMES, getTheme } from "../theme.js";
import { rect, svgRoot, text } from "../primitives.js";
import type { OrgInfo } from "../../types.js";

interface StatCard {
  value: string;
  label: string;
}

const STYLES = `
@keyframes sFadeUp {
  from { opacity: 0; transform: translateY(8px) }
  to   { opacity: 1; transform: translateY(0) }
}
.s0 { animation: sFadeUp .4s ease-out .0s  both }
.s1 { animation: sFadeUp .4s ease-out .08s both }
.s2 { animation: sFadeUp .4s ease-out .16s both }
.s3 { animation: sFadeUp .4s ease-out .24s both }
`;

export function renderStats(info: OrgInfo, themeRaw: unknown): string {
  const theme = getTheme(themeRaw);
  const t = THEMES[theme];
  const W = 800;
  const H = 160;

  const cards: StatCard[] = [
    { value: String(info.repoCount), label: "Repos" },
    { value: String(info.memberCount), label: "Members" },
    { value: String(info.totalStars), label: "Stars" },
    { value: "76", label: "Projects" },
  ];

  const cardW = W / 4;

  const cardsSvg = cards
    .map((card, i) => {
      const x = i * cardW;
      return `
    <g class="s${i}">
    ${rect({ x: x + 1, y: 0, width: cardW - 2, height: H, fill: t.bgCard, rx: i === 0 ? 12 : i === 3 ? 12 : 0 })}
    ${i > 0 ? `<line x1="${x}" y1="20" x2="${x}" y2="${H - 20}" stroke="${t.border}" stroke-width="1"/>` : ""}
    ${text({
      x: x + cardW / 2,
      y: 72,
      text: card.value,
      fill: t.text,
      fontSize: 36,
      fontWeight: 700,
      fontFamily: FONT_FAMILY,
      anchor: "middle",
    })}
    ${text({
      x: x + cardW / 2,
      y: 108,
      text: card.label,
      fill: t.textSecondary,
      fontSize: 14,
      fontFamily: FONT_FAMILY,
      anchor: "middle",
    })}
    </g>`;
    })
    .join("");

  const content = `
  ${rect({ x: 0, y: 0, width: W, height: H, fill: t.bg, rx: 12 })}
  ${rect({ x: 1, y: 1, width: W - 2, height: H - 2, fill: t.bgCard, rx: 12, stroke: t.border, strokeWidth: 1 })}
  ${cardsSvg}
  `.trim();

  return svgRoot(W, H, content, STYLES);
}
