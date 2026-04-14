import type { SignalResult, HtmlElementSignal } from "../types";
import { sha256 } from "../hash";

export async function collectHtmlElement(): Promise<SignalResult<HtmlElementSignal> | null> {
  const start = performance.now();
  try {
    const properties = new Set<string>();
    let proto: object | null = document.documentElement;

    while (proto !== null) {
      try {
        const names = Object.getOwnPropertyNames(proto);
        for (const name of names) {
          properties.add(name);
        }
      } catch { /* ignore */ }
      proto = Object.getPrototypeOf(proto) as object | null;
    }

    const sorted = [...properties].sort();
    const propertyCount = sorted.length;
    const hash = await sha256(sorted.join(","));

    return {
      value: { propertyCount, hash },
      duration: performance.now() - start,
    };
  } catch {
    return null;
  }
}
