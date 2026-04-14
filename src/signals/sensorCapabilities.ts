import type { SensorCapabilitiesSignal, SignalResult } from "../types";
import { sha256 } from "../hash";

type PermissionNameLike =
  | PermissionName
  | "clipboard-read"
  | "accelerometer"
  | "gyroscope"
  | "magnetometer";

async function queryPermission(
  name: PermissionNameLike,
): Promise<string | null> {
  try {
    const permissions = (navigator as Navigator & {
      permissions?: {
        query?: (descriptor: PermissionDescriptor) => Promise<{ state: PermissionState }>;
      };
    }).permissions;
    if (!permissions?.query) return null;
    const result = await permissions.query({ name } as PermissionDescriptor);
    return result.state;
  } catch {
    return null;
  }
}

function detectPolicyBlocked(key: string): boolean {
  const ctorMap: Record<string, unknown> = {
    accelerometer: (globalThis as Record<string, unknown>).Accelerometer,
    gyroscope: (globalThis as Record<string, unknown>).Gyroscope,
    magnetometer: (globalThis as Record<string, unknown>).Magnetometer,
    absoluteOrientation:
      (globalThis as Record<string, unknown>).AbsoluteOrientationSensor,
    relativeOrientation:
      (globalThis as Record<string, unknown>).RelativeOrientationSensor,
    ambientLight: (globalThis as Record<string, unknown>).AmbientLightSensor,
  };

  const Ctor = ctorMap[key] as (new () => object) | undefined;
  if (typeof Ctor !== "function") return false;

  try {
    void new Ctor();
    return false;
  } catch (error) {
    const name =
      error instanceof Error && typeof error.name === "string"
        ? error.name
        : "";
    return name === "SecurityError" || name === "NotAllowedError";
  }
}

export async function collectSensorCapabilities(): Promise<
  SignalResult<SensorCapabilitiesSignal> | null
> {
  const start = performance.now();

  try {
    const apis = {
      accelerometer:
        typeof (globalThis as Record<string, unknown>).Accelerometer !==
        "undefined",
      gyroscope:
        typeof (globalThis as Record<string, unknown>).Gyroscope !== "undefined",
      magnetometer:
        typeof (globalThis as Record<string, unknown>).Magnetometer !==
        "undefined",
      absoluteOrientation:
        typeof (globalThis as Record<string, unknown>)
          .AbsoluteOrientationSensor !== "undefined",
      relativeOrientation:
        typeof (globalThis as Record<string, unknown>)
          .RelativeOrientationSensor !== "undefined",
      ambientLight:
        typeof (globalThis as Record<string, unknown>).AmbientLightSensor !==
        "undefined",
      geolocation:
        typeof (navigator as unknown as Record<string, unknown>).geolocation !==
        "undefined",
      deviceMotion:
        typeof (globalThis as Record<string, unknown>).DeviceMotionEvent !==
        "undefined",
      deviceOrientation:
        typeof (globalThis as Record<string, unknown>).DeviceOrientationEvent !==
        "undefined",
    };

    const permissionStates = {
      geolocation: await queryPermission("geolocation"),
      camera: await queryPermission("camera"),
      microphone: await queryPermission("microphone"),
      clipboardRead: await queryPermission("clipboard-read"),
      accelerometer: await queryPermission("accelerometer"),
      gyroscope: await queryPermission("gyroscope"),
      magnetometer: await queryPermission("magnetometer"),
    };

    const policyBlocked = Object.keys(apis).filter((key) =>
      detectPolicyBlocked(key),
    );

    const value: SensorCapabilitiesSignal = {
      apis,
      permissionStates,
      policyBlocked,
      availableCount: Object.values(apis).filter(Boolean).length,
      hash: "",
    };

    const hashInput = [
      `apis:${Object.entries(apis)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, enabled]) => `${key}:${enabled}`)
        .join(",")}`,
      `permissions:${Object.entries(permissionStates)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, state]) => `${key}:${state ?? "unknown"}`)
        .join(",")}`,
      `blocked:${policyBlocked.sort().join(",")}`,
    ];
    value.hash = await sha256(hashInput.join("|"));

    return {
      value,
      duration: performance.now() - start,
    };
  } catch {
    return null;
  }
}
