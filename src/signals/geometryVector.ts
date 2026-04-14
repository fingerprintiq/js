import type { GeometryVectorSignal, SignalResult } from "../types";
import { sha256 } from "../hash";

function roundNumber(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Number(value.toFixed(2));
}

export async function collectGeometryVector(): Promise<
  SignalResult<GeometryVectorSignal> | null
> {
  const start = performance.now();

  try {
    const viewport = window.visualViewport;
    const visualViewport =
      viewport != null
        ? {
            width: roundNumber(viewport.width) ?? 0,
            height: roundNumber(viewport.height) ?? 0,
            scale: roundNumber(viewport.scale) ?? 1,
            offsetLeft: roundNumber(viewport.offsetLeft) ?? 0,
            offsetTop: roundNumber(viewport.offsetTop) ?? 0,
          }
        : null;

    const value: GeometryVectorSignal = {
      screen: {
        width: screen.width ?? 0,
        height: screen.height ?? 0,
        availWidth: screen.availWidth ?? 0,
        availHeight: screen.availHeight ?? 0,
      },
      window: {
        innerWidth: window.innerWidth ?? 0,
        innerHeight: window.innerHeight ?? 0,
        outerWidth: window.outerWidth ?? 0,
        outerHeight: window.outerHeight ?? 0,
        devicePixelRatio: roundNumber(window.devicePixelRatio) ?? 1,
      },
      visualViewport,
      orientation: {
        type:
          typeof screen.orientation?.type === "string"
            ? screen.orientation.type
            : null,
        angle:
          typeof screen.orientation?.angle === "number"
            ? screen.orientation.angle
            : null,
      },
      chromeInsetX:
        window.outerWidth > 0 ? window.outerWidth - window.innerWidth : null,
      chromeInsetY:
        window.outerHeight > 0 ? window.outerHeight - window.innerHeight : null,
      suspiciousFlags: [],
      hash: "",
    };

    if (
      value.screen.availWidth > value.screen.width ||
      value.screen.availHeight > value.screen.height
    ) {
      value.suspiciousFlags.push("avail_exceeds_screen");
    }
    if (
      value.window.outerWidth > 0 &&
      value.window.innerWidth > value.window.outerWidth
    ) {
      value.suspiciousFlags.push("outer_width_smaller_than_inner");
    }
    if (
      value.window.outerHeight > 0 &&
      value.window.innerHeight > value.window.outerHeight
    ) {
      value.suspiciousFlags.push("outer_height_smaller_than_inner");
    }
    if (
      visualViewport &&
      (visualViewport.width > value.window.innerWidth + 1 ||
        visualViewport.height > value.window.innerHeight + 1)
    ) {
      value.suspiciousFlags.push("visual_viewport_exceeds_inner");
    }
    if (
      value.orientation.type?.startsWith("portrait") &&
      value.screen.width > value.screen.height
    ) {
      value.suspiciousFlags.push("orientation_screen_mismatch");
    }
    if (
      value.orientation.type?.startsWith("landscape") &&
      value.screen.height > value.screen.width
    ) {
      value.suspiciousFlags.push("orientation_screen_mismatch");
    }

    const hashInput = [
      `screen:${value.screen.width}x${value.screen.height}:${value.screen.availWidth}x${value.screen.availHeight}`,
      `window:${value.window.innerWidth}x${value.window.innerHeight}:${value.window.outerWidth}x${value.window.outerHeight}@${value.window.devicePixelRatio}`,
      `visualViewport:${
        visualViewport
          ? `${visualViewport.width}x${visualViewport.height}@${visualViewport.scale}:${visualViewport.offsetLeft},${visualViewport.offsetTop}`
          : "none"
      }`,
      `orientation:${value.orientation.type ?? ""}:${String(value.orientation.angle ?? "")}`,
      `chromeInsets:${String(value.chromeInsetX ?? "")},${String(value.chromeInsetY ?? "")}`,
      `flags:${value.suspiciousFlags.join(",")}`,
    ];
    value.hash = await sha256(hashInput.join("|"));

    return {
      value,
      duration: performance.now() - start,
    };
  } catch {
    return null;
  }
}
