import { describe, it, expect, vi, beforeEach } from "vitest";
import { collectIntl } from "../../signals/intl";

describe("collectIntl", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns expected shape with valid hash", async () => {
    const result = await collectIntl();
    expect(result).not.toBeNull();
    expect(Array.isArray(result!.value.locales)).toBe(true);
    expect(typeof result!.value.formattedNumber).toBe("string");
    expect(typeof result!.value.formattedRelativeTime).toBe("string");
    expect(typeof result!.value.formattedList).toBe("string");
    expect(typeof result!.value.localeSpoofed).toBe("boolean");
    expect(result!.value.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(result!.duration).toBeGreaterThanOrEqual(0);
  });

  it("produces deterministic hash", async () => {
    const r1 = await collectIntl();
    const r2 = await collectIntl();
    expect(r1!.value.hash).toBe(r2!.value.hash);
  });

  it("detects locale spoofing when navigator.language differs from Intl locale", async () => {
    vi.spyOn(navigator, "language", "get").mockReturnValue("ja");
    const result = await collectIntl();
    expect(result).not.toBeNull();
    // In jsdom environment the Intl locale is likely "en", so this should be spoofed
    if (result!.value.locales.length > 0) {
      const intlLang = result!.value.locales[0].split("-")[0].toLowerCase();
      expect(result!.value.localeSpoofed).toBe(intlLang !== "ja");
    }
  });

  it("localeSpoofed is false when navigator.language matches Intl locale", async () => {
    // Get what Intl actually reports
    const intlLocale = new Intl.Collator().resolvedOptions().locale.split("-")[0];
    vi.spyOn(navigator, "language", "get").mockReturnValue(intlLocale);
    const result = await collectIntl();
    expect(result).not.toBeNull();
    expect(result!.value.localeSpoofed).toBe(false);
  });
});
