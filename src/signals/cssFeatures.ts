import type { CssFeatureSignal, SignalResult } from "../types";
import { sha256 } from "../hash";

const FEATURE_QUERIES: Record<string, string> = {
  containerQueries: "(container-type: inline-size)",
  colorMix: "color: color-mix(in srgb, red 50%, blue)",
  hasSelector: "selector(:has(*))",
  okLch: "color: oklch(60% 0.15 240)",
  dynamicViewport: "height: 100dvh",
  viewTransitions: "view-transition-name: hero",
  scrollbarGutter: "scrollbar-gutter: stable",
  nesting: "selector(&)",
  accentColor: "accent-color: auto",
  textWrapBalance: "text-wrap: balance",
  backdropFilter: "backdrop-filter: blur(1px)",
  subgrid: "grid-template-columns: subgrid",
};

export async function collectCssFeatures(): Promise<SignalResult<CssFeatureSignal> | null> {
  const start = performance.now();

  try {
    const supports =
      typeof CSS !== "undefined" && typeof CSS.supports === "function"
        ? CSS.supports.bind(CSS)
        : null;

    const features = Object.fromEntries(
      Object.entries(FEATURE_QUERIES).map(([key, query]) => [
        key,
        supports ? supports(query) : false,
      ]),
    );
    const supportedCount = Object.values(features).filter(Boolean).length;
    const hash = await sha256(
      Object.entries(features)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}:${String(value)}`)
        .join("|"),
    );

    return {
      value: {
        features,
        supportedCount,
        hash,
      },
      duration: performance.now() - start,
    };
  } catch {
    return null;
  }
}
