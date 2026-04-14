import type { SignalResult, CodecSignal } from "../types";
import { sha256 } from "../hash";

const MIME_TYPES = [
  'video/mp4; codecs="avc1.42E01E"',
  'video/mp4; codecs="hev1.1.6.L93.B0"',
  'video/webm; codecs="vp8"',
  'video/webm; codecs="vp9"',
  'video/webm; codecs="av01.0.05M.08"',
  "video/ogg",
  "audio/mpeg",
  "audio/ogg",
  "audio/webm",
  "audio/aac",
  "audio/flac",
  "audio/wav",
];

export async function collectCodecs(): Promise<SignalResult<CodecSignal> | null> {
  const start = performance.now();
  try {
    const matrix: Record<string, { canPlay: string; mediaSource: boolean; mediaRecorder: boolean }> = {};

    const video = document.createElement("video");

    for (const mime of MIME_TYPES) {
      let canPlay = "";
      try {
        canPlay = video.canPlayType(mime);
      } catch { /* ignore */ }

      let mediaSource = false;
      try {
        if (typeof MediaSource !== "undefined" && "isTypeSupported" in MediaSource) {
          mediaSource = (MediaSource as { isTypeSupported: (type: string) => boolean }).isTypeSupported(mime);
        }
      } catch { /* ignore */ }

      let mediaRecorder = false;
      try {
        if (typeof MediaRecorder !== "undefined" && "isTypeSupported" in MediaRecorder) {
          mediaRecorder = (MediaRecorder as { isTypeSupported: (type: string) => boolean }).isTypeSupported(mime);
        }
      } catch { /* ignore */ }

      matrix[mime] = { canPlay, mediaSource, mediaRecorder };
    }

    const hashInput = Object.entries(matrix)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v.canPlay}:${v.mediaSource}:${v.mediaRecorder}`)
      .join("|");
    const hash = await sha256(hashInput);

    return {
      value: { matrix, hash },
      duration: performance.now() - start,
    };
  } catch {
    return null;
  }
}
