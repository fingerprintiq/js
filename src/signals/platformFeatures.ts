import type { SignalResult, PlatformFeaturesSignal } from "../types";
import { sha256 } from "../hash";

type PlatformFeatureGlobal = typeof globalThis & {
  BarcodeDetector?: object;
  ContentIndex?: object;
  EyeDropper?: object;
  FileSystemWritableFileStream?: object;
  PointerEvent?: object;
  SharedWorker?: object;
  TouchEvent?: object;
  showDirectoryPicker?: object;
  showOpenFilePicker?: object;
};

type NavigatorPlatformFeatures = Navigator & {
  bluetooth?: object;
  contacts?: object;
  hid?: object;
  serial?: object;
  usb?: object;
  wakeLock?: object;
};

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
    const globals = globalThis as PlatformFeatureGlobal;
    const nav = navigator as NavigatorPlatformFeatures;

    features["BarcodeDetector"] = typeof globals.BarcodeDetector !== "undefined";
    features["ContactsManager"] = typeof nav.contacts !== "undefined";
    features["ContentIndex"] = (() => {
      try {
        return typeof self !== "undefined"
          && typeof (self as PlatformFeatureGlobal).ContentIndex !== "undefined";
      } catch { return false; }
    })();
    features["EyeDropper"] = typeof globals.EyeDropper !== "undefined";
    features["FileSystemWritableFileStream"] = typeof globals.FileSystemWritableFileStream !== "undefined";
    features["HID"] = typeof nav.hid !== "undefined";
    features["Serial"] = typeof nav.serial !== "undefined";
    features["USB"] = typeof nav.usb !== "undefined";
    features["SharedWorker"] = typeof globals.SharedWorker !== "undefined";
    features["PointerEvent"] = typeof globals.PointerEvent !== "undefined";
    features["TouchEvent"] = typeof globals.TouchEvent !== "undefined";
    features["showDirectoryPicker"] = typeof globals.showDirectoryPicker !== "undefined";
    features["showOpenFilePicker"] = typeof globals.showOpenFilePicker !== "undefined";
    features["Bluetooth"] = typeof nav.bluetooth !== "undefined";
    features["WakeLock"] = typeof nav.wakeLock !== "undefined";

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
