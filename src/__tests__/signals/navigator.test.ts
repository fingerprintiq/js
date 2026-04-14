import { describe, it, expect, vi, beforeEach } from "vitest";
import { collectNavigator } from "../../signals/navigator";

describe("collectNavigator", () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it("collects navigator properties", async () => {
    vi.stubGlobal("navigator", {
      hardwareConcurrency: 8,
      deviceMemory: 4,
      maxTouchPoints: 0,
      languages: ["en-US", "en"],
      platform: "MacIntel",
      cookieEnabled: true,
      doNotTrack: null,
    });

    const result = await collectNavigator();
    expect(result).not.toBeNull();
    expect(result!.value.hardwareConcurrency).toBe(8);
    expect(result!.value.deviceMemory).toBe(4);
    expect(result!.value.maxTouchPoints).toBe(0);
    expect(result!.value.languages).toEqual(["en-US", "en"]);
    expect(result!.value.platform).toBe("MacIntel");
    expect(result!.value.cookieEnabled).toBe(true);
    expect(result!.value.doNotTrack).toBeNull();
    expect(result!.duration).toBeGreaterThanOrEqual(0);
  });

  it("detects presence of navigator APIs", async () => {
    vi.stubGlobal("navigator", {
      hardwareConcurrency: 4,
      maxTouchPoints: 0,
      languages: ["en"],
      platform: "Linux",
      cookieEnabled: false,
      doNotTrack: "1",
      bluetooth: {},
      usb: {},
      hid: {},
      serial: {},
      wakeLock: {},
      gpu: {},
    });

    const result = await collectNavigator();
    expect(result).not.toBeNull();
    expect(result!.value.hasBluetooth).toBe(true);
    expect(result!.value.hasUsb).toBe(true);
    expect(result!.value.hasHid).toBe(true);
    expect(result!.value.hasSerial).toBe(true);
    expect(result!.value.hasWakeLock).toBe(true);
    expect(result!.value.hasGpu).toBe(true);
  });

  it("collects keyboard layout", async () => {
    const mockLayoutMap = new Map([["KeyA", "a"]]);
    vi.stubGlobal("navigator", {
      hardwareConcurrency: 4,
      maxTouchPoints: 0,
      languages: ["en"],
      platform: "Win32",
      cookieEnabled: true,
      doNotTrack: null,
      keyboard: {
        getLayoutMap: vi.fn().mockResolvedValue(mockLayoutMap),
      },
    });

    const result = await collectNavigator();
    expect(result).not.toBeNull();
    expect(result!.value.keyboardLayout).toBe("a");
  });

  it("collects connection type", async () => {
    vi.stubGlobal("navigator", {
      hardwareConcurrency: 4,
      maxTouchPoints: 0,
      languages: ["en"],
      platform: "Linux",
      cookieEnabled: true,
      doNotTrack: null,
      connection: { effectiveType: "4g" },
    });

    const result = await collectNavigator();
    expect(result).not.toBeNull();
    expect(result!.value.connectionType).toBe("4g");
  });

  it("collects bluetoothAvailable", async () => {
    vi.stubGlobal("navigator", {
      hardwareConcurrency: 4,
      maxTouchPoints: 0,
      languages: ["en"],
      platform: "Linux",
      cookieEnabled: true,
      doNotTrack: null,
      bluetooth: {
        getAvailability: vi.fn().mockResolvedValue(true),
      },
    });

    const result = await collectNavigator();
    expect(result).not.toBeNull();
    expect(result!.value.bluetoothAvailable).toBe(true);
  });

  it("returns null when navigator is unavailable", async () => {
    vi.stubGlobal("navigator", undefined);
    const result = await collectNavigator();
    expect(result).toBeNull();
  });
});
