import { ref, onMounted, type Ref } from "vue";
import FingerprintIQ from "../index";
import type { FingerprintIQConfig, IdentifyOptions, IdentifyResponse } from "../types";

export interface UseFingerprintIQOptions extends FingerprintIQConfig {
  /** Skip the auto-identify on mount. Defaults to false. */
  manual?: boolean;
  /** Options passed to the first identify() call on mount. */
  identifyOptions?: IdentifyOptions;
}

export interface UseFingerprintIQResult {
  result: Ref<IdentifyResponse | null>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  identify: (options?: IdentifyOptions) => Promise<IdentifyResponse>;
}

export function useFingerprintIQ(
  options: UseFingerprintIQOptions,
): UseFingerprintIQResult {
  const { manual, identifyOptions, ...config } = options;
  const client = new FingerprintIQ(config);

  const result = ref<IdentifyResponse | null>(null);
  const loading = ref<boolean>(!manual);
  const error = ref<Error | null>(null);

  const identify = async (
    callOptions?: IdentifyOptions,
  ): Promise<IdentifyResponse> => {
    loading.value = true;
    error.value = null;
    try {
      const res = await client.identify(callOptions);
      result.value = res;
      loading.value = false;
      return res;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      error.value = err;
      loading.value = false;
      throw err;
    }
  };

  onMounted(() => {
    if (manual) return;
    identify(identifyOptions).catch(() => {
      // error already captured in state
    });
  });

  return { result, loading, error, identify };
}

export type { FingerprintIQConfig, IdentifyOptions, IdentifyResponse };
