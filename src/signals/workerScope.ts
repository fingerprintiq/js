import type { SignalResult, WorkerScopeSignal } from "../types";

const WORKER_SCRIPT = `
self.onmessage = function() {
  var nav = {
    hardwareConcurrency: self.navigator.hardwareConcurrency || 0,
    platform: self.navigator.platform || '',
    languages: Array.from(self.navigator.languages || []),
    userAgent: self.navigator.userAgent || ''
  };

  var webgl = null;
  try {
    var canvas = new OffscreenCanvas(1, 1);
    var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      var ext = gl.getExtension('WEBGL_debug_renderer_info');
      if (ext) {
        webgl = {
          renderer: gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '',
          vendor: gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) || ''
        };
      }
    }
  } catch(e) {}

  self.postMessage({ nav: nav, webgl: webgl });
};
`;

export async function collectWorkerScope(): Promise<SignalResult<WorkerScopeSignal> | null> {
  const start = performance.now();
  try {
    if (typeof Worker === "undefined") return null;

    const blob = new Blob([WORKER_SCRIPT], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);

    const workerData = await new Promise<{ nav: WorkerScopeSignal["workerNavigator"]; webgl: WorkerScopeSignal["workerWebGL"] } | null>((resolve) => {
      let worker: Worker;
      const timeout = setTimeout(() => {
        try { worker.terminate(); } catch { /* ignore */ }
        URL.revokeObjectURL(url);
        resolve(null);
      }, 1200);

      try {
        worker = new Worker(url);
        worker.onmessage = (e: MessageEvent) => {
          clearTimeout(timeout);
          worker.terminate();
          URL.revokeObjectURL(url);
          resolve(e.data);
        };
        worker.onerror = () => {
          clearTimeout(timeout);
          URL.revokeObjectURL(url);
          resolve(null);
        };
        worker.postMessage(null);
      } catch {
        clearTimeout(timeout);
        URL.revokeObjectURL(url);
        resolve(null);
      }
    });

    const workerNavigator = workerData?.nav ?? null;
    const workerWebGL = workerData?.webgl ?? null;

    // Compare against main-thread navigator
    const mismatches: string[] = [];
    if (workerNavigator) {
      if (workerNavigator.hardwareConcurrency !== navigator.hardwareConcurrency) {
        mismatches.push("hardwareConcurrency");
      }
      if (workerNavigator.platform !== navigator.platform) {
        mismatches.push("platform");
      }
      if (workerNavigator.userAgent !== navigator.userAgent) {
        mismatches.push("userAgent");
      }
      const mainLangs = navigator.languages?.join(",") ?? "";
      const workerLangs = workerNavigator.languages?.join(",") ?? "";
      if (mainLangs !== workerLangs) {
        mismatches.push("languages");
      }
    }

    // Compare main-thread WebGL renderer/vendor when both contexts expose them.
    if (workerWebGL) {
      try {
        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl") as WebGLRenderingContext | null;
        const debugInfo = gl?.getExtension("WEBGL_debug_renderer_info");
        if (gl && debugInfo) {
          const mainRenderer = String(
            gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) ?? "",
          );
          const mainVendor = String(
            gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) ?? "",
          );
          if (
            workerWebGL.renderer &&
            mainRenderer &&
            workerWebGL.renderer !== mainRenderer
          ) {
            mismatches.push("webglRenderer");
          }
          if (
            workerWebGL.vendor &&
            mainVendor &&
            workerWebGL.vendor !== mainVendor
          ) {
            mismatches.push("webglVendor");
          }
        }
      } catch {
        // Ignore WebGL compare failures; worker navigator mismatches are still useful.
      }
    }

    return {
      value: {
        workerNavigator,
        workerWebGL,
        mismatches,
      },
      duration: performance.now() - start,
    };
  } catch {
    return null;
  }
}
