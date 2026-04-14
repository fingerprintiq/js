import type { SignalResult, ScreenSignal } from "../types";

const FIREFOX_RFP_WIDTHS = [1000, 1400, 1600];

export async function collectScreen(): Promise<SignalResult<ScreenSignal>> {
  const start = performance.now();

  const width = screen.width ?? 0;
  const height = screen.height ?? 0;
  const availWidth = screen.availWidth ?? 0;
  const availHeight = screen.availHeight ?? 0;
  const colorDepth = screen.colorDepth ?? 0;
  const pixelRatio = window.devicePixelRatio ?? 1;

  const isFirefoxRfp =
    FIREFOX_RFP_WIDTHS.includes(width) &&
    width === height &&
    pixelRatio === 1;

  return {
    value: {
      width,
      height,
      availWidth,
      availHeight,
      colorDepth,
      pixelRatio,
      isFirefoxRfp,
    },
    duration: performance.now() - start,
  };
}
