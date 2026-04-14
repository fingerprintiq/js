import type { SignalResult, WasmTimingSignal } from "../types";

const ITERATIONS = 10;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function stddev(values: number[], mean: number): number {
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Build a minimal WASM module programmatically that runs a compute loop.
 * The module exports a function "bench" that computes sum of i*i for i in [0, 100000).
 */
function buildWasmModule(): Uint8Array {
  return new Uint8Array([
    0x00, 0x61, 0x73, 0x6d, // magic: \0asm
    0x01, 0x00, 0x00, 0x00, // version: 1
    // Type section (id=1): one function type () -> (i32)
    0x01, 0x05, 0x01, 0x60, 0x00, 0x01, 0x7f,
    // Function section (id=3): one function using type index 0
    0x03, 0x02, 0x01, 0x00,
    // Export section (id=7): export "bench" as function 0
    0x07, 0x09, 0x01, 0x05, 0x62, 0x65, 0x6e, 0x63, 0x68, 0x00, 0x00,
    // Code section (id=10): one function body
    0x0a, 0x23, 0x01, // section id, section size=35, count=1
    0x21,             // body size=33
    // Locals: 1 group of 2 x i32
    0x01, 0x02, 0x7f,
    // loop
    0x03, 0x40,
    // sum = sum + i*i
    0x20, 0x01,       // local.get 1 (sum)
    0x20, 0x00,       // local.get 0 (i)
    0x20, 0x00,       // local.get 0 (i)
    0x6c,             // i32.mul
    0x6a,             // i32.add
    0x21, 0x01,       // local.set 1
    // i = i + 1; if i < 100000 branch back
    0x20, 0x00,       // local.get 0 (i)
    0x41, 0x01,       // i32.const 1
    0x6a,             // i32.add
    0x22, 0x00,       // local.tee 0
    0x41, 0xa0, 0x8d, 0x06, // i32.const 100000 (LEB128)
    0x49,             // i32.lt_u
    0x0d, 0x00,       // br_if 0
    0x0b,             // end loop
    0x20, 0x01,       // local.get 1 (return sum)
    0x0b,             // end function
  ]);
}

export async function collectWasmTiming(): Promise<SignalResult<WasmTimingSignal> | null> {
  const start = performance.now();
  try {
    if (typeof WebAssembly === "undefined") return null;

    const wasmBytes = buildWasmModule();
    const module = await WebAssembly.compile(wasmBytes.buffer as ArrayBuffer);
    const instance = await WebAssembly.instantiate(module);
    const bench = instance.exports["bench"] as () => number;

    const timings: number[] = [];
    for (let i = 0; i < ITERATIONS; i++) {
      const t0 = performance.now();
      bench();
      timings.push(performance.now() - t0);
    }

    const med = median(timings);
    const sd = stddev(timings, med);

    return { value: { medianMs: med, stddevMs: sd }, duration: performance.now() - start };
  } catch {
    return null;
  }
}
