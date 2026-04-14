import { beforeEach, describe, expect, it, vi } from "vitest";
import { collectSensorCapabilities } from "../../signals/sensorCapabilities";

describe("collectSensorCapabilities", () => {
  beforeEach(() => {
    (globalThis as Record<string, unknown>).Accelerometer =
      function Accelerometer() {};
    (globalThis as Record<string, unknown>).Gyroscope = function Gyroscope() {};
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {},
    });
    Object.defineProperty(navigator, "permissions", {
      configurable: true,
      value: {
        query: vi.fn(async ({ name }: { name: string }) => ({
          state: name === "geolocation" ? "granted" : "prompt",
        })),
      },
    });
  });

  it("captures permissionless sensor and permission state data", async () => {
    const result = await collectSensorCapabilities();

    expect(result).not.toBeNull();
    expect(result?.value.apis.accelerometer).toBe(true);
    expect(result?.value.apis.geolocation).toBe(true);
    expect(result?.value.permissionStates.geolocation).toBe("granted");
    expect(result?.value.hash).toHaveLength(64);
  });
});
