import type { SignalResult, SpeechSignal } from "../types";
import { sha256 } from "../hash";

export async function collectSpeech(): Promise<SignalResult<SpeechSignal> | null> {
  const start = performance.now();
  try {
    if (typeof speechSynthesis === "undefined") return null;

    let voices = speechSynthesis.getVoices();

    if (voices.length === 0) {
      voices = await new Promise<SpeechSynthesisVoice[]>((resolve) => {
        const timeout = setTimeout(() => resolve([]), 2000);
        speechSynthesis.onvoiceschanged = () => {
          clearTimeout(timeout);
          resolve(speechSynthesis.getVoices());
        };
      });
    }

    if (voices.length === 0) return null;

    const localVoices = voices
      .filter((v) => v.localService)
      .map((v) => v.name)
      .sort();

    const remoteVoiceCount = voices.filter((v) => !v.localService).length;
    const defaultVoice = voices.find((v) => v.default)?.name ?? null;

    const hashInput = voices
      .map((v) => `${v.name}:${v.lang}:${v.localService}`)
      .sort()
      .join("|");
    const hash = await sha256(hashInput);

    return {
      value: {
        voiceCount: voices.length,
        localVoices,
        remoteVoiceCount,
        defaultVoice,
        hash,
      },
      duration: performance.now() - start,
    };
  } catch {
    return null;
  }
}
