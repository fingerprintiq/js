import type { IntegritySignal, SignalResult } from "../types";

const NATIVE_CODE_REGEX = /\[native code\]/;

function isNative(fn: unknown): boolean {
  if (typeof fn !== "function") return false;
  try {
    return NATIVE_CODE_REGEX.test(Function.prototype.toString.call(fn));
  } catch { return false; }
}

function checkPropertyDescriptors(fn: unknown): boolean {
  if (typeof fn !== "function") return true;
  try {
    const keys = Object.getOwnPropertyNames(fn);
    // Native functions typically only have 'length', 'name', and 'prototype' (for constructors)
    const unexpected = keys.filter((k) => !["length", "name", "prototype", "arguments", "caller"].includes(k));
    return unexpected.length === 0;
  } catch { return true; }
}

function checkPrototypeChain(fn: unknown, expectedProto: unknown): boolean {
  if (typeof fn !== "function") return true;
  try {
    const proto = Object.getPrototypeOf(fn);
    return proto === expectedProto;
  } catch { return true; }
}

interface ApiCheck {
  name: string;
  get: () => unknown;
  expectedProto?: unknown;
}

function getApiChecks(): ApiCheck[] {
  const checks: ApiCheck[] = [];
  const fnProto = Function.prototype;

  if (typeof HTMLCanvasElement !== "undefined") {
    checks.push({ name: "HTMLCanvasElement.toDataURL", get: () => HTMLCanvasElement.prototype.toDataURL, expectedProto: fnProto });
    checks.push({ name: "HTMLCanvasElement.getContext", get: () => HTMLCanvasElement.prototype.getContext, expectedProto: fnProto });
  }
  if (typeof CanvasRenderingContext2D !== "undefined") {
    checks.push({ name: "CanvasRenderingContext2D.getImageData", get: () => CanvasRenderingContext2D.prototype.getImageData, expectedProto: fnProto });
    checks.push({ name: "CanvasRenderingContext2D.measureText", get: () => CanvasRenderingContext2D.prototype.measureText, expectedProto: fnProto });
  }
  if (typeof WebGLRenderingContext !== "undefined") {
    checks.push({ name: "WebGLRenderingContext.getParameter", get: () => WebGLRenderingContext.prototype.getParameter, expectedProto: fnProto });
    checks.push({ name: "WebGLRenderingContext.getExtension", get: () => WebGLRenderingContext.prototype.getExtension, expectedProto: fnProto });
  }

  checks.push({ name: "Date.getTimezoneOffset", get: () => Date.prototype.getTimezoneOffset, expectedProto: fnProto });
  checks.push({ name: "Intl.DateTimeFormat.resolvedOptions", get: () => Intl.DateTimeFormat.prototype.resolvedOptions, expectedProto: fnProto });
  checks.push({ name: "Element.getBoundingClientRect", get: () => typeof Element !== "undefined" ? Element.prototype.getBoundingClientRect : undefined, expectedProto: fnProto });

  // Check navigator property getters
  try {
    const hwDesc = Object.getOwnPropertyDescriptor(Navigator.prototype, "hardwareConcurrency");
    if (hwDesc?.get) checks.push({ name: "navigator.hardwareConcurrency.get", get: () => hwDesc.get, expectedProto: fnProto });
  } catch { /* skip */ }

  try {
    const langDesc = Object.getOwnPropertyDescriptor(Navigator.prototype, "languages");
    if (langDesc?.get) checks.push({ name: "navigator.languages.get", get: () => langDesc.get, expectedProto: fnProto });
  } catch { /* skip */ }

  try {
    const uaDesc = Object.getOwnPropertyDescriptor(Navigator.prototype, "userAgent");
    if (uaDesc?.get) checks.push({ name: "navigator.userAgent.get", get: () => uaDesc.get, expectedProto: fnProto });
  } catch { /* skip */ }

  return checks;
}

export async function collectIntegrity(): Promise<SignalResult<IntegritySignal>> {
  const start = performance.now();
  const tamperedApis: string[] = [];
  let lieScore = 0;

  const checks = getApiChecks();

  for (const check of checks) {
    try {
      const fn = check.get();
      if (fn === undefined) continue;

      // Test 1: toString native code check
      if (!isNative(fn)) {
        tamperedApis.push(check.name);
        lieScore += 1;
        continue;
      }

      // Test 2: Property descriptor check
      if (!checkPropertyDescriptors(fn)) {
        tamperedApis.push(`${check.name}:props`);
        lieScore += 0.5;
      }

      // Test 3: Prototype chain check
      if (check.expectedProto && !checkPrototypeChain(fn, check.expectedProto)) {
        tamperedApis.push(`${check.name}:proto`);
        lieScore += 0.5;
      }
    } catch {
      tamperedApis.push(check.name);
      lieScore += 1;
    }
  }

  // Test 4: Check if Function.prototype.toString itself is tampered
  try {
    const toStringStr = Function.prototype.toString.call(Function.prototype.toString);
    if (!NATIVE_CODE_REGEX.test(toStringStr)) {
      tamperedApis.push("Function.prototype.toString");
      lieScore += 2; // This is a strong signal — it means ALL toString checks are unreliable
    }
  } catch {
    tamperedApis.push("Function.prototype.toString");
    lieScore += 2;
  }

  return {
    value: {
      tamperedApis,
      workerMismatch: false, // Updated by collect.ts after worker comparison
      lieScore: Math.min(lieScore, 10),
    },
    duration: performance.now() - start,
  };
}
