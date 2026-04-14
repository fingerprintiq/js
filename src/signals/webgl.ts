import type { SignalResult, WebGLSignal } from "../types";

const SOFTWARE_RENDERERS = ["swiftshader", "llvmpipe", "softpipe", "mesa"];
const GL_PARAMS = [0x0d33, 0x8869, 0x8dfb, 0x8dfc, 0x8dfd] as const;

function measureGpuTiming(gl: WebGLRenderingContext): number | null {
  try {
    const vs = gl.createShader(gl.VERTEX_SHADER);
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    if (!vs || !fs) return null;

    gl.shaderSource(vs, "void main(){gl_Position=vec4(0,0,0,1);}");
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) { gl.deleteShader(vs); gl.deleteShader(fs); return null; }

    gl.shaderSource(fs, "precision mediump float;void main(){float v=0.0;for(int i=0;i<1000;i++){v+=sin(float(i)*0.01);}gl_FragColor=vec4(v,0,0,1);}");
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) { gl.deleteShader(vs); gl.deleteShader(fs); return null; }

    const program = gl.createProgram();
    if (!program) { gl.deleteShader(vs); gl.deleteShader(fs); return null; }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { gl.deleteProgram(program); gl.deleteShader(vs); gl.deleteShader(fs); return null; }

    gl.useProgram(program);
    const start = performance.now();
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.finish();
    const elapsed = performance.now() - start;
    gl.deleteProgram(program); gl.deleteShader(vs); gl.deleteShader(fs);
    return elapsed;
  } catch { return null; }
}

export async function collectWebGL(): Promise<SignalResult<WebGLSignal> | null> {
  const start = performance.now();
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") as WebGLRenderingContext | null;
    if (!gl) return null;

    const dbgExt = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = dbgExt ? (gl.getParameter(dbgExt.UNMASKED_RENDERER_WEBGL) as string) : "unknown";
    const vendor = dbgExt ? (gl.getParameter(dbgExt.UNMASKED_VENDOR_WEBGL) as string) : "unknown";
    const extensions = gl.getSupportedExtensions() ?? [];

    const params: Record<string, number> = {};
    for (const p of GL_PARAMS) {
      const val = gl.getParameter(p);
      if (typeof val === "number") params[`0x${p.toString(16)}`] = val;
    }

    const isSoftwareRenderer = SOFTWARE_RENDERERS.some((sr) => renderer.toLowerCase().includes(sr));
    const gpuTimingMs = measureGpuTiming(gl);

    return {
      value: { renderer, vendor, extensions, params, gpuTimingMs, isSoftwareRenderer },
      duration: performance.now() - start,
    };
  } catch { return null; }
}
