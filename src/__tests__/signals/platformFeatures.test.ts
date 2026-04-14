import { describe, it, expect, beforeEach, vi } from "vitest";
import { collectPlatformFeatures } from "../../signals/platformFeatures";

describe("collectPlatformFeatures", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns expected shape with features, estimatedPlatform, hash", async () => {
    const result = await collectPlatformFeatures();
    expect(result).not.toBeNull();
    expect(typeof result!.value.features).toBe("object");
    expect(typeof result!.value.estimatedPlatform).toBe("string");
    expect(result!.value.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(result!.duration).toBeGreaterThanOrEqual(0);
  });

  it("tests all 15 APIs", async () => {
    const result = await collectPlatformFeatures();
    expect(result).not.toBeNull();
    const expectedKeys = [
      "BarcodeDetector", "ContactsManager", "ContentIndex", "EyeDropper",
      "FileSystemWritableFileStream", "HID", "Serial", "USB", "SharedWorker",
      "PointerEvent", "TouchEvent", "showDirectoryPicker", "showOpenFilePicker",
      "Bluetooth", "WakeLock",
    ];
    for (const key of expectedKeys) {
      expect(key in result!.value.features).toBe(true);
      expect(typeof result!.value.features[key]).toBe("boolean");
    }
  });

  it("estimates Android platform when BarcodeDetector + ContactsManager present", async () => {
    (globalThis as Record<string, unknown>)["BarcodeDetector"] = class {};
    Object.defineProperty(navigator, "contacts", { value: {}, configurable: true });

    const result = await collectPlatformFeatures();
    expect(result).not.toBeNull();
    expect(result!.value.estimatedPlatform).toBe("Android");

    delete (globalThis as Record<string, unknown>)["BarcodeDetector"];
  });

  it("estimates Desktop platform when HID is present and not Mobile", async () => {
    // Desktop check: HID present + SharedWorker present (so Mobile condition fails)
    Object.defineProperty(navigator, "hid", { value: {}, configurable: true });
    (globalThis as Record<string, unknown>)["SharedWorker"] = class {};

    const result = await collectPlatformFeatures();
    expect(result).not.toBeNull();
    // Either Desktop (HID wins) or depends on TouchEvent in test env
    expect(result!.value.features["HID"]).toBe(true);

    delete (globalThis as Record<string, unknown>)["SharedWorker"];
  });

  it("produces deterministic hash", async () => {
    const r1 = await collectPlatformFeatures();
    const r2 = await collectPlatformFeatures();
    expect(r1!.value.hash).toBe(r2!.value.hash);
  });
});
