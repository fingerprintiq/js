import { describe, it, expect, vi, beforeEach } from "vitest";
import { collectSpeech } from "../../signals/speech";

describe("collectSpeech", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Remove speechSynthesis if previously defined
    delete (globalThis as Record<string, unknown>).speechSynthesis;
  });

  it("returns null when speechSynthesis is unavailable", async () => {
    const result = await collectSpeech();
    expect(result).toBeNull();
  });

  it("returns expected shape when voices are available", async () => {
    const mockVoices: SpeechSynthesisVoice[] = [
      { name: "Alice", lang: "en-US", localService: true, default: true, voiceURI: "Alice" } as SpeechSynthesisVoice,
      { name: "Bob", lang: "en-GB", localService: false, default: false, voiceURI: "Bob" } as SpeechSynthesisVoice,
      { name: "Carla", lang: "es-ES", localService: true, default: false, voiceURI: "Carla" } as SpeechSynthesisVoice,
    ];

    (globalThis as Record<string, unknown>).speechSynthesis = {
      getVoices: vi.fn().mockReturnValue(mockVoices),
      onvoiceschanged: null,
    };

    const result = await collectSpeech();
    expect(result).not.toBeNull();
    expect(result!.value.voiceCount).toBe(3);
    expect(result!.value.localVoices).toEqual(["Alice", "Carla"]);
    expect(result!.value.remoteVoiceCount).toBe(1);
    expect(result!.value.defaultVoice).toBe("Alice");
    expect(result!.value.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(result!.duration).toBeGreaterThanOrEqual(0);
  });

  it("returns null when getVoices returns empty and onvoiceschanged times out", async () => {
    vi.useFakeTimers();

    (globalThis as Record<string, unknown>).speechSynthesis = {
      getVoices: vi.fn().mockReturnValue([]),
      onvoiceschanged: null,
    };

    const promise = collectSpeech();
    vi.advanceTimersByTime(2001);
    const result = await promise;
    expect(result).toBeNull();

    vi.useRealTimers();
  });

  it("produces deterministic hash for same voices", async () => {
    const mockVoices: SpeechSynthesisVoice[] = [
      { name: "Voice1", lang: "en-US", localService: true, default: true, voiceURI: "v1" } as SpeechSynthesisVoice,
    ];

    (globalThis as Record<string, unknown>).speechSynthesis = {
      getVoices: vi.fn().mockReturnValue(mockVoices),
      onvoiceschanged: null,
    };

    const r1 = await collectSpeech();
    const r2 = await collectSpeech();
    expect(r1!.value.hash).toBe(r2!.value.hash);
  });
});
