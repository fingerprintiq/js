import type { SignalResult, ErrorSignal } from "../types";
import { sha256 } from "../hash";

export async function collectErrors(): Promise<SignalResult<ErrorSignal> | null> {
  const start = performance.now();
  try {
    const messages: string[] = [];

    // 1. null property access
    try { (null as unknown as Record<string, unknown>).x; } catch (e) { messages.push((e as Error).message); }

    // 2. undefined property access
    try { (undefined as unknown as Record<string, unknown>).x; } catch (e) { messages.push((e as Error).message); }

    // 3. spread undefined
    try { [...(undefined as unknown as Iterable<unknown>)]; } catch (e) { messages.push((e as Error).message); }

    // 4. eval syntax error
    try { eval(")"); } catch (e) { messages.push((e as Error).message); }

    // 5. invalid array length
    try { new Array(-1); } catch (e) { messages.push((e as Error).message); }

    // 6. repeat negative count
    try { "abc".repeat(-1); } catch (e) { messages.push((e as Error).message); }

    // 7. setPrototypeOf cycle
    try {
      const a = {};
      const b = {};
      Object.setPrototypeOf(a, b);
      Object.setPrototypeOf(b, a);
    } catch (e) { messages.push((e as Error).message); }

    // 8. invalid regex
    try { new RegExp("("); } catch (e) { messages.push((e as Error).message); }

    // 9. repeat Infinity
    try { "".repeat(Infinity); } catch (e) { messages.push((e as Error).message); }

    const hash = await sha256(messages.join("|"));

    return {
      value: { messages, hash },
      duration: performance.now() - start,
    };
  } catch {
    return null;
  }
}
