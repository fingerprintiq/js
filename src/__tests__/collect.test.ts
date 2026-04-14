import { describe, it, expect, vi } from "vitest";

vi.mock("../signals/canvas", () => ({ collectCanvas: vi.fn().mockResolvedValue(null) }));
vi.mock("../signals/webgl", () => ({ collectWebGL: vi.fn().mockResolvedValue(null) }));
vi.mock("../signals/webgpu", () => ({ collectWebGPU: vi.fn().mockResolvedValue(null) }));
vi.mock("../signals/audio", () => ({ collectAudio: vi.fn().mockResolvedValue(null) }));
vi.mock("../signals/fonts", () => ({ collectFonts: vi.fn().mockResolvedValue(null) }));
vi.mock("../signals/webrtc", () => ({ collectWebRTC: vi.fn().mockResolvedValue(null) }));
vi.mock("../signals/wasm", () => ({ collectWasmTiming: vi.fn().mockResolvedValue(null) }));
vi.mock("../signals/navigator", () => ({ collectNavigator: vi.fn().mockResolvedValue(null) }));
vi.mock("../signals/media", () => ({ collectMedia: vi.fn().mockResolvedValue(null) }));
vi.mock("../signals/screen", () => ({ collectScreen: vi.fn().mockResolvedValue(null) }));
vi.mock("../signals/integrity", () => ({ collectIntegrity: vi.fn().mockResolvedValue(null) }));
vi.mock("../signals/wallets", () => ({ collectWallets: vi.fn().mockResolvedValue(null) }));
vi.mock("../signals/storage", () => ({ collectStorage: vi.fn().mockResolvedValue(null) }));
vi.mock("../signals/math", () => ({ collectMath: vi.fn().mockResolvedValue(null) }));
vi.mock("../signals/domrect", () => ({ collectDOMRect: vi.fn().mockResolvedValue(null) }));
vi.mock("../signals/headless", () => ({ collectHeadless: vi.fn().mockResolvedValue(null) }));
vi.mock("../signals/speech", () => ({ collectSpeech: vi.fn().mockResolvedValue(null) }));
vi.mock("../signals/intl", () => ({ collectIntl: vi.fn().mockResolvedValue(null) }));
vi.mock("../signals/timezone", () => ({ collectTimezone: vi.fn().mockResolvedValue(null) }));
vi.mock("../signals/cssStyle", () => ({ collectCssStyle: vi.fn().mockResolvedValue(null) }));
vi.mock("../signals/errors", () => ({ collectErrors: vi.fn().mockResolvedValue(null) }));
vi.mock("../signals/workerScope", () => ({ collectWorkerScope: vi.fn().mockResolvedValue(null) }));
vi.mock("../signals/resistance", () => ({ collectResistance: vi.fn().mockResolvedValue(null) }));
vi.mock("../signals/svg", () => ({ collectSvg: vi.fn().mockResolvedValue(null) }));
vi.mock("../signals/windowFeatures", () => ({ collectWindowFeatures: vi.fn().mockResolvedValue(null) }));
vi.mock("../signals/htmlElement", () => ({ collectHtmlElement: vi.fn().mockResolvedValue(null) }));
vi.mock("../signals/codecs", () => ({ collectCodecs: vi.fn().mockResolvedValue(null) }));
vi.mock("../signals/status", () => ({ collectStatus: vi.fn().mockResolvedValue(null) }));
vi.mock("../signals/platformFeatures", () => ({ collectPlatformFeatures: vi.fn().mockResolvedValue(null) }));
vi.mock("../signals/uaClientHints", () => ({ collectUaClientHints: vi.fn().mockResolvedValue(null) }));
vi.mock("../signals/capabilityVector", () => ({ collectCapabilityVector: vi.fn().mockResolvedValue(null) }));
vi.mock("../signals/geometryVector", () => ({ collectGeometryVector: vi.fn().mockResolvedValue(null) }));
vi.mock("../signals/runtimeVector", () => ({ collectRuntimeVector: vi.fn().mockResolvedValue(null) }));
vi.mock("../signals/sensorCapabilities", () => ({ collectSensorCapabilities: vi.fn().mockResolvedValue(null) }));
vi.mock("../signals/behavioralRisk", () => ({ collectBehavioralRisk: vi.fn().mockResolvedValue(null) }));
vi.mock("../signals/incognito", () => ({ collectIncognito: vi.fn().mockResolvedValue(null) }));
vi.mock("../signals/devTools", () => ({ collectDevTools: vi.fn().mockResolvedValue(null) }));
vi.mock("../signals/virtualization", () => ({ collectVirtualization: vi.fn().mockResolvedValue(null) }));
vi.mock("../signals/rooted", () => ({ collectRooted: vi.fn().mockResolvedValue(null) }));
vi.mock("../signals/behaviorTracker", () => ({ primeBehaviorTracking: vi.fn() }));

import { collectAllSignals } from "../collect";
import { collectIntegrity } from "../signals/integrity";
import { collectWorkerScope } from "../signals/workerScope";

describe("collectAllSignals", () => {
  it("returns an object with all 39 signal keys", async () => {
    const result = await collectAllSignals({ detectWallets: true });

    const expectedKeys = [
      "canvas", "webgl", "webgpu", "audio", "fonts", "webrtc", "wasmTiming",
      "navigator", "media", "screen", "integrity", "wallets", "storage",
      "math", "domRect", "headless",
      "speech", "intl", "timezone", "cssStyle", "error", "workerScope", "resistance",
      "svg", "windowFeatures", "htmlElement", "codec", "status", "platformFeatures",
      "uaClientHints", "capabilityVector", "geometryVector", "runtimeVector",
      "sensorCapabilities", "behavioralRisk",
      "incognito", "devTools", "virtualization", "rooted",
    ];

    for (const key of expectedKeys) {
      expect(key in result, `Missing key: ${key}`).toBe(true);
    }

    expect(Object.keys(result).length).toBe(39);
  });

  it("all signals return null when mocked", async () => {
    const result = await collectAllSignals({ detectWallets: true });
    for (const value of Object.values(result)) {
      expect(value).toBeNull();
    }
  });

  it("skips wallet detection when disabled", async () => {
    const result = await collectAllSignals({ detectWallets: false });
    expect(result.wallets).toBeNull();
  });

  it("propagates worker mismatches into integrity signal", async () => {
    vi.mocked(collectIntegrity).mockResolvedValueOnce({
      value: {
        tamperedApis: [],
        workerMismatch: false,
        lieScore: 0,
      },
      duration: 1,
    });
    vi.mocked(collectWorkerScope).mockResolvedValueOnce({
      value: {
        workerNavigator: null,
        workerWebGL: null,
        mismatches: ["userAgent"],
      },
      duration: 1,
    });

    const result = await collectAllSignals({ detectWallets: false });
    expect(result.integrity?.value.workerMismatch).toBe(true);
  });
});
