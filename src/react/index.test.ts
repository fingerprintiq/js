// sdk/src/react/index.test.ts
/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

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

import { useFingerprintIQ } from "./index";

describe("useFingerprintIQ", () => {
  beforeEach(() => {
    Reflect.deleteProperty(navigator, "userAgentData");
    sessionStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          visitorId: "iq_hook_test",
          confidence: 0.95,
          botProbability: 0.05,
          signals: {},
          timestamp: Date.now(),
        }),
      }),
    );
  });

  it("auto-identifies on mount and exposes result", async () => {
    const { result } = renderHook(() =>
      useFingerprintIQ({ apiKey: "fiq_live_test" }),
    );

    expect(result.current.loading).toBe(true);
    expect(result.current.result).toBe(null);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.result?.visitorId).toBe("iq_hook_test");
    expect(result.current.error).toBe(null);
  });

  it("skips auto-identify when manual=true", async () => {
    const { result } = renderHook(() =>
      useFingerprintIQ({ apiKey: "fiq_live_test", manual: true }),
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.result).toBe(null);
  });

  it("captures errors from identify()", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue("boom"),
      }),
    );

    const { result } = renderHook(() =>
      useFingerprintIQ({ apiKey: "fiq_live_test" }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.result).toBe(null);
  });

  it("re-fetches when identify() is called manually", async () => {
    const { result } = renderHook(() =>
      useFingerprintIQ({ apiKey: "fiq_live_test", manual: true }),
    );

    // manual: true — nothing happens yet
    expect(result.current.loading).toBe(false);
    expect(result.current.result).toBe(null);

    await act(async () => {
      await result.current.identify();
    });

    expect(result.current.result?.visitorId).toBe("iq_hook_test");
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it("uses the latest config after rerender", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        visitorId: "iq_hook_test",
        confidence: 0.95,
        botProbability: 0.05,
        signals: {},
        timestamp: Date.now(),
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result, rerender } = renderHook(
      ({ endpoint }) =>
        useFingerprintIQ({
          apiKey: "fiq_live_test",
          endpoint,
          manual: true,
        }),
      {
        initialProps: { endpoint: "https://old.fingerprintiq.test" },
      },
    );

    rerender({ endpoint: "https://new.fingerprintiq.test" });

    await act(async () => {
      await result.current.identify();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://new.fingerprintiq.test/v1/identify",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "X-API-Key": "fiq_live_test" }),
      }),
    );
  });
});
