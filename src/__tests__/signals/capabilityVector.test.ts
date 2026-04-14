import { beforeEach, describe, expect, it, vi } from "vitest";
import { collectCapabilityVector } from "../../signals/capabilityVector";

describe("collectCapabilityVector", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "plugins", {
      configurable: true,
      value: [
        { name: "Chrome PDF Viewer" },
        { name: "Test Plugin" },
      ],
    });
    Object.defineProperty(navigator, "pdfViewerEnabled", {
      configurable: true,
      value: true,
    });
    Object.defineProperty(navigator, "globalPrivacyControl", {
      configurable: true,
      value: true,
    });
    Object.defineProperty(navigator, "gpu", {
      configurable: true,
      value: {},
    });
    Object.defineProperty(navigator, "virtualKeyboard", {
      configurable: true,
      value: {},
    });
    Object.defineProperty(navigator, "mediaCapabilities", {
      configurable: true,
      value: {},
    });
    Object.defineProperty(navigator, "keyboard", {
      configurable: true,
      value: { getLayoutMap: vi.fn() },
    });
    Object.defineProperty(navigator, "bluetooth", {
      configurable: true,
      value: {},
    });
    Object.defineProperty(navigator, "usb", {
      configurable: true,
      value: {},
    });
    Object.defineProperty(navigator, "hid", {
      configurable: true,
      value: {},
    });
    Object.defineProperty(navigator, "serial", {
      configurable: true,
      value: {},
    });
    Object.defineProperty(navigator, "userAgentData", {
      configurable: true,
      value: { getHighEntropyValues: vi.fn() },
    });
    (globalThis as Record<string, unknown>).speechSynthesis = {};
    (globalThis as Record<string, unknown>).webkitSpeechRecognition =
      function SpeechRecognition() {};
  });

  it("collects a stable capability summary", async () => {
    const result = await collectCapabilityVector();

    expect(result).not.toBeNull();
    expect(result?.value.hasPdfPlugin).toBe(true);
    expect(result?.value.hasWebGPU).toBe(true);
    expect(result?.value.hasHighEntropyUaHints).toBe(true);
    expect(result?.value.hash).toHaveLength(64);
    expect(result?.value.suspiciousFlags).toEqual([]);
  });

  it("flags PDF capability mismatches", async () => {
    Object.defineProperty(navigator, "plugins", {
      configurable: true,
      value: [],
    });

    const result = await collectCapabilityVector();

    expect(result?.value.suspiciousFlags).toContain("pdf_viewer_mismatch");
  });
});
