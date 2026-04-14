import type { SignalResult, MediaSignal } from "../types";

function query(mq: string): boolean {
  try {
    return typeof matchMedia !== "undefined" && matchMedia(mq).matches;
  } catch { return false; }
}

function firstMatch(queries: Array<[string, string]>): string {
  for (const [mq, value] of queries) {
    if (query(mq)) return value;
  }
  return queries[queries.length - 1]?.[1] ?? "";
}

export async function collectMedia(): Promise<SignalResult<MediaSignal>> {
  const start = performance.now();

  const colorScheme = firstMatch([
    ["(prefers-color-scheme: dark)", "dark"],
    ["(prefers-color-scheme: light)", "light"],
    ["(prefers-color-scheme: no-preference)", "no-preference"],
  ]);

  const contrast = firstMatch([
    ["(prefers-contrast: more)", "more"],
    ["(prefers-contrast: less)", "less"],
    ["(prefers-contrast: no-preference)", "no-preference"],
  ]);

  const forcedColors = query("(forced-colors: active)");

  const pointer = firstMatch([
    ["(pointer: fine)", "fine"],
    ["(pointer: coarse)", "coarse"],
    ["(pointer: none)", "none"],
  ]);

  const hover = firstMatch([
    ["(hover: hover)", "hover"],
    ["(hover: none)", "none"],
  ]);

  const displayMode = firstMatch([
    ["(display-mode: fullscreen)", "fullscreen"],
    ["(display-mode: standalone)", "standalone"],
    ["(display-mode: minimal-ui)", "minimal-ui"],
    ["(display-mode: browser)", "browser"],
  ]);

  const reducedMotion = query("(prefers-reduced-motion: reduce)");

  const colorGamut = firstMatch([
    ["(color-gamut: rec2020)", "rec2020"],
    ["(color-gamut: p3)", "p3"],
    ["(color-gamut: srgb)", "srgb"],
  ]);

  return {
    value: {
      colorScheme,
      contrast,
      forcedColors,
      pointer,
      hover,
      displayMode,
      reducedMotion,
      colorGamut,
    },
    duration: performance.now() - start,
  };
}
