"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import FingerprintIQ from "../index";
import type { FingerprintIQConfig, IdentifyOptions, IdentifyResponse } from "../types";

export interface UseFingerprintIQOptions extends FingerprintIQConfig {
  /** Skip the auto-identify on mount. Defaults to false. */
  manual?: boolean;
  /** Options passed to the first identify() call on mount. */
  identifyOptions?: IdentifyOptions;
}

export interface UseFingerprintIQResult {
  result: IdentifyResponse | null;
  loading: boolean;
  error: Error | null;
  identify: (options?: IdentifyOptions) => Promise<IdentifyResponse>;
}

export function useFingerprintIQ(
  options: UseFingerprintIQOptions,
): UseFingerprintIQResult {
  const { manual, identifyOptions, ...config } = options;
  const clientRef = useRef<FingerprintIQ | null>(null);
  const cacheStorage = config.cache ? config.cache.storage : null;
  const cacheTtl = config.cache ? config.cache.ttl ?? null : null;

  const [result, setResult] = useState<IdentifyResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(!manual);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    clientRef.current = new FingerprintIQ(config);
  }, [
    config.apiKey,
    config.endpoint,
    config.timeout,
    config.detectWallets,
    cacheStorage,
    cacheTtl,
  ]);

  const identify = useCallback(
    async (callOptions?: IdentifyOptions): Promise<IdentifyResponse> => {
      if (!clientRef.current) throw new Error("FingerprintIQ client not initialized");
      setLoading(true);
      setError(null);
      try {
        const res = await clientRef.current.identify(callOptions);
        setResult(res);
        setLoading(false);
        return res;
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);
        setLoading(false);
        throw err;
      }
    },
    [],
  );

  useEffect(() => {
    if (manual) {
      setLoading(false);
      return;
    }

    identify(identifyOptions).catch(() => {
      // error already captured in state
    });
  }, [identify, identifyOptions, manual]);

  return { result, loading, error, identify };
}

export type { FingerprintIQConfig, IdentifyOptions, IdentifyResponse };
