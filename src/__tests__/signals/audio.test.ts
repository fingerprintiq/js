import { describe, it, expect, vi, beforeEach } from "vitest";
import { collectAudio } from "../../signals/audio";

describe("collectAudio", () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it("returns audio fingerprint data", async () => {
    const mockChannelData = new Float32Array(4500);
    for (let i = 0; i < 4500; i++) mockChannelData[i] = Math.sin(i * 0.01) * 0.5;

    const mockRenderedBuffer = {
      getChannelData: vi.fn().mockReturnValue(mockChannelData),
    };
    const mockOscillator = {
      type: "triangle" as OscillatorType, frequency: { value: 10000 },
      connect: vi.fn(), start: vi.fn(), stop: vi.fn(), disconnect: vi.fn(),
    };
    const mockCompressor = {
      threshold: { value: -50 }, knee: { value: 40 }, ratio: { value: 12 },
      attack: { value: 0 }, release: { value: 0.25 },
      connect: vi.fn(), disconnect: vi.fn(),
    };
    const mockAudioCtx = {
      state: "running", sampleRate: 48000,
      destination: { maxChannelCount: 6 },
      createOscillator: vi.fn().mockReturnValue(mockOscillator),
      createDynamicsCompressor: vi.fn().mockReturnValue(mockCompressor),
      startRendering: vi.fn().mockResolvedValue(mockRenderedBuffer),
      close: vi.fn().mockResolvedValue(undefined),
    };
    vi.stubGlobal("OfflineAudioContext", vi.fn().mockImplementation(() => mockAudioCtx));

    const result = await collectAudio();
    expect(mockAudioCtx.startRendering).toHaveBeenCalled();
    expect(mockRenderedBuffer.getChannelData).toHaveBeenCalledWith(0);
    expect(result).not.toBeNull();
    expect(result!.value.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(result!.value.sampleRate).toBe(48000);
    expect(result!.value.maxChannelCount).toBe(6);
  });

  it("returns null when AudioContext is unavailable", async () => {
    vi.stubGlobal("OfflineAudioContext", undefined);
    vi.stubGlobal("webkitOfflineAudioContext", undefined);
    const result = await collectAudio();
    expect(result).toBeNull();
  });
});
