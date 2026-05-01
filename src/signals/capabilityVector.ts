import type { CapabilityVectorSignal, SignalResult } from "../types";
import { sha256 } from "../hash";

type NavigatorCapabilityFields = Navigator & {
  globalPrivacyControl?: boolean;
  keyboard?: {
    getLayoutMap?: () => Promise<Map<string, string>>;
  };
  pdfViewerEnabled?: boolean;
  userAgentData?: {
    getHighEntropyValues?: (hints: string[]) => Promise<object>;
  };
};

type CapabilityGlobal = typeof globalThis & {
  SpeechRecognition?: object;
  speechSynthesis?: SpeechSynthesis;
  webkitSpeechRecognition?: object;
};

function normalizePluginName(name: string): string {
  return name.trim().toLowerCase();
}

export async function collectCapabilityVector(): Promise<
  SignalResult<CapabilityVectorSignal> | null
> {
  const start = performance.now();

  try {
    const nav = navigator as NavigatorCapabilityFields;
    const globals = globalThis as CapabilityGlobal;

    const plugins = Array.from(nav.plugins ?? []);
    const normalizedPluginNames = plugins
      .map((plugin) => normalizePluginName(plugin.name))
      .sort();
    const hasPdfPlugin = normalizedPluginNames.some((name) =>
      name.includes("pdf"),
    );

    const pdfViewerEnabled =
      "pdfViewerEnabled" in nav
        ? Boolean(nav.pdfViewerEnabled)
        : null;
    const globalPrivacyControl =
      "globalPrivacyControl" in nav
        ? Boolean(nav.globalPrivacyControl)
        : null;
    const hasSpeechRecognition =
      typeof globals.SpeechRecognition !== "undefined" ||
      typeof globals.webkitSpeechRecognition !== "undefined";

    const value: CapabilityVectorSignal = {
      pdfViewerEnabled,
      globalPrivacyControl,
      hasPdfPlugin,
      pluginCount: plugins.length,
      hasWebGPU: "gpu" in nav,
      hasVirtualKeyboard: "virtualKeyboard" in nav,
      hasSpeechSynthesis:
        typeof globals.speechSynthesis !== "undefined",
      hasSpeechRecognition,
      hasMediaCapabilities: "mediaCapabilities" in nav,
      hasKeyboardLayoutApi:
        typeof nav.keyboard?.getLayoutMap === "function",
      hasBluetooth: "bluetooth" in nav,
      hasUsb: "usb" in nav,
      hasHid: "hid" in nav,
      hasSerial: "serial" in nav,
      hasHighEntropyUaHints:
        typeof nav.userAgentData?.getHighEntropyValues === "function",
      suspiciousFlags: [],
      hash: "",
    };

    if (value.pdfViewerEnabled !== null && value.pdfViewerEnabled !== value.hasPdfPlugin) {
      value.suspiciousFlags.push("pdf_viewer_mismatch");
    }

    const hashInput = [
      `pdfViewerEnabled:${String(value.pdfViewerEnabled)}`,
      `globalPrivacyControl:${String(value.globalPrivacyControl)}`,
      `hasPdfPlugin:${String(value.hasPdfPlugin)}`,
      `pluginCount:${String(value.pluginCount ?? "")}`,
      `hasWebGPU:${String(value.hasWebGPU)}`,
      `hasVirtualKeyboard:${String(value.hasVirtualKeyboard)}`,
      `hasSpeechSynthesis:${String(value.hasSpeechSynthesis)}`,
      `hasSpeechRecognition:${String(value.hasSpeechRecognition)}`,
      `hasMediaCapabilities:${String(value.hasMediaCapabilities)}`,
      `hasKeyboardLayoutApi:${String(value.hasKeyboardLayoutApi)}`,
      `hasBluetooth:${String(value.hasBluetooth)}`,
      `hasUsb:${String(value.hasUsb)}`,
      `hasHid:${String(value.hasHid)}`,
      `hasSerial:${String(value.hasSerial)}`,
      `hasHighEntropyUaHints:${String(value.hasHighEntropyUaHints)}`,
      `plugins:${normalizedPluginNames.slice(0, 8).join(",")}`,
      `flags:${value.suspiciousFlags.join(",")}`,
    ];
    value.hash = await sha256(hashInput.join("|"));

    return {
      value,
      duration: performance.now() - start,
    };
  } catch {
    return null;
  }
}
