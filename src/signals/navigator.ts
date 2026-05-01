import type { SignalResult, NavigatorSignal } from "../types";

interface NavigatorKeyboardLike {
  getLayoutMap?: () => Promise<Map<string, string>>;
}

interface NavigatorConnectionLike {
  effectiveType?: string;
}

interface NavigatorBluetoothLike {
  getAvailability?: () => Promise<boolean>;
}

type NavigatorWithExperimentalFields = Navigator & {
  bluetooth?: NavigatorBluetoothLike;
  connection?: NavigatorConnectionLike;
  deviceMemory?: number;
  keyboard?: NavigatorKeyboardLike;
};

export async function collectNavigator(): Promise<SignalResult<NavigatorSignal> | null> {
  const start = performance.now();
  try {
    if (typeof navigator === "undefined") return null;

    const nav = navigator as NavigatorWithExperimentalFields;

    let hardwareConcurrency = 0;
    try { hardwareConcurrency = nav.hardwareConcurrency ?? 0; } catch { /* ignore */ }

    let deviceMemory: number | null = null;
    try { deviceMemory = typeof nav.deviceMemory === "number" ? nav.deviceMemory : null; } catch { /* ignore */ }

    let maxTouchPoints = 0;
    try { maxTouchPoints = nav.maxTouchPoints ?? 0; } catch { /* ignore */ }

    let languages: string[] = [];
    try { languages = Array.from(nav.languages ?? []); } catch { /* ignore */ }

    let platform = "";
    try { platform = nav.platform ?? ""; } catch { /* ignore */ }

    let cookieEnabled = false;
    try { cookieEnabled = nav.cookieEnabled ?? false; } catch { /* ignore */ }

    let doNotTrack: string | null = null;
    try { doNotTrack = nav.doNotTrack ?? null; } catch { /* ignore */ }

    let keyboardLayout: string | null = null;
    try {
      const keyboard = nav.keyboard;
      if (typeof keyboard?.getLayoutMap === "function") {
        const layoutMap = await keyboard.getLayoutMap();
        keyboardLayout = layoutMap instanceof Map ? layoutMap.get("KeyA") ?? null : null;
      }
    } catch { /* ignore */ }

    let connectionType: string | null = null;
    try {
      connectionType = nav.connection?.effectiveType ?? null;
    } catch { /* ignore */ }

    const hasBluetooth = "bluetooth" in nav;
    const hasUsb = "usb" in nav;
    const hasHid = "hid" in nav;
    const hasSerial = "serial" in nav;
    const hasWakeLock = "wakeLock" in nav;
    const hasGpu = "gpu" in nav;

    let bluetoothAvailable: boolean | null = null;
    try {
      const bluetooth = nav.bluetooth;
      if (typeof bluetooth?.getAvailability === "function") {
        bluetoothAvailable = await bluetooth.getAvailability();
      }
    } catch { /* ignore */ }

    return {
      value: {
        hardwareConcurrency,
        deviceMemory,
        maxTouchPoints,
        languages,
        platform,
        cookieEnabled,
        doNotTrack,
        keyboardLayout,
        connectionType,
        hasBluetooth,
        hasUsb,
        hasHid,
        hasSerial,
        hasWakeLock,
        hasGpu,
        bluetoothAvailable,
      },
      duration: performance.now() - start,
    };
  } catch { return null; }
}
