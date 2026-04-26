import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../collect", () => ({
  collectAllSignals: vi.fn().mockResolvedValue({
    canvas: { value: { hash: "abc", isFarbled: false }, duration: 5 },
    webgl: null, webgpu: null, audio: null, fonts: null, webrtc: null,
    wasmTiming: null, navigator: null, media: null, screen: null,
    integrity: null, wallets: null, storage: null, math: null, domRect: null,
    headless: null, speech: null, intl: null, timezone: null, cssStyle: null,
    cssFeatures: null,
    error: null, workerScope: null, resistance: null, svg: null,
    windowFeatures: null, htmlElement: null, codec: null, status: null,
    platformFeatures: null, uaClientHints: null, capabilityVector: null,
    geometryVector: null, runtimeVector: null, sensorCapabilities: null,
    behavioralRisk: null,
    frameDepth: null,
  }),
}));

import FingerprintIQ from "../index";

describe("FingerprintIQ", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(navigator, "userAgentData");
    sessionStorage.clear();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        visitorId: "iq_test123", confidence: 0.95, botProbability: 0.05,
        signals: {}, timestamp: Date.now(),
      }),
    }));
  });

  it("creates an instance with config", () => {
    const fiq = new FingerprintIQ({ apiKey: "fiq_live_test" });
    expect(fiq).toBeInstanceOf(FingerprintIQ);
  });

  it("throws if apiKey is missing", () => {
    expect(() => new FingerprintIQ({ apiKey: "" })).toThrow("apiKey is required");
  });

  it("identify() collects signals and calls API", async () => {
    const fiq = new FingerprintIQ({ apiKey: "fiq_live_test" });
    const result = await fiq.identify();
    expect(result.visitorId).toBe("iq_test123");
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/v1/identify");
    expect(options.method).toBe("POST");
    expect((options.headers as Record<string, string>)["X-API-Key"]).toBe("fiq_live_test");
  });

  it("uses custom endpoint when provided", async () => {
    const fiq = new FingerprintIQ({ apiKey: "fiq_live_test", endpoint: "https://custom.example.com" });
    await fiq.identify();
    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
    expect(url).toBe("https://custom.example.com/v1/identify");
  });

  it("bootstraps UA client hints once when userAgentData is available", async () => {
    Object.defineProperty(navigator, "userAgentData", {
      configurable: true,
      value: { brands: [{ brand: "Chromium", version: "136" }], mobile: false, platform: "macOS" },
    });

    const fiq = new FingerprintIQ({ apiKey: "fiq_live_test" });
    await fiq.identify();

    expect(fetch).toHaveBeenCalledTimes(2);
    const firstCall = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    const secondCall = (fetch as ReturnType<typeof vi.fn>).mock.calls[1] as [string, RequestInit];
    expect(firstCall[0]).toContain("/v1/bootstrap");
    expect(firstCall[1].method).toBe("GET");
    expect(secondCall[0]).toContain("/v1/identify");

    await fiq.identify();
    expect(fetch).toHaveBeenCalledTimes(3);
    const thirdCall = (fetch as ReturnType<typeof vi.fn>).mock.calls[2] as [string];
    expect(thirdCall[0]).toContain("/v1/identify");
  });
});
