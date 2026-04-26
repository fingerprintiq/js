/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { defineComponent, h } from "vue";

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

describe("useFingerprintIQ (vue)", () => {
  beforeEach(() => {
    Reflect.deleteProperty(navigator, "userAgentData");
    sessionStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          visitorId: "iq_vue_test",
          confidence: 0.95,
          botProbability: 0.05,
          signals: {},
          timestamp: Date.now(),
        }),
      }),
    );
  });

  it("auto-identifies on mount and exposes reactive result", async () => {
    const probe: { state?: ReturnType<typeof useFingerprintIQ> } = {};
    const Component = defineComponent({
      setup() {
        probe.state = useFingerprintIQ({ apiKey: "fiq_live_test" });
        return () => h("div");
      },
    });

    mount(Component);
    await flushPromises();

    expect(probe.state?.result.value?.visitorId).toBe("iq_vue_test");
    expect(probe.state?.loading.value).toBe(false);
    expect(probe.state?.error.value).toBe(null);
  });
});
