import { describe, it, expect, vi, beforeEach } from "vitest";
import { collectWorkerScope } from "../../signals/workerScope";

// jsdom lacks the blob URL APIs used by the worker probe.
if (!URL.createObjectURL) {
  URL.createObjectURL = () => "blob:mock";
}
if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = () => {};
}

describe("collectWorkerScope", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null when Worker is unavailable", async () => {
    const origWorker = (globalThis as Record<string, unknown>).Worker;
    delete (globalThis as Record<string, unknown>).Worker;
    const result = await collectWorkerScope();
    expect(result).toBeNull();
    if (origWorker) (globalThis as Record<string, unknown>).Worker = origWorker;
  });

  it("returns expected shape when Worker is available", async () => {
    const mockWorkerData = {
      nav: {
        hardwareConcurrency: 4,
        platform: "Win32",
        languages: ["en-US", "en"],
        userAgent: "Mozilla/5.0",
      },
      webgl: { renderer: "ANGLE", vendor: "Google Inc." },
    };

    class MockWorker {
      onmessage: ((e: MessageEvent) => void) | null = null;
      onerror: ((e: ErrorEvent) => void) | null = null;
      postMessage(_: unknown) {
        setTimeout(() => {
          if (this.onmessage) {
            this.onmessage({ data: mockWorkerData } as MessageEvent);
          }
        }, 0);
      }
      terminate() {}
    }

    (globalThis as Record<string, unknown>).Worker = MockWorker;

    vi.spyOn(navigator, "hardwareConcurrency", "get").mockReturnValue(4);
    vi.spyOn(navigator, "platform", "get").mockReturnValue("Win32");
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0");
    vi.spyOn(navigator, "languages", "get").mockReturnValue(["en-US", "en"]);

    const result = await collectWorkerScope();
    expect(result).not.toBeNull();
    expect(result!.value.workerNavigator).not.toBeNull();
    expect(result!.value.workerNavigator!.hardwareConcurrency).toBe(4);
    expect(result!.value.workerWebGL).not.toBeNull();
    expect(result!.value.mismatches).toEqual([]);
    expect(result!.duration).toBeGreaterThanOrEqual(0);
  });

  it("detects mismatches between worker and main thread", async () => {
    const mockWorkerData = {
      nav: {
        hardwareConcurrency: 8, // different from main thread (4)
        platform: "Win32",
        languages: ["en-US"],
        userAgent: "Mozilla/5.0",
      },
      webgl: null,
    };

    class MockWorker {
      onmessage: ((e: MessageEvent) => void) | null = null;
      onerror: ((e: ErrorEvent) => void) | null = null;
      postMessage(_: unknown) {
        setTimeout(() => {
          if (this.onmessage) {
            this.onmessage({ data: mockWorkerData } as MessageEvent);
          }
        }, 0);
      }
      terminate() {}
    }

    (globalThis as Record<string, unknown>).Worker = MockWorker;

    vi.spyOn(navigator, "hardwareConcurrency", "get").mockReturnValue(4);
    vi.spyOn(navigator, "platform", "get").mockReturnValue("Win32");
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0");
    vi.spyOn(navigator, "languages", "get").mockReturnValue(["en-US"]);

    const result = await collectWorkerScope();
    expect(result).not.toBeNull();
    expect(result!.value.mismatches).toContain("hardwareConcurrency");
  });
});
