import type { FrameDepthSignal, SignalResult } from "../types";
import { sha256 } from "../hash";

export async function collectFrameDepth(): Promise<SignalResult<FrameDepthSignal> | null> {
  const start = performance.now();

  try {
    let depth = 0;
    let current: Window = window;
    let crossOriginBoundary = false;

    while (true) {
      try {
        if (current.parent === current) break;
        depth += 1;
        current = current.parent;
      } catch {
        depth += 1;
        crossOriginBoundary = true;
        break;
      }
    }

    const topAccessible = !crossOriginBoundary;
    const isFramed = depth > 0;
    const hash = await sha256(
      [
        `isFramed:${String(isFramed)}`,
        `depth:${String(depth)}`,
        `topAccessible:${String(topAccessible)}`,
        `crossOriginBoundary:${String(crossOriginBoundary)}`,
      ].join("|"),
    );

    return {
      value: {
        isFramed,
        depth,
        topAccessible,
        crossOriginBoundary,
        hash,
      },
      duration: performance.now() - start,
    };
  } catch {
    return null;
  }
}
