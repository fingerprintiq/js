/**
 * Web Worker script for cross-context signal comparison.
 * Extensions cannot inject into Web Workers, so diffing main thread
 * vs worker results detects tampering.
 */
export const WORKER_SCRIPT = `
self.onmessage = async function(e) {
  const results = {};

  // Navigator properties (can be spoofed on main thread but not in Worker)
  try {
    results.hardwareConcurrency = navigator.hardwareConcurrency || 0;
    results.language = navigator.language || '';
    results.languages = Array.from(navigator.languages || []);
    results.platform = navigator.platform || '';
    results.userAgent = navigator.userAgent || '';
  } catch (e) {
    results.navigatorError = true;
  }

  // Math precision (should be identical in both contexts)
  try {
    results.mathAcos = Math.acos(0.123456789);
    results.mathSinh = Math.sinh(0.123456789);
    results.mathTanh = Math.tanh(0.123456789);
  } catch (e) {
    results.mathError = true;
  }

  // OffscreenCanvas (if available)
  try {
    if (typeof OffscreenCanvas !== 'undefined') {
      const canvas = new OffscreenCanvas(200, 100);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(0, 0, 200, 100);
        ctx.font = '16px Arial';
        ctx.fillStyle = '#000';
        ctx.fillText('FingerprintIQ', 10, 50);
        const blob = await canvas.convertToBlob();
        const buffer = await blob.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        results.canvasHash = Array.from(new Uint8Array(hashBuffer))
          .map(b => b.toString(16).padStart(2, '0')).join('');
      }
      results.hasOffscreenCanvas = true;
    } else {
      results.hasOffscreenCanvas = false;
    }
  } catch (e) {
    results.canvasError = true;
  }

  self.postMessage(results);
};
`;

/**
 * Run the worker and compare results against main thread values.
 * Returns list of mismatched properties.
 */
export async function runWorkerCheck(mainThreadValues: {
  hardwareConcurrency: number;
  language: string;
  languages: string[];
  platform: string;
  userAgent: string;
}): Promise<{ mismatches: string[]; workerResults: Record<string, unknown> }> {
  return new Promise((resolve) => {
    try {
      const blob = new Blob([WORKER_SCRIPT], { type: "application/javascript" });
      const url = URL.createObjectURL(blob);
      const worker = new Worker(url);
      const mismatches: string[] = [];

      const timeout = setTimeout(() => {
        worker.terminate();
        URL.revokeObjectURL(url);
        resolve({ mismatches: ["worker_timeout"], workerResults: {} });
      }, 3000);

      worker.onmessage = (e: MessageEvent) => {
        clearTimeout(timeout);
        const results = e.data as Record<string, unknown>;

        // Compare navigator properties
        if (results.hardwareConcurrency !== mainThreadValues.hardwareConcurrency) {
          mismatches.push("hardwareConcurrency");
        }
        if (results.language !== mainThreadValues.language) {
          mismatches.push("language");
        }
        if (results.platform !== mainThreadValues.platform) {
          mismatches.push("platform");
        }
        if (results.userAgent !== mainThreadValues.userAgent) {
          mismatches.push("userAgent");
        }
        if (JSON.stringify(results.languages) !== JSON.stringify(mainThreadValues.languages)) {
          mismatches.push("languages");
        }

        worker.terminate();
        URL.revokeObjectURL(url);
        resolve({ mismatches, workerResults: results });
      };

      worker.onerror = () => {
        clearTimeout(timeout);
        worker.terminate();
        URL.revokeObjectURL(url);
        resolve({ mismatches: ["worker_error"], workerResults: {} });
      };

      worker.postMessage("collect");
    } catch {
      resolve({ mismatches: ["worker_unavailable"], workerResults: {} });
    }
  });
}
