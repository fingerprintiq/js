import type { SignalResult, SvgSignal } from "../types";
import { sha256 } from "../hash";

export async function collectSvg(): Promise<SignalResult<SvgSignal> | null> {
  const start = performance.now();
  try {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "500");
    svg.setAttribute("height", "100");
    svg.style.position = "absolute";
    svg.style.left = "-9999px";
    svg.style.top = "-9999px";

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", "10");
    text.setAttribute("y", "50");
    text.setAttribute("font-size", "16");
    text.setAttribute("font-family", "sans-serif");
    text.textContent = "\u{1F600}\u{1F680}\u{1F308}\u{1F3B5}ABCxyz";
    svg.appendChild(text);
    document.body.appendChild(svg);

    const textLengths: number[] = [];
    try {
      const bbox = text.getBBox();
      textLengths.push(bbox.width, bbox.height);
    } catch { /* unavailable */ }

    try {
      const computedLength = text.getComputedTextLength();
      textLengths.push(computedLength);
    } catch { /* unavailable */ }

    try {
      const sub1 = text.getSubStringLength(0, 4);
      const sub2 = text.getSubStringLength(4, 3);
      textLengths.push(sub1, sub2);
    } catch { /* unavailable */ }

    document.body.removeChild(svg);

    if (textLengths.length === 0) return null;

    const hash = await sha256(textLengths.join(","));

    return {
      value: { hash, textLengths },
      duration: performance.now() - start,
    };
  } catch {
    return null;
  }
}
