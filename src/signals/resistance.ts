import type { SignalResult, ResistanceSignal } from "../types";

function measureTimerPrecision(): number {
  const samples: number[] = [];
  let prev = performance.now();
  for (let i = 0; i < 100; i++) {
    const now = performance.now();
    const delta = now - prev;
    if (delta > 0) samples.push(delta);
    prev = now;
  }
  if (samples.length === 0) return 0;
  samples.sort((a, b) => a - b);
  return samples[0];
}

export async function collectResistance(): Promise<SignalResult<ResistanceSignal> | null> {
  const start = performance.now();
  try {
    const timerPrecisionMs = measureTimerPrecision();

    // Detect browser
    let browser: string | null = null;

    // Brave detection
    try {
      const nav = navigator as Navigator & { brave?: { isBrave: () => Promise<boolean> } };
      if (nav.brave) {
        const isBrave = await nav.brave.isBrave();
        if (isBrave) browser = "brave";
      }
    } catch { /* ignore */ }

    // Tor detection: screen dimensions rounded to 200x100 multiples AND high timer precision
    if (!browser) {
      try {
        const isScreenRounded =
          screen.width % 200 === 0 &&
          screen.height % 100 === 0;
        if (isScreenRounded && timerPrecisionMs >= 50) {
          browser = "tor";
        }
      } catch { /* ignore */ }
    }

    // Firefox RFP (Resist Fingerprinting) detection
    if (!browser && timerPrecisionMs >= 80) {
      browser = "firefox-rfp";
    }

    // Detect extensions
    const extensions: string[] = [];

    // DuckDuckGo Privacy Essentials
    try {
      const ddgEl = document.querySelector("[data-duckduckgo-privacy]") ??
        document.querySelector("[ddg-extension-hide]");
      if (ddgEl) extensions.push("duckduckgo");
    } catch { /* ignore */ }

    // CanvasBlocker: canvas toDataURL differs between calls
    try {
      const cbCanvas = document.createElement("canvas");
      cbCanvas.width = 16;
      cbCanvas.height = 16;
      const cbCtx = cbCanvas.getContext("2d");
      if (cbCtx) {
        cbCtx.fillStyle = "red";
        cbCtx.fillRect(0, 0, 16, 16);
        const url1 = cbCanvas.toDataURL();
        const url2 = cbCanvas.toDataURL();
        if (url1 !== url2) extensions.push("canvas-blocker");
      }
    } catch { /* ignore */ }

    // JShelter: WebGL getParameter toString check
    try {
      const jsCanvas = document.createElement("canvas");
      const gl = jsCanvas.getContext("webgl") as (WebGLRenderingContext & { getParameter: { toString?: () => string } }) | null;
      if (gl) {
        const gpStr = gl.getParameter.toString?.() ?? "";
        if (gpStr.includes("native") === false && gpStr.length > 0) {
          extensions.push("jshelter");
        }
      }
    } catch { /* ignore */ }

    // Trace extension: navigator.plugins descriptor check
    try {
      const pluginsDescriptor = Object.getOwnPropertyDescriptor(Navigator.prototype, "plugins") ??
        Object.getOwnPropertyDescriptor(navigator, "plugins");
      if (pluginsDescriptor && pluginsDescriptor.get) {
        const getterStr = pluginsDescriptor.get.toString();
        if (!getterStr.includes("[native code]")) {
          extensions.push("trace");
        }
      }
    } catch { /* ignore */ }

    return {
      value: {
        browser,
        extensions,
        timerPrecisionMs,
      },
      duration: performance.now() - start,
    };
  } catch {
    return null;
  }
}
