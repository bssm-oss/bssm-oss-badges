import { FONT_FAMILY, THEMES, getTheme } from "../theme.js";
import { avatarImage, escape, rect, relativeTime, svgRoot, text, truncate } from "../primitives.js";
import type { ActivityEvent } from "../../types.js";

const W = 800;
const ROW_H = 56;
const PAD_X = 24;
const HEADER_H = 48;

const PALETTE = [
  "#3b82f6", "#8b5cf6", "#ec4899",
  "#10b981", "#f59e0b", "#ef4444",
];

function activityStyles(count: number): string {
  const delays = Array.from({ length: count }, (_, i) =>
    `.a${i} { animation: aSlideIn .3s ease-out ${(i * 0.07).toFixed(2)}s both }`
  ).join("\n");
  return `
@keyframes aSlideIn {
  from { opacity: 0; transform: translateX(-8px) }
  to   { opacity: 1; transform: translateX(0) }
}
${delays}`;
}

export function renderActivity(events: ActivityEvent[], themeRaw: unknown): string {
  const theme = getTheme(themeRaw);
  const t = THEMES[theme];

  if (events.length === 0) {
    const W2 = W;
    const H2 = HEADER_H + 64;
    const content = `
    ${rect({ x: 0, y: 0, width: W2, height: H2, fill: t.bg, rx: 12 })}
    ${rect({ x: 0, y: 0, width: W2, height: HEADER_H, fill: t.bgCard, rx: 0 })}
    ${text({ x: PAD_X, y: HEADER_H / 2 + 6, text: "📝  Recent Activity", fill: t.text, fontSize: 15, fontWeight: 600, fontFamily: FONT_FAMILY })}
    <line x1="0" y1="${HEADER_H}" x2="${W2}" y2="${HEADER_H}" stroke="${t.border}" stroke-width="1"/>
    ${text({ x: W2 / 2, y: HEADER_H + 38, text: "No recent activity", fill: t.textMuted, fontSize: 14, fontFamily: FONT_FAMILY, anchor: "middle" })}
    `.trim();
    return svgRoot(W2, H2, content);
  }

  const H = HEADER_H + events.length * ROW_H + 16;

  const header = `
  ${rect({ x: 0, y: 0, width: W, height: HEADER_H, fill: t.bgCard, rx: 0 })}
  ${text({
    x: PAD_X,
    y: HEADER_H / 2 + 6,
    text: "📝  Recent Activity",
    fill: t.text,
    fontSize: 15,
    fontWeight: 600,
    fontFamily: FONT_FAMILY,
  })}
  <line x1="0" y1="${HEADER_H}" x2="${W}" y2="${HEADER_H}" stroke="${t.border}" stroke-width="1"/>`;

  const rows = events
    .map((ev, i) => {
      const y = HEADER_H + i * ROW_H;
      const isLast = i === events.length - 1;
      const clipId = `act${i}`;
      const cx = PAD_X + 16;
      const cy = y + ROW_H / 2;
      const initial = ev.author[0] ?? "?";
      const fallbackColor = PALETTE[i % PALETTE.length];

      return `
    <g class="a${i}">
    ${avatarImage(clipId, cx, cy, 16, ev.authorAvatar, initial, fallbackColor)}
    ${text({
      x: PAD_X + 40,
      y: y + 20,
      text: `${escape(ev.repo)} · ${escape(ev.author)} · ${relativeTime(ev.timestamp)}`,
      fill: t.textSecondary,
      fontSize: 12,
      fontFamily: FONT_FAMILY,
    })}
    ${text({
      x: PAD_X + 40,
      y: y + 38,
      text: escape(truncate(ev.message, 80)),
      fill: t.text,
      fontSize: 13,
      fontWeight: 500,
      fontFamily: FONT_FAMILY,
    })}
    ${!isLast ? `<line x1="${PAD_X}" y1="${y + ROW_H}" x2="${W - PAD_X}" y2="${y + ROW_H}" stroke="${t.border}" stroke-width="1"/>` : ""}
    </g>`;
    })
    .join("");

  const content = `
  ${rect({ x: 0, y: 0, width: W, height: H, fill: t.bg, rx: 12 })}
  ${header}
  ${rows}
  `.trim();

  return svgRoot(W, H, content, activityStyles(events.length));
}
