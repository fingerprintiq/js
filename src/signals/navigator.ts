import type { SignalResult, NavigatorSignal } from "../types";

export async function collectNavigator(): Promise<SignalResult<NavigatorSignal> | null> {
  const start = performance.now();
  try {
    if (typeof navigator === "undefined") return null;

    const nav = navigator as Navigator & Record<string, unknown>;

    let hardwareConcurrency = 0;
    try { hardwareConcurrency = nav.hardwareConcurrency ?? 0; } catch { /* ignore */ }

    let deviceMemory: number | null = null;
    try { deviceMemory = (nav as Record<string, unknown>).deviceMemory as number ?? null; } catch { /* ignore */ }

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
      const keyboard = (nav as Record<string, unknown>).keyboard as { getLayoutMap?: () => Promise<Map<string, string>> } | undefined;
      if (keyboard?.getLayoutMap) {
        const layoutMap = await keyboard.getLayoutMap();
        keyboardLayout = layoutMap instanceof Map ? layoutMap.get("KeyA") ?? null : null;
      }
    } catch { /* ignore */ }

    let connectionType: string | null = null;
    try {
      const connection = (nav as Record<string, unknown>).connection as Record<string, unknown> | undefined;
      connectionType = connection?.effectiveType as string ?? null;
    } catch { /* ignore */ }

    const hasBluetooth = "bluetooth" in nav;
    const hasUsb = "usb" in nav;
    const hasHid = "hid" in nav;
    const hasSerial = "serial" in nav;
    const hasWakeLock = "wakeLock" in nav;
    const hasGpu = "gpu" in nav;

    let bluetoothAvailable: boolean | null = null;
    try {
      const bluetooth = (nav as Record<string, unknown>).bluetooth as { getAvailability?: () => Promise<boolean> } | undefined;
      if (bluetooth?.getAvailability) {
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
