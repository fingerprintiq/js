import type { FingerprintIQConfig, IdentifyResponse, IdentifyPayload, IdentifyOptions, CacheConfig } from "./types";
import { collectAllSignals } from "./collect";
import { primeBehaviorTracking } from "./signals/behaviorTracker";
import { initWalletListener, getDiscoveredAddresses, onWalletAddress } from "./signals/wallet-connect";

const DEFAULT_ENDPOINT = "https://fingerprintiq.com";
const DEFAULT_TIMEOUT = 10_000;
const CH_BOOTSTRAP_KEY = "__fiq_ua_ch_bootstrapped__";
const WALLET_LINK_DEBOUNCE_MS = 300;

export default class FingerprintIQ {
  private readonly apiKey: string;
  private readonly endpoint: string;
  private readonly timeout: number;
  private readonly detectWallets: boolean;
  private readonly cache: CacheConfig | false;

  // Tracks the visitorId returned from the most recent identify() call.
  // Wallet-link auto-sync only runs once we have a visitor to attach to.
  private lastVisitorId: string | null = null;
  private walletLinkPending = new Set<string>();
  private walletLinkTimer: ReturnType<typeof setTimeout> | null = null;
  private walletAutoLinkUnsub: (() => void) | null = null;

  constructor(config: FingerprintIQConfig) {
    if (!config.apiKey) throw new Error("apiKey is required");
    this.apiKey = config.apiKey;
    this.endpoint = (config.endpoint ?? DEFAULT_ENDPOINT).replace(/\/$/, "");
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    this.detectWallets = config.detectWallets ?? true;
    this.cache = config.cache ?? false;
    primeBehaviorTracking();
    if (this.detectWallets) {
      initWalletListener();
      this.subscribeToWalletAddresses();
    }
  }

  private subscribeToWalletAddresses(): void {
    if (this.walletAutoLinkUnsub) return;
    this.walletAutoLinkUnsub = onWalletAddress((address) => {
      // Only EVM-shaped addresses go to wallet-link for now; the backend
      // enrichment pipeline is EVM-only.
      if (!/^0x[a-f0-9]{40}$/.test(address)) return;
      this.walletLinkPending.add(address);
      this.scheduleWalletLink();
    });
  }

  private scheduleWalletLink(): void {
    if (!this.lastVisitorId) return; // wait until first identify() returns
    if (this.walletLinkTimer) clearTimeout(this.walletLinkTimer);
    this.walletLinkTimer = setTimeout(() => {
      this.walletLinkTimer = null;
      void this.flushWalletLink();
    }, WALLET_LINK_DEBOUNCE_MS);
  }

  private async flushWalletLink(): Promise<void> {
    const visitorId = this.lastVisitorId;
    if (!visitorId) return;
    const addresses = Array.from(this.walletLinkPending);
    if (addresses.length === 0) return;
    this.walletLinkPending.clear();

    try {
      await fetch(`${this.endpoint}/v1/identify/wallet-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": this.apiKey },
        body: JSON.stringify({ visitorId, walletAddresses: addresses }),
        credentials: "include",
        keepalive: true,
      });
    } catch {
      // Best-effort. If it fails the addresses are still in the local Set
      // and will ride along on the next identify() call.
      for (const addr of addresses) this.walletLinkPending.add(addr);
    }
  }

  private async ensureClientHintsBootstrapped(): Promise<void> {
    if (typeof navigator === "undefined") return;

    const nav = navigator as Navigator & { userAgentData?: unknown };
    if (!nav.userAgentData) return;

    try {
      if (
        typeof sessionStorage !== "undefined" &&
        sessionStorage.getItem(CH_BOOTSTRAP_KEY) === "1"
      ) {
        return;
      }
    } catch {
      // Ignore storage failures and continue.
    }

    try {
      await fetch(`${this.endpoint}/v1/bootstrap`, {
        method: "GET",
        credentials: "include",
        keepalive: true,
      });
      try {
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.setItem(CH_BOOTSTRAP_KEY, "1");
        }
      } catch {
        // Ignore storage failures; the optimization is best-effort.
      }
    } catch {
      // Best-effort bootstrap only.
    }
  }

  async identify(options?: IdentifyOptions): Promise<IdentifyResponse> {
    await this.ensureClientHintsBootstrapped();

    if (this.cache) {
      const cached = this.readCache();
      if (cached) return { ...cached, cacheHit: true };
    }

    const signals = await collectAllSignals({ detectWallets: this.detectWallets });
    const payload: IdentifyPayload = {
      signals, timestamp: Date.now(),
      url: typeof location !== "undefined" ? location.href : "",
      referrer: typeof document !== "undefined" ? document.referrer : "",
    };

    const walletAddrs = getDiscoveredAddresses();
    if (walletAddrs.length > 0) {
      payload.walletAddresses = walletAddrs;
    }

    if (options?.tag !== undefined) payload.tag = options.tag;
    if (options?.linkedId !== undefined) payload.linkedId = options.linkedId;

    const effectiveTimeout = options?.timeout ?? this.timeout;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), effectiveTimeout);

    try {
      const response = await fetch(`${this.endpoint}/v1/identify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": this.apiKey },
        body: JSON.stringify(payload),
        signal: controller.signal,
        credentials: "include",
      });
      if (!response.ok) {
        const errorBody = await response.text().catch(() => "Unknown error");
        throw new Error(`FingerprintIQ API error (${response.status}): ${errorBody}`);
      }
      const result = (await response.json()) as IdentifyResponse;
      if (this.cache) this.writeCache(result);
      if (result?.visitorId) {
        this.lastVisitorId = result.visitorId;
        // Any addresses that arrived while we were waiting on identify()
        // get flushed immediately now that we have a visitorId.
        if (this.walletLinkPending.size > 0) {
          this.scheduleWalletLink();
        }
      }
      return result;
    } finally { clearTimeout(timeoutId); }
  }

  private getCacheKey(): string {
    return `__fiq_cache_${this.apiKey.slice(0, 8)}__`;
  }

  private readCache(): IdentifyResponse | null {
    if (!this.cache) return null;
    try {
      const storage = this.cache.storage === "localStorage" ? localStorage : sessionStorage;
      const raw = storage.getItem(this.getCacheKey());
      if (!raw) return null;
      const { data, expiresAt } = JSON.parse(raw) as { data: IdentifyResponse; expiresAt: number };
      if (Date.now() > expiresAt) {
        storage.removeItem(this.getCacheKey());
        return null;
      }
      return data;
    } catch {
      return null;
    }
  }

  private writeCache(data: IdentifyResponse): void {
    if (!this.cache) return;
    try {
      const ttl = (this.cache.ttl ?? 3600) * 1000;
      const storage = this.cache.storage === "localStorage" ? localStorage : sessionStorage;
      storage.setItem(this.getCacheKey(), JSON.stringify({ data, expiresAt: Date.now() + ttl }));
    } catch {}
  }
}

export type { FingerprintIQConfig, IdentifyOptions, CacheConfig, IdentifyResponse, Verdicts, IpLocation, SybilRisk, ClientSignals, CanvasSignal, WebGLSignal, WebGPUSignal, AudioSignal, FontSignal, WebRTCSignal, WasmTimingSignal, NavigatorSignal, MediaSignal, ScreenSignal, IntegritySignal, WalletSignal, StorageSignal, MathSignal, DOMRectSignal, HeadlessSignal, SpeechSignal, IntlSignal, TimezoneSignal, CssStyleSignal, ErrorSignal, WorkerScopeSignal, ResistanceSignal, SvgSignal, WindowFeaturesSignal, HtmlElementSignal, CodecSignal, StatusSignal, PlatformFeaturesSignal, UAClientHintsSignal, UAClientHintsBrand, CapabilityVectorSignal, GeometryVectorSignal, RuntimeVectorSignal, SensorCapabilitiesSignal, BehavioralRiskSignal } from "./types";
export { requestWalletConnection, getDiscoveredAddresses, onWalletAddress } from "./signals/wallet-connect";
