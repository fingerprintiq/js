import type { RootedSignal, SignalResult } from "../types";

const ROOT_FRAMEWORK_GLOBALS = [
  "__xposed",
  "Xposed",
  "XposedBridge",
  "SuperSU",
  "MagiskManager",
  "magisk",
  "daemonsu",
  "rootCloak",
];

const BUILD_ANOMALY_PATTERNS = [
  "lineage",
  "unofficial",
  "userdebug",
  "cyanogen",
];

export async function collectRooted(): Promise<SignalResult<RootedSignal>> {
  const start = performance.now();
  const indicators: string[] = [];

  // 1. Check for root framework globals on window and navigator
  try {
    const win = globalThis as unknown as Record<string, unknown>;
    const nav = navigator as unknown as Record<string, unknown>;
    for (const name of ROOT_FRAMEWORK_GLOBALS) {
      if (win[name] !== undefined || nav[name] !== undefined) {
        indicators.push("root_global:" + name);
      }
    }
  } catch { /* ignore */ }

  // 2. Navigator prototype has >5 non-standard/unusual properties
  try {
    const standardProps = new Set([
      "appCodeName", "appName", "appVersion", "cookieEnabled", "credentials",
      "doNotTrack", "geolocation", "hardwareConcurrency", "language", "languages",
      "locks", "maxTouchPoints", "mediaCapabilities", "mediaDevices", "mediaSession",
      "mimeTypes", "onLine", "pdfViewerEnabled", "permissions", "platform",
      "plugins", "product", "productSub", "serviceWorker", "storage",
      "usb", "userActivation", "userAgent", "vendor", "vendorSub",
      "webdriver", "bluetooth", "clipboard", "connection", "contacts",
      "deviceMemory", "getBattery", "getGamepads", "getUserMedia",
      "hid", "ink", "keyboard", "managed", "presentation",
      "registerProtocolHandler", "requestMIDIAccess", "requestMediaKeySystemAccess",
      "scheduling", "sendBeacon", "serial", "setAppBadge", "share",
      "vibrate", "virtualKeyboard", "wakeLock", "windowControlsOverlay",
      "xr", "gpu", "login", "deprecatedReplaceInURN", "deprecatedRunAdAuctionEnforcesKAnonymity",
      "deprecatedURNToURL", "javaEnabled", "canShare", "clearAppBadge",
      "getAutoplayPolicy", "getInstalledRelatedApps", "unregisterProtocolHandler",
      "constructor", "toString", "toJSON",
    ]);
    const navProto = Object.getOwnPropertyNames(Navigator.prototype);
    const nonStandard = navProto.filter((p) => !standardProps.has(p));
    if (nonStandard.length > 5) {
      indicators.push("nav_proto_non_standard:" + nonStandard.length);
    }
  } catch { /* ignore */ }

  // 3. UA build anomalies
  try {
    const ua = navigator.userAgent.toLowerCase();
    for (const pattern of BUILD_ANOMALY_PATTERNS) {
      if (ua.includes(pattern)) {
        indicators.push("build_anomaly:" + pattern);
      }
    }
  } catch { /* ignore */ }

  const detected = indicators.length >= 1;
  const confidence: "low" | "medium" = indicators.length >= 2 ? "medium" : "low";

  return {
    value: {
      detected,
      confidence,
      indicators,
    },
    duration: performance.now() - start,
  };
}
