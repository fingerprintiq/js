import type { SignalResult, WebGPUSignal } from "../types";

const EMPTY_SIGNAL: WebGPUSignal = {
  available: false, vendor: "", architecture: "", device: "", description: "", features: [],
};

export async function collectWebGPU(): Promise<SignalResult<WebGPUSignal>> {
  const start = performance.now();
  try {
    if (!(navigator as unknown as Record<string, unknown>).gpu) return { value: EMPTY_SIGNAL, duration: performance.now() - start };

    const gpu = (navigator as unknown as Record<string, unknown>).gpu as { requestAdapter: () => Promise<{ info: { vendor: string; architecture: string; device: string; description: string }; features: Set<string> } | null> };
    const adapter = await gpu.requestAdapter();
    if (!adapter) return { value: EMPTY_SIGNAL, duration: performance.now() - start };

    const info = adapter.info;
    const features = Array.from(adapter.features) as string[];

    return {
      value: {
        available: true,
        vendor: info.vendor,
        architecture: info.architecture,
        device: info.device,
        description: info.description,
        features,
      },
      duration: performance.now() - start,
    };
  } catch {
    return { value: EMPTY_SIGNAL, duration: performance.now() - start };
  }
}
