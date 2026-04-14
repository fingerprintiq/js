import type { SignalResult, AudioSignal } from "../types";
import { sha256 } from "../hash";

function getOfflineAudioContext(): (new (channels: number, length: number, sampleRate: number) => OfflineAudioContext) | null {
  if (typeof OfflineAudioContext !== "undefined") return OfflineAudioContext;
  if (typeof (globalThis as Record<string, unknown>).webkitOfflineAudioContext !== "undefined") {
    return (globalThis as Record<string, unknown>).webkitOfflineAudioContext as typeof OfflineAudioContext;
  }
  return null;
}

export async function collectAudio(): Promise<SignalResult<AudioSignal> | null> {
  const start = performance.now();
  try {
    const AudioCtxClass = getOfflineAudioContext();
    if (!AudioCtxClass) return null;

    const ctx = new AudioCtxClass(1, 4500, 44100);
    const oscillator = ctx.createOscillator();
    oscillator.type = "triangle";
    oscillator.frequency.value = 10000;

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -50;
    compressor.knee.value = 40;
    compressor.ratio.value = 12;
    compressor.attack.value = 0;
    compressor.release.value = 0.25;

    oscillator.connect(compressor);
    compressor.connect(ctx.destination);
    oscillator.start(0);

    const renderedBuffer = await ctx.startRendering();
    const channelData = renderedBuffer.getChannelData(0);

    const hashInput = Array.from(channelData.slice(0, 100)).map((v) => v.toFixed(6)).join(",");
    const hash = await sha256(hashInput);

    const sampleRate = ctx.sampleRate;
    const maxChannelCount = ctx.destination.maxChannelCount;
    const isSuspended = ctx.state === "suspended";

    oscillator.stop();
    oscillator.disconnect();
    compressor.disconnect();
    try { await (ctx as unknown as { close: () => Promise<void> }).close(); } catch { /* some browsers don't support closing offline context */ }

    return { value: { hash, sampleRate, maxChannelCount, isSuspended }, duration: performance.now() - start };
  } catch { return null; }
}
