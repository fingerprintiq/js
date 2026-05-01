import type { DOMRectSignal, SignalResult } from "../types";

const TEST_ELEMENTS = [
  { tag: "div", text: "FingerprintIQ", style: "font-size:16px;font-family:Arial;padding:10px;display:inline-block;" },
  { tag: "span", text: "mmmmmmmmm", style: "font-size:72px;font-family:monospace;" },
  { tag: "span", text: "WWWWWWWWW", style: "font-size:72px;font-family:serif;" },
  { tag: "div", text: "The quick brown fox", style: "font-size:14px;font-family:sans-serif;width:200px;word-wrap:break-word;" },
];

const EMOJI_TEST = "\u{1F600}\u{1F680}\u{1F308}\u{1F3B5}\u{1F9E0}\u{2764}\u{FE0F}\u{1F44D}\u{1F602}\u{1F525}";

async function hashRect(rect: DOMRect): Promise<string> {
  const str = `${rect.x},${rect.y},${rect.width},${rect.height},${rect.top},${rect.right},${rect.bottom},${rect.left}`;
  const data = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function collectDOMRect(): Promise<SignalResult<DOMRectSignal> | null> {
  const start = performance.now();

  try {
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "-9999px";
    document.body.appendChild(container);

    const rectHashes: string[] = [];

    for (const el of TEST_ELEMENTS) {
      const node = document.createElement(el.tag);
      node.textContent = el.text;
      node.setAttribute("style", el.style);
      container.appendChild(node);
      const rect = node.getBoundingClientRect();
      rectHashes.push(await hashRect(rect));
    }

    // Emoji rendering dimensions
    const emojiSpan = document.createElement("span");
    emojiSpan.style.fontSize = "48px";
    emojiSpan.textContent = EMOJI_TEST;
    container.appendChild(emojiSpan);
    const emojiRect = emojiSpan.getBoundingClientRect();
    const emojiHash = await hashRect(emojiRect);

    container.remove();

    // Combine all rect hashes
    const combined = rectHashes.join("|");
    const data = new TextEncoder().encode(combined);
    const buf = await crypto.subtle.digest("SHA-256", data);
    const hash = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");

    return {
      value: { hash, emojiHash, rectCount: rectHashes.length },
      duration: performance.now() - start,
    };
  } catch {
    return null;
  }
}
