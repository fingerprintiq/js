import type { ClientSignals } from "./types";
import { collectCanvas } from "./signals/canvas";
import { collectWebGL } from "./signals/webgl";
import { collectWebGPU } from "./signals/webgpu";
import { collectAudio } from "./signals/audio";
import { collectFonts } from "./signals/fonts";
import { collectWebRTC } from "./signals/webrtc";
import { collectWasmTiming } from "./signals/wasm";
import { collectNavigator } from "./signals/navigator";
import { collectMedia } from "./signals/media";
import { collectScreen } from "./signals/screen";
import { collectIntegrity } from "./signals/integrity";
import { collectWallets } from "./signals/wallets";
import { collectStorage } from "./signals/storage";
import { collectMath } from "./signals/math";
import { collectDOMRect } from "./signals/domrect";
import { collectHeadless } from "./signals/headless";
import { collectSpeech } from "./signals/speech";
import { collectIntl } from "./signals/intl";
import { collectTimezone } from "./signals/timezone";
import { collectCssStyle } from "./signals/cssStyle";
import { collectErrors } from "./signals/errors";
import { collectWorkerScope } from "./signals/workerScope";
import { collectResistance } from "./signals/resistance";
import { collectSvg } from "./signals/svg";
import { collectWindowFeatures } from "./signals/windowFeatures";
import { collectHtmlElement } from "./signals/htmlElement";
import { collectCodecs } from "./signals/codecs";
import { collectStatus } from "./signals/status";
import { collectPlatformFeatures } from "./signals/platformFeatures";
import { collectUaClientHints } from "./signals/uaClientHints";
import { collectCapabilityVector } from "./signals/capabilityVector";
import { collectGeometryVector } from "./signals/geometryVector";
import { collectRuntimeVector } from "./signals/runtimeVector";
import { collectSensorCapabilities } from "./signals/sensorCapabilities";
import { collectBehavioralRisk } from "./signals/behavioralRisk";
import { collectIncognito } from "./signals/incognito";
import { collectDevTools } from "./signals/devTools";
import { collectVirtualization } from "./signals/virtualization";
import { collectRooted } from "./signals/rooted";
import { primeBehaviorTracking } from "./signals/behaviorTracker";

interface CollectOptions {
  detectWallets: boolean;
}

export async function collectAllSignals(options: CollectOptions): Promise<ClientSignals> {
  primeBehaviorTracking();

  const [
    canvas, webgl, webgpu, audio, fonts, webrtc, wasmTiming,
    navigator, media, screen, integrity, wallets, storage,
    math, domRect, headless,
    speech, intl, timezone, cssStyle, error, workerScope, resistance,
    svg, windowFeatures, htmlElement, codec, status, platformFeatures,
    uaClientHints, capabilityVector, geometryVector, runtimeVector,
    sensorCapabilities, behavioralRisk,
    incognito, devTools, virtualization, rooted,
  ] = await Promise.all([
    collectCanvas(), collectWebGL(), collectWebGPU(), collectAudio(),
    collectFonts(), collectWebRTC(), collectWasmTiming(), collectNavigator(),
    collectMedia(), collectScreen(), collectIntegrity(),
    options.detectWallets ? collectWallets() : Promise.resolve(null),
    collectStorage(),
    collectMath(), collectDOMRect(), collectHeadless(),
    collectSpeech(), collectIntl(), collectTimezone(), collectCssStyle(),
    collectErrors(), collectWorkerScope(), collectResistance(),
    collectSvg(), collectWindowFeatures(), collectHtmlElement(),
    collectCodecs(), collectStatus(), collectPlatformFeatures(),
    collectUaClientHints(),
    collectCapabilityVector(), collectGeometryVector(), collectRuntimeVector(),
    collectSensorCapabilities(), collectBehavioralRisk(),
    collectIncognito(), collectDevTools(), collectVirtualization(), collectRooted(),
  ]);

  if (integrity?.value) {
    integrity.value.workerMismatch = (workerScope?.value?.mismatches.length ?? 0) > 0;
  }

  return {
    canvas, webgl, webgpu, audio, fonts, webrtc, wasmTiming,
    navigator, media, screen, integrity, wallets, storage,
    math, domRect, headless,
    speech, intl, timezone, cssStyle, error, workerScope, resistance,
    svg, windowFeatures, htmlElement, codec, status, platformFeatures,
    uaClientHints, capabilityVector, geometryVector, runtimeVector,
    sensorCapabilities, behavioralRisk,
    incognito, devTools, virtualization, rooted,
  };
}
