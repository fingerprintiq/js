import type { SignalResult } from "../types";

export interface VirtualizationSignal {
  vmDetected: boolean;
  emulatorDetected: boolean;
  indicators: string[];
  confidence: "low" | "medium" | "high";
}

const VM_RENDERER_PATTERNS = [
  "swiftshader",
  "llvmpipe",
  "virtualbox",
  "vmware",
  "parallels",
  "microsoft basic render",
  "hyper-v",
  "qemu",
];

const VM_SCREEN_RESOLUTIONS = [
  [1024, 768],
  [800, 600],
];

const EMULATOR_SCREEN_RESOLUTIONS = [
  [360, 640],
  [412, 915],
];

export async function collectVirtualization(): Promise<SignalResult<VirtualizationSignal>> {
  const start = performance.now();
  const vmIndicators: string[] = [];
  const emulatorIndicators: string[] = [];

  // --- VM Heuristics ---

  // 1. WebGL renderer matches VM patterns
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (gl) {
      const glCtx = gl as WebGLRenderingContext;
      const debugExt = glCtx.getExtension("WEBGL_debug_renderer_info");
      if (debugExt) {
        const renderer = glCtx.getParameter(debugExt.UNMASKED_RENDERER_WEBGL)?.toLowerCase() ?? "";
        const vendor = glCtx.getParameter(debugExt.UNMASKED_VENDOR_WEBGL)?.toLowerCase() ?? "";
        const combined = renderer + " " + vendor;
        for (const pattern of VM_RENDERER_PATTERNS) {
          if (combined.includes(pattern)) {
            vmIndicators.push("vm_renderer:" + pattern);
            break;
          }
        }
      }
    }
  } catch { /* ignore */ }

  // 2. Low hardware specs: hardwareConcurrency === 1 AND deviceMemory <= 2
  try {
    const cores = navigator.hardwareConcurrency ?? 0;
    const mem = (navigator as unknown as Record<string, unknown>).deviceMemory as number | undefined;
    if (cores === 1 && typeof mem === "number" && mem <= 2) {
      vmIndicators.push("low_hw_specs");
    }
  } catch { /* ignore */ }

  // 3. Battery always-plugged profile
  try {
    const nav = navigator as unknown as Record<string, Function>;
    if (typeof nav.getBattery === "function") {
      const battery = await nav.getBattery() as {
        charging: boolean;
        level: number;
        chargingTime: number;
        dischargingTime: number;
      };
      if (
        battery.charging === true &&
        battery.level === 1 &&
        battery.chargingTime === 0 &&
        battery.dischargingTime === Infinity
      ) {
        vmIndicators.push("battery_always_plugged");
      }
    }
  } catch { /* ignore */ }

  // 4. Performance.now() timing jitter (stddev > 0.5ms over 10 samples)
  try {
    const samples: number[] = [];
    for (let i = 0; i < 10; i++) {
      const t0 = performance.now();
      // Small busy loop to create a measurable interval
      let x = 0;
      for (let j = 0; j < 1000; j++) x += j;
      void x;
      samples.push(performance.now() - t0);
    }
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    const variance = samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length;
    const stddev = Math.sqrt(variance);
    if (stddev > 0.5) {
      vmIndicators.push("timing_jitter");
    }
  } catch { /* ignore */ }

  // 5. Common VM screen resolutions with DPR 1
  try {
    const w = screen.width;
    const h = screen.height;
    const dpr = window.devicePixelRatio;
    if (dpr === 1) {
      for (const [rw, rh] of VM_SCREEN_RESOLUTIONS) {
        if (w === rw && h === rh) {
          vmIndicators.push("vm_screen_resolution:" + rw + "x" + rh);
          break;
        }
      }
    }
  } catch { /* ignore */ }

  // --- Emulator Heuristics ---

  // 6. maxTouchPoints > 0 but ontouchstart missing
  try {
    if (navigator.maxTouchPoints > 0 && !("ontouchstart" in window)) {
      emulatorIndicators.push("touch_mismatch");
    }
  } catch { /* ignore */ }

  // 7. Mobile UA but desktop-class specs (cores > 8 or memory > 8)
  try {
    const ua = navigator.userAgent.toLowerCase();
    const isMobileUA = /android|iphone|ipad|ipod|mobile/.test(ua);
    if (isMobileUA) {
      const cores = navigator.hardwareConcurrency ?? 0;
      const mem = (navigator as unknown as Record<string, unknown>).deviceMemory as number | undefined;
      if (cores > 8 || (typeof mem === "number" && mem > 8)) {
        emulatorIndicators.push("mobile_ua_desktop_specs");
      }
    }
  } catch { /* ignore */ }

  // 8. Exact emulator screen sizes with DPR 1
  try {
    const w = screen.width;
    const h = screen.height;
    const dpr = window.devicePixelRatio;
    if (dpr === 1) {
      for (const [rw, rh] of EMULATOR_SCREEN_RESOLUTIONS) {
        if (w === rw && h === rh) {
          emulatorIndicators.push("emulator_screen_resolution:" + rw + "x" + rh);
          break;
        }
      }
    }
  } catch { /* ignore */ }

  // --- Compute results ---
  const allIndicators = [...vmIndicators, ...emulatorIndicators];
  const vmDetected = vmIndicators.length >= 2;
  const emulatorDetected = emulatorIndicators.length >= 2 || (emulatorIndicators.length >= 1 && vmIndicators.length >= 1);

  let confidence: "low" | "medium" | "high";
  if (allIndicators.length >= 3) {
    confidence = "high";
  } else if (allIndicators.length === 2) {
    confidence = "medium";
  } else {
    confidence = "low";
  }

  return {
    value: {
      vmDetected,
      emulatorDetected,
      indicators: allIndicators,
      confidence,
    },
    duration: performance.now() - start,
  };
}
