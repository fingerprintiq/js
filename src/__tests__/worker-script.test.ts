import { describe, it, expect } from "vitest";
import { WORKER_SCRIPT } from "../worker-script";

describe("WORKER_SCRIPT", () => {
  it("is a non-empty string containing signal collection code", () => {
    expect(typeof WORKER_SCRIPT).toBe("string");
    expect(WORKER_SCRIPT.length).toBeGreaterThan(100);
    expect(WORKER_SCRIPT).toContain("hardwareConcurrency");
    expect(WORKER_SCRIPT).toContain("self.postMessage");
  });
});
