import { FONT_FAMILY, THEMES, getTheme } from "../theme";
import { escape, rect, svgRoot, text } from "../primitives";
import type { OrgInfo } from "../../types";

export function renderBanner(info: OrgInfo, themeRaw: unknown): string {
  const theme = getTheme(themeRaw);
  const t = THEMES[theme];
  const W = 1200;
  const H = 300;

  const statLine = `${info.repoCount} repos · ${info.memberCount} members · ${info.totalStars} stars`;

  const content = `
  ${rect({ x: 0, y: 0, width: W, height: H, fill: t.bg })}

  <!-- 왼쪽 accent bar -->
  <rect x="48" y="64" width="4" height="172" fill="${t.accent}" rx="2"/>

  <!-- 조직명 -->
  ${text({
    x: 72,
    y: 120,
    text: "BSSM OSS",
    fill: t.text,
    fontSize: 52,
    fontWeight: 700,
    fontFamily: FONT_FAMILY,
  })}

  <!-- 슬로건 line 1 -->
  ${text({
    x: 72,
    y: 164,
    text: "Busan Software Meister Highschool",
    fill: t.textSecondary,
    fontSize: 22,
    fontFamily: FONT_FAMILY,
  })}

  <!-- 슬로건 line 2 -->
  ${text({
    x: 72,
    y: 194,
    text: "Open Source Organization",
    fill: t.textSecondary,
    fontSize: 22,
    fontFamily: FONT_FAMILY,
  })}

  <!-- 구분선 -->
  <line x1="72" y1="216" x2="480" y2="216" stroke="${t.border}" stroke-width="1"/>

  <!-- 통계 -->
  ${text({
    x: 72,
    y: 248,
    text: escape(statLine),
    fill: t.textMuted,
    fontSize: 18,
    fontFamily: FONT_FAMILY,
  })}

  <!-- 우측 장식 원 (배경) -->
  <circle cx="${W - 120}" cy="${H / 2}" r="140" fill="${t.bgCard}" opacity="0.6"/>
  <circle cx="${W - 120}" cy="${H / 2}" r="100" fill="${t.bgElevated}" opacity="0.5"/>
  <circle cx="${W - 120}" cy="${H / 2}" r="60" fill="${t.accent}" opacity="0.12"/>

  <!-- 우측 텍스트 -->
  ${text({
    x: W - 120,
    y: H / 2 - 12,
    text: "{ }",
    fill: t.accent,
    fontSize: 36,
    fontWeight: 700,
    fontFamily: '"SF Mono", "JetBrains Mono", monospace',
    anchor: "middle",
    opacity: 0.6,
  })}
  `.trim();

  return svgRoot(W, H, content);
}
