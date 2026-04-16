/** SVG 인젝션 방지를 위한 이스케이프 */
export function escape(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface TextProps {
  x: number;
  y: number;
  text: string;
  fill: string;
  fontSize: number;
  fontWeight?: number | string;
  fontFamily?: string;
  anchor?: "start" | "middle" | "end";
  opacity?: number;
  class?: string;
}

export function text({
  x,
  y,
  text: content,
  fill,
  fontSize,
  fontWeight = 400,
  fontFamily = '"SF Pro Display", "Inter", -apple-system, sans-serif',
  anchor = "start",
  opacity = 1,
  class: className,
}: TextProps): string {
  const classAttr = className ? ` class="${escape(className)}"` : "";
  return `<text
    x="${x}"
    y="${y}"
    fill="${fill}"
    font-size="${fontSize}"
    font-weight="${fontWeight}"
    font-family="${escape(fontFamily)}"
    text-anchor="${anchor}"
    opacity="${opacity}"
    dominant-baseline="auto"${classAttr}
  >${escape(content)}</text>`;
}

export interface RectProps {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  rx?: number;
  opacity?: number;
  stroke?: string;
  strokeWidth?: number;
}

export function rect({
  x,
  y,
  width,
  height,
  fill,
  rx = 0,
  opacity = 1,
  stroke,
  strokeWidth,
}: RectProps): string {
  const strokeAttrs =
    stroke
      ? `stroke="${stroke}" stroke-width="${strokeWidth ?? 1}"`
      : "";
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" rx="${rx}" opacity="${opacity}" ${strokeAttrs}/>`;
}

export function circle(cx: number, cy: number, r: number, fill: string): string {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
}

/** 언어 컬러 닷 */
export function langDot(cx: number, cy: number, color: string): string {
  return circle(cx, cy, 6, color);
}

/** 상대 시간 계산 */
export function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

/** SVG 루트 래퍼 — styles 문자열은 <style> 태그 안에 삽입됨 */
export function svgRoot(
  width: number,
  height: number,
  content: string,
  styles = "",
): string {
  const styleBlock = styles
    ? `<style>${styles}</style>\n`
    : "";
  return `<svg
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${width}"
  height="${height}"
  viewBox="0 0 ${width} ${height}"
>
${styleBlock}${content}
</svg>`.trim();
}

/** 원형 클립패스 + image (아바타용) */
export function avatarImage(
  id: string,
  cx: number,
  cy: number,
  r: number,
  href: string,
  fallbackInitial: string,
  fallbackColor: string,
): string {
  // GitHub avatar URL 또는 서버에서 내려준 data URI만 허용
  const safeHref =
    href.startsWith("https://avatars.githubusercontent.com") ||
    href.startsWith("data:image/")
      ? href
      : "";

  return `
  <defs>
    <clipPath id="${id}">
      <circle cx="${cx}" cy="${cy}" r="${r}"/>
    </clipPath>
  </defs>
  ${safeHref
    ? `<image href="${safeHref}" x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" clip-path="url(#${id})" preserveAspectRatio="xMidYMid slice"/>`
    : `${circle(cx, cy, r, fallbackColor)}<text x="${cx}" y="${cy}" font-size="${r}" fill="#fff" text-anchor="middle" dominant-baseline="central" font-weight="600">${escape(fallbackInitial.toUpperCase())}</text>`
  }`;
}

/** 텍스트 줄임 (SVG textLength 대신 글자 수로 근사) */
export function truncate(str: string, maxChars: number): string {
  if (str.length <= maxChars) return str;
  return `${str.slice(0, maxChars - 1)}…`;
}
