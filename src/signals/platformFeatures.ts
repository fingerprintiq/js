import type { SignalResult, PlatformFeaturesSignal } from "../types";
import { sha256 } from "../hash";

function estimatePlatform(features: Record<string, boolean>): string {
  if (features["BarcodeDetector"] && features["ContactsManager"]) return "Android";
  if (features["TouchEvent"] && !features["SharedWorker"]) return "Mobile";
  if (features["HID"] || features["Serial"] || features["showDirectoryPicker"]) return "Desktop";
  return "Unknown";
}

export async function collectPlatformFeatures(): Promise<SignalResult<PlatformFeaturesSignal> | null> {
  const start = performance.now();
  try {
    const features: Record<string, boolean> = {};

    features["BarcodeDetector"] = typeof (globalThis as Record<string, unknown>)["BarcodeDetector"] !== "undefined";
    features["ContactsManager"] = typeof (navigator as unknown as Record<string, unknown>)["contacts"] !== "undefined";
    features["ContentIndex"] = (() => {
      try {
        return typeof (self as unknown as Record<string, unknown>)["ContentIndex"] !== "undefined";
      } catch { return false; }
    })();
    features["EyeDropper"] = typeof (globalThis as Record<string, unknown>)["EyeDropper"] !== "undefined";
    features["FileSystemWritableFileStream"] = typeof (globalThis as Record<string, unknown>)["FileSystemWritableFileStream"] !== "undefined";
    features["HID"] = typeof (navigator as unknown as Record<string, unknown>)["hid"] !== "undefined";
    features["Serial"] = typeof (navigator as unknown as Record<string, unknown>)["serial"] !== "undefined";
    features["USB"] = typeof (navigator as unknown as Record<string, unknown>)["usb"] !== "undefined";
    features["SharedWorker"] = typeof (globalThis as Record<string, unknown>)["SharedWorker"] !== "undefined";
    features["PointerEvent"] = typeof (globalThis as Record<string, unknown>)["PointerEvent"] !== "undefined";
    features["TouchEvent"] = typeof (globalThis as Record<string, unknown>)["TouchEvent"] !== "undefined";
    features["showDirectoryPicker"] = typeof (globalThis as Record<string, unknown>)["showDirectoryPicker"] !== "undefined";
    features["showOpenFilePicker"] = typeof (globalThis as Record<string, unknown>)["showOpenFilePicker"] !== "undefined";
    features["Bluetooth"] = typeof (navigator as unknown as Record<string, unknown>)["bluetooth"] !== "undefined";
    features["WakeLock"] = typeof (navigator as unknown as Record<string, unknown>)["wakeLock"] !== "undefined";

    const estimatedPlatform = estimatePlatform(features);

    const hashInput = Object.entries(features)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join("|");
    const hash = await sha256(hashInput);

    return {
      value: { features, estimatedPlatform, hash },
      duration: performance.now() - start,
    };
  } catch {
    return null;
  }
}
