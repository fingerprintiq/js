import { describe, it, expect, vi, beforeEach } from "vitest";
import { collectTimezone } from "../../signals/timezone";

describe("collectTimezone", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns expected shape with valid hash", async () => {
    const result = await collectTimezone();
    expect(result).not.toBeNull();
    expect(typeof result!.value.reported).toBe("string");
    expect(result!.value.reported.length).toBeGreaterThan(0);
    expect(typeof result!.value.offsetHistorical).toBe("number");
    expect(typeof result!.value.isSpoofed).toBe("boolean");
    expect(result!.value.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(result!.duration).toBeGreaterThanOrEqual(0);
  });

  it("reported timezone matches Intl.DateTimeFormat", async () => {
    const expected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const result = await collectTimezone();
    expect(result!.value.reported).toBe(expected);
  });

  it("produces deterministic hash", async () => {
    const r1 = await collectTimezone();
    const r2 = await collectTimezone();
    expect(r1!.value.hash).toBe(r2!.value.hash);
  });

  it("offsetHistorical is a number (may be 0 in UTC environments)", async () => {
    const result = await collectTimezone();
    expect(Number.isFinite(result!.value.offsetHistorical)).toBe(true);
  });
});
