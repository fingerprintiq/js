import type { SignalResult, CssStyleSignal } from "../types";
import { sha256 } from "../hash";

const SYSTEM_COLORS = [
  "ActiveText",
  "ButtonBorder",
  "ButtonFace",
  "ButtonText",
  "Canvas",
  "CanvasText",
  "Field",
  "FieldText",
  "GrayText",
  "Highlight",
  "HighlightText",
  "LinkText",
  "Mark",
  "MarkText",
  "SelectedItem",
  "SelectedItemText",
  "VisitedText",
  "AccentColor",
  "AccentColorText",
];

const SYSTEM_FONTS = [
  "caption",
  "icon",
  "menu",
  "message-box",
  "small-caption",
  "status-bar",
];

export async function collectCssStyle(): Promise<SignalResult<CssStyleSignal> | null> {
  const start = performance.now();
  try {
    if (typeof document === "undefined") return null;

    // Count computed style properties
    const propertyCount = getComputedStyle(document.documentElement).length;

    // Create a hidden element for reading system values
    const el = document.createElement("div");
    el.style.cssText = "position:absolute;visibility:hidden;pointer-events:none;";
    document.body.appendChild(el);

    // Read system colors
    const colorValues: string[] = [];
    for (const color of SYSTEM_COLORS) {
      try {
        el.style.color = color;
        const computed = getComputedStyle(el).color;
        colorValues.push(`${color}:${computed}`);
      } catch { /* ignore */ }
    }

    // Read system fonts
    const fontValues: string[] = [];
    for (const font of SYSTEM_FONTS) {
      try {
        el.style.font = font;
        const computed = getComputedStyle(el).font;
        fontValues.push(`${font}:${computed}`);
      } catch { /* ignore */ }
    }

    document.body.removeChild(el);

    const systemColorHash = await sha256(colorValues.join("|"));
    const systemFontHash = await sha256(fontValues.join("|"));
    const hash = await sha256(`${propertyCount}|${systemColorHash}|${systemFontHash}`);

    return {
      value: {
        propertyCount,
        systemColorHash,
        systemFontHash,
        hash,
      },
      duration: performance.now() - start,
    };
  } catch {
    return null;
  }
}
