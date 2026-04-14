import { describe, it, expect, vi, beforeEach } from "vitest";
import { collectCodecs } from "../../signals/codecs";

describe("collectCodecs", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns expected shape with matrix and hash", async () => {
    const mockVideo = {
      canPlayType: vi.fn().mockReturnValue("maybe"),
    };
    vi.spyOn(document, "createElement").mockReturnValue(mockVideo as unknown as HTMLElement);

    const result = await collectCodecs();
    expect(result).not.toBeNull();
    expect(typeof result!.value.matrix).toBe("object");
    expect(Object.keys(result!.value.matrix).length).toBe(12);
    expect(result!.value.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(result!.duration).toBeGreaterThanOrEqual(0);
  });

  it("each matrix entry has canPlay, mediaSource, mediaRecorder fields", async () => {
    const mockVideo = {
      canPlayType: vi.fn().mockReturnValue("probably"),
    };
    vi.spyOn(document, "createElement").mockReturnValue(mockVideo as unknown as HTMLElement);

    const result = await collectCodecs();
    expect(result).not.toBeNull();
    for (const [, entry] of Object.entries(result!.value.matrix)) {
      expect(typeof entry.canPlay).toBe("string");
      expect(typeof entry.mediaSource).toBe("boolean");
      expect(typeof entry.mediaRecorder).toBe("boolean");
    }
  });

  it("produces deterministic hash for same codec support", async () => {
    const mockVideo = {
      canPlayType: vi.fn().mockReturnValue("maybe"),
    };
    vi.spyOn(document, "createElement").mockReturnValue(mockVideo as unknown as HTMLElement);

    const r1 = await collectCodecs();
    const r2 = await collectCodecs();
    expect(r1!.value.hash).toBe(r2!.value.hash);
  });
});
