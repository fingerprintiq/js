import type { SignalResult, CanvasSignal } from "../types";
import { sha256 } from "../hash";

function renderScene(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#ff6b6b");
  gradient.addColorStop(0.5, "#4ecdc4");
  gradient.addColorStop(1, "#45b7d1");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#1a1a2e";
  ctx.font = "18px Arial";
  ctx.textBaseline = "top";
  ctx.fillText("FingerprintIQ \u{1F9E0} Cwm fjord veg balks nth pyx quiz", 2, 2);

  ctx.font = "14px 'Times New Roman'";
  ctx.fillText("\u00E9\u00E8\u00EA\u00EB \u00FC\u00F9 \u00E7\u00E0 \u4E16\u754C \u0410\u0411\u0412", 4, 28);

  ctx.beginPath();
  ctx.arc(80, 80, 30, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 107, 107, 0.7)";
  ctx.fill();
  ctx.closePath();

  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = "rgba(78, 205, 196, 0.5)";
  ctx.fillRect(50, 50, 100, 60);
  ctx.globalCompositeOperation = "source-over";

  ctx.font = "12px sans-serif";
  ctx.fillStyle = "#000";
  ctx.fillText("\u{1F600}\u{1F680}\u{1F308}\u{1F3B5}", 180, 80);
}

/**
 * Browsers that intentionally farble canvas output (Safari 17+, Firefox 120+ RFP).
 * We still collect — the hash is informative when paired with isFarbled, and detecting
 * spoofed-non-farbling on these UAs is a high-value bot signal.
 */
function browserFarblesCanvas(): boolean {
  try {
    const ua = navigator.userAgent;
    const safariMatch = ua.match(/Version\/(\d+)\.\d+.*Safari/);
    if (safariMatch && parseInt(safariMatch[1]!, 10) >= 17) return true;
    const firefoxMatch = ua.match(/Firefox\/(\d+)/);
    if (firefoxMatch && parseInt(firefoxMatch[1]!, 10) >= 120) return true;
  } catch { /* ignore */ }
  return false;
}

export async function collectCanvas(): Promise<SignalResult<CanvasSignal> | null> {
  const start = performance.now();
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 150;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Two renders are enough to detect noise; saves ~33% canvas CPU.
    const renders: string[] = [];
    for (let i = 0; i < 2; i++) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      renderScene(ctx, canvas);
      renders.push(canvas.toDataURL("image/png"));
    }

    const renderFarbled = renders[0] !== renders[1];
    const isFarbled = renderFarbled || browserFarblesCanvas();
    const hash = await sha256(renders[0]!);

    return {
      value: { hash, isFarbled },
      duration: performance.now() - start,
    };
  } catch {
    return null;
  }
}
