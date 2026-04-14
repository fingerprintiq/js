import { beforeEach, describe, expect, it } from "vitest";
import { collectGeometryVector } from "../../signals/geometryVector";

describe("collectGeometryVector", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1200,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 800,
    });
    Object.defineProperty(window, "outerWidth", {
      configurable: true,
      value: 1280,
    });
    Object.defineProperty(window, "outerHeight", {
      configurable: true,
      value: 900,
    });
    Object.defineProperty(window, "devicePixelRatio", {
      configurable: true,
      value: 2,
    });
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: {
        width: 1180,
        height: 780,
        scale: 1,
        offsetLeft: 0,
        offsetTop: 0,
      },
    });
    Object.defineProperty(screen, "width", {
      configurable: true,
      value: 1512,
    });
    Object.defineProperty(screen, "height", {
      configurable: true,
      value: 982,
    });
    Object.defineProperty(screen, "availWidth", {
      configurable: true,
      value: 1512,
    });
    Object.defineProperty(screen, "availHeight", {
      configurable: true,
      value: 945,
    });
    Object.defineProperty(screen, "orientation", {
      configurable: true,
      value: { type: "landscape-primary", angle: 0 },
    });
  });

  it("captures window, screen, and viewport geometry", async () => {
    const result = await collectGeometryVector();

    expect(result).not.toBeNull();
    expect(result?.value.window.innerWidth).toBe(1200);
    expect(result?.value.visualViewport?.width).toBe(1180);
    expect(result?.value.chromeInsetX).toBe(80);
    expect(result?.value.hash).toHaveLength(64);
  });

  it("flags impossible geometry combinations", async () => {
    Object.defineProperty(window, "outerWidth", {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(screen, "orientation", {
      configurable: true,
      value: { type: "portrait-primary", angle: 0 },
    });

    const result = await collectGeometryVector();

    expect(result?.value.suspiciousFlags).toContain(
      "outer_width_smaller_than_inner",
    );
    expect(result?.value.suspiciousFlags).toContain(
      "orientation_screen_mismatch",
    );
  });
});
