import type { MathSignal, SignalResult } from "../types";

const MATH_TESTS: Array<() => number> = [
  () => Math.acos(0.123456789),
  () => Math.asin(0.123456789),
  () => Math.atan(0.123456789),
  () => Math.atan2(0.123456789, 0.987654321),
  () => Math.cos(0.123456789),
  () => Math.sin(0.123456789),
  () => Math.tan(0.123456789),
  () => Math.exp(0.123456789),
  () => Math.log(0.123456789),
  () => Math.sqrt(0.123456789),
  () => Math.sinh(0.123456789),
  () => Math.cosh(0.123456789),
  () => Math.tanh(0.123456789),
  () => Math.expm1(0.123456789),
  () => Math.log1p(0.123456789),
  () => Math.cbrt(0.123456789),
  () => Math.hypot(0.123456789, 0.987654321),
  () => Math.fround(0.123456789),
  () => Math.clz32(0.123456789),
  () => Math.log2(0.123456789),
  () => Math.log10(0.123456789),
];

export async function collectMath(): Promise<SignalResult<MathSignal>> {
  const start = performance.now();
  const values = MATH_TESTS.map((fn) => fn());

  // Create a hash from the concatenated values
  const hashInput = values.map((v) => v.toString()).join(",");
  const data = new TextEncoder().encode(hashInput);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return {
    value: { values, hash },
    duration: performance.now() - start,
  };
}
