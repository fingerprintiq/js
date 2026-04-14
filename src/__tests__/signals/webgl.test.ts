import { describe, it, expect, vi, beforeEach } from "vitest";
import { collectWebGL } from "../../signals/webgl";

function createMockGl() {
  return {
    getExtension: vi.fn().mockImplementation((name: string) => {
      if (name === "WEBGL_debug_renderer_info") return { UNMASKED_RENDERER_WEBGL: 0x9246, UNMASKED_VENDOR_WEBGL: 0x9245 };
      return null;
    }),
    getParameter: vi.fn().mockImplementation((param: number) => {
      if (param === 0x9246) return "ANGLE (NVIDIA GeForce GTX 1080)";
      if (param === 0x9245) return "Google Inc. (NVIDIA)";
      if (param === 0x0d33) return 16384;
      if (param === 0x8869) return 16;
      return 0;
    }),
    getSupportedExtensions: vi.fn().mockReturnValue(["WEBGL_debug_renderer_info", "OES_texture_float", "EXT_color_buffer_float"]),
    createShader: vi.fn().mockReturnValue({}),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn().mockReturnValue(true),
    createProgram: vi.fn().mockReturnValue({}),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn().mockReturnValue(true),
    useProgram: vi.fn(),
    drawArrays: vi.fn(),
    finish: vi.fn(),
    deleteProgram: vi.fn(),
    deleteShader: vi.fn(),
    VERTEX_SHADER: 0x8b31, FRAGMENT_SHADER: 0x8b30, COMPILE_STATUS: 0x8b81, LINK_STATUS: 0x8b82, TRIANGLES: 0x0004,
  };
}

describe("collectWebGL", () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it("collects renderer, vendor, extensions, and params", async () => {
    const mockGl = createMockGl();
    const mockCanvas = { getContext: vi.fn().mockReturnValue(mockGl) };
    vi.spyOn(document, "createElement").mockReturnValue(mockCanvas as unknown as HTMLElement);

    const result = await collectWebGL();
    expect(result).not.toBeNull();
    expect(result!.value.renderer).toBe("ANGLE (NVIDIA GeForce GTX 1080)");
    expect(result!.value.vendor).toBe("Google Inc. (NVIDIA)");
    expect(result!.value.extensions).toContain("OES_texture_float");
    expect(result!.value.isSoftwareRenderer).toBe(false);
  });

  it("detects software renderer", async () => {
    const mockGl = createMockGl();
    mockGl.getParameter = vi.fn().mockImplementation((param: number) => {
      if (param === 0x9246) return "Google SwiftShader";
      if (param === 0x9245) return "Google Inc.";
      return 0;
    });
    const mockCanvas = { getContext: vi.fn().mockReturnValue(mockGl) };
    vi.spyOn(document, "createElement").mockReturnValue(mockCanvas as unknown as HTMLElement);

    const result = await collectWebGL();
    expect(result!.value.isSoftwareRenderer).toBe(true);
  });

  it("returns null when WebGL is unavailable", async () => {
    const mockCanvas = { getContext: vi.fn().mockReturnValue(null) };
    vi.spyOn(document, "createElement").mockReturnValue(mockCanvas as unknown as HTMLElement);
    const result = await collectWebGL();
    expect(result).toBeNull();
  });
});
