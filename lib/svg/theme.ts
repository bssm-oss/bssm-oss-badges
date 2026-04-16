import type { Theme } from "../types.js";

export const THEMES = {
  dark: {
    bg: "#0a0a0a",
    bgCard: "#171717",
    bgElevated: "#262626",
    text: "#ededed",
    textSecondary: "#a1a1aa",
    textMuted: "#52525b",
    accent: "#3b82f6",
    border: "#262626",
  },
  light: {
    bg: "#ffffff",
    bgCard: "#f4f4f5",
    bgElevated: "#e4e4e7",
    text: "#171717",
    textSecondary: "#52525b",
    textMuted: "#71717a",
    accent: "#3b82f6",
    border: "#e4e4e7",
  },
} as const;

export type ThemeColors = (typeof THEMES)[Theme];

export function getTheme(raw: unknown): Theme {
  return raw === "light" ? "light" : "dark";
}

export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f7df1e",
  Go: "#00add8",
  Rust: "#dea584",
  Zig: "#ec915c",
  Kotlin: "#a97bff",
  Swift: "#f05138",
  Python: "#3572a5",
  Ruby: "#701516",
  Shell: "#89e051",
  Java: "#b07219",
  Svelte: "#ff3e00",
  HTML: "#e34c26",
  CSS: "#563d7c",
  "C++": "#f34b7d",
  "C#": "#178600",
  C: "#555555",
  Elixir: "#6e4a7e",
  Dockerfile: "#384d54",
};

export function langColor(lang: string | null): string {
  return lang ? (LANGUAGE_COLORS[lang] ?? "#8b8b8b") : "#8b8b8b";
}

export const FONT_FAMILY =
  '"SF Pro Display", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
export const FONT_MONO =
  '"SF Mono", "JetBrains Mono", "Menlo", "Consolas", monospace';
