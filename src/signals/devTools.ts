import type { SignalResult } from "../types";

export interface DevToolsSignal {
  isOpen: boolean;
  indicators: string[];
}

export async function collectDevTools(): Promise<SignalResult<DevToolsSignal>> {
  const start = performance.now();
  const indicators: string[] = [];

  // Method 1: debugger statement timing
  // When DevTools is open, the debugger statement pauses execution (>100ms)
  try {
    const t0 = performance.now();
    new Function("debugger")();
    const elapsed = performance.now() - t0;
    if (elapsed > 100) {
      indicators.push("debugger_timing");
    }
  } catch { /* ignore */ }

  // Method 2: Window outer vs inner size differential
  // DevTools panels take up space, causing a large diff between outer and inner dimensions
  try {
    const widthDiff = window.outerWidth - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;
    if (widthDiff > 160 || heightDiff > 200) {
      indicators.push("window_size_diff");
    }
  } catch { /* ignore */ }

  // Method 3: console.log with getter side-effect object
  // DevTools eagerly evaluates logged objects, triggering the getter
  try {
    let consoleTriggered = false;
    const element = new Image();
    Object.defineProperty(element, "id", {
      get() {
        consoleTriggered = true;
        return "devtools-detect";
      },
    });
    console.log("%c", element as unknown as string);
    if (consoleTriggered) {
      indicators.push("console_getter");
    }
  } catch { /* ignore */ }

  // Method 4: Element ID getter fires when DevTools inspects DOM
  try {
    let idGetterFired = false;
    const el = document.createElement("div");
    Object.defineProperty(el, "id", {
      get() {
        idGetterFired = true;
        return "devtools-trap";
      },
      configurable: true,
    });
    console.debug(el);
    if (idGetterFired) {
      indicators.push("element_id_getter");
    }
  } catch { /* ignore */ }

  return {
    value: {
      isOpen: indicators.length >= 1,
      indicators,
    },
    duration: performance.now() - start,
  };
}
