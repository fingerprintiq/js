import { beforeEach, describe, expect, it, vi } from "vitest";
import { collectBehavioralRisk } from "../../signals/behavioralRisk";
import {
  primeBehaviorTracking,
  resetBehaviorTrackingForTests,
} from "../../signals/behaviorTracker";

describe("collectBehavioralRisk", () => {
  beforeEach(() => {
    resetBehaviorTrackingForTests();
    if (typeof (globalThis as Record<string, unknown>).PointerEvent === "undefined") {
      (globalThis as Record<string, unknown>).PointerEvent = MouseEvent;
    }
  });

  it("returns insufficient_data before meaningful interaction", async () => {
    const times = [0, 10];
    let index = 0;
    vi.spyOn(performance, "now").mockImplementation(
      () => times[index++] ?? times[times.length - 1],
    );

    primeBehaviorTracking();
    const result = await collectBehavioralRisk();

    expect(result?.value.classification).toBe("insufficient_data");
    expect(result?.value.totalEventCount).toBe(0);
  });

  it("flags synthetic-looking straight-line bursts", async () => {
    const times = [0, 1000, 1020, 1040, 1060, 1080, 1100, 1120, 1140, 1160, 1180, 1200, 1210, 1220, 1230, 1240, 1250, 1260, 1270, 1280, 1290, 1300];
    let index = 0;
    vi.spyOn(performance, "now").mockImplementation(
      () => times[index++] ?? times[times.length - 1],
    );

    primeBehaviorTracking();

    for (let i = 0; i < 8; i += 1) {
      window.dispatchEvent(
        new PointerEvent("pointermove", { clientX: i * 20, clientY: 0 }),
      );
    }
    for (let i = 0; i < 4; i += 1) {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
    }
    for (let i = 0; i < 4; i += 1) {
      window.dispatchEvent(new Event("scroll"));
    }
    window.dispatchEvent(new MouseEvent("click"));

    const result = await collectBehavioralRisk();

    expect(result?.value.classification).toBe("synthetic_like");
    expect(result?.value.reasons).toContain("low_pointer_curvature");
    expect(result?.value.reasons).toContain("unusually_fast_typing");
    expect(result?.value.riskScore).toBeGreaterThan(0.4);
  });
});
