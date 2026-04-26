/** Configuration for the FingerprintIQ SDK */
export interface FingerprintIQConfig {
  apiKey: string;
  endpoint?: string;
  timeout?: number;
  detectWallets?: boolean;
  cache?: CacheConfig | false;
}

export interface IdentifyOptions {
  tag?: unknown;
  linkedId?: string;
  timeout?: number;
}

export interface CacheConfig {
  storage: "sessionStorage" | "localStorage";
  ttl?: number;
}

export interface SignalResult<T = unknown> {
  value: T;
  duration: number;
}

export interface CanvasSignal {
  hash: string;
  isFarbled: boolean;
}

export interface WebGLSignal {
  renderer: string;
  vendor: string;
  extensions: string[];
  params: Record<string, number>;
  gpuTimingMs: number | null;
  isSoftwareRenderer: boolean;
}

export interface WebGPUSignal {
  available: boolean;
  vendor: string;
  architecture: string;
  device: string;
  description: string;
  features: string[];
}

export interface AudioSignal {
  hash: string;
  sampleRate: number;
  maxChannelCount: number;
  isSuspended: boolean;
}

export interface FontSignal {
  detected: string[];
  count: number;
  isSpoofed: boolean;
}

export interface WebRTCSignal {
  localIpHash: string | null;
  candidateCount: number;
  candidateTypes: string[];
  multipleNics: boolean;
}

export interface WasmTimingSignal {
  medianMs: number;
  stddevMs: number;
}

export interface NavigatorSignal {
  hardwareConcurrency: number;
  deviceMemory: number | null;
  maxTouchPoints: number;
  languages: string[];
  platform: string;
  cookieEnabled: boolean;
  doNotTrack: string | null;
  keyboardLayout: string | null;
  connectionType: string | null;
  hasBluetooth: boolean;
  hasUsb: boolean;
  hasHid: boolean;
  hasSerial: boolean;
  hasWakeLock: boolean;
  hasGpu: boolean;
  bluetoothAvailable: boolean | null;
}

export interface MediaSignal {
  colorScheme: string;
  contrast: string;
  forcedColors: boolean;
  pointer: string;
  hover: string;
  displayMode: string;
  reducedMotion: boolean;
  colorGamut: string;
}

export interface ScreenSignal {
  width: number;
  height: number;
  availWidth: number;
  availHeight: number;
  colorDepth: number;
  pixelRatio: number;
  isFirefoxRfp: boolean;
}

export interface IntegritySignal {
  tamperedApis: string[];
  workerMismatch: boolean;
  lieScore: number;
}

export interface WalletSignal {
  detected: string[];
  count: number;
  evmProviders: string[];
  solanaProviders: string[];
  multipleWallets: boolean;
  versions: Record<string, string>;
}

export interface StorageSignal {
  localStorage: boolean;
  sessionStorage: boolean;
  indexedDb: boolean;
  cookie: boolean;
  survivingMechanisms: string[];
}

export interface MathSignal {
  values: number[];
  hash: string;
}

export interface DOMRectSignal {
  hash: string;
  emojiHash: string;
  rectCount: number;
}

export interface HeadlessSignal {
  isHeadless: boolean;
  markers: string[];
}

export interface SpeechSignal {
  voiceCount: number;
  localVoices: string[];
  remoteVoiceCount: number;
  defaultVoice: string | null;
  hash: string;
}

export interface IntlSignal {
  locales: string[];
  formattedNumber: string;
  formattedRelativeTime: string;
  formattedList: string;
  localeSpoofed: boolean;
  hash: string;
}

export interface TimezoneSignal {
  reported: string;
  computed: string | null;
  offsetHistorical: number;
  isSpoofed: boolean;
  hash: string;
}

export interface CssStyleSignal {
  propertyCount: number;
  systemColorHash: string;
  systemFontHash: string;
  hash: string;
}

export interface CssFeatureSignal {
  features: Record<string, boolean>;
  supportedCount: number;
  hash: string;
}

export interface ErrorSignal {
  messages: string[];
  hash: string;
}

export interface WorkerScopeSignal {
  workerNavigator: {
    hardwareConcurrency: number;
    platform: string;
    languages: string[];
    userAgent: string;
  } | null;
  workerWebGL: { renderer: string; vendor: string } | null;
  mismatches: string[];
}

export interface ResistanceSignal {
  browser: string | null;
  extensions: string[];
  timerPrecisionMs: number;
}

export interface SvgSignal {
  hash: string;
  textLengths: number[];
}

export interface WindowFeaturesSignal {
  propertyCount: number;
  webkitCount: number;
  mozCount: number;
  litterKeys: string[];
  hash: string;
}

export interface HtmlElementSignal {
  propertyCount: number;
  hash: string;
}

export interface CodecSignal {
  matrix: Record<string, { canPlay: string; mediaSource: boolean; mediaRecorder: boolean }>;
  hash: string;
}

export interface StatusSignal {
  timingResolution: number;
  maxStackSize: number;
  storageQuotaMB: number | null;
  battery: { charging: boolean; level: number } | null;
  heapLimit: number | null;
}

export interface PlatformFeaturesSignal {
  features: Record<string, boolean>;
  estimatedPlatform: string;
  hash: string;
}

export interface UAClientHintsBrand {
  brand: string;
  version: string;
}

export interface UAClientHintsSignal {
  available: boolean;
  mobile: boolean | null;
  platform: string | null;
  architecture: string | null;
  bitness: string | null;
  model: string | null;
  platformVersion: string | null;
  wow64: boolean | null;
  formFactors: string[];
  brands: UAClientHintsBrand[];
  fullVersionList: UAClientHintsBrand[];
  hash: string | null;
}

export interface CapabilityVectorSignal {
  pdfViewerEnabled: boolean | null;
  globalPrivacyControl: boolean | null;
  hasPdfPlugin: boolean;
  pluginCount: number | null;
  hasWebGPU: boolean;
  hasVirtualKeyboard: boolean;
  hasSpeechSynthesis: boolean;
  hasSpeechRecognition: boolean;
  hasMediaCapabilities: boolean;
  hasKeyboardLayoutApi: boolean;
  hasBluetooth: boolean;
  hasUsb: boolean;
  hasHid: boolean;
  hasSerial: boolean;
  hasHighEntropyUaHints: boolean;
  suspiciousFlags: string[];
  hash: string;
}

export interface GeometryVectorSignal {
  screen: {
    width: number;
    height: number;
    availWidth: number;
    availHeight: number;
  };
  window: {
    innerWidth: number;
    innerHeight: number;
    outerWidth: number;
    outerHeight: number;
    devicePixelRatio: number;
  };
  visualViewport: {
    width: number;
    height: number;
    scale: number;
    offsetLeft: number;
    offsetTop: number;
  } | null;
  orientation: {
    type: string | null;
    angle: number | null;
  };
  chromeInsetX: number | null;
  chromeInsetY: number | null;
  suspiciousFlags: string[];
  hash: string;
}

export interface RuntimeVectorSignal {
  hardwareConcurrency: number;
  deviceMemory: number | null;
  timingResolutionMs: number | null;
  maxStackSize: number | null;
  storageQuotaMB: number | null;
  jsHeapUsedMB: number | null;
  jsHeapTotalMB: number | null;
  jsHeapLimitMB: number | null;
  networkRttMs: number | null;
  downlinkMbps: number | null;
  saveData: boolean | null;
  suspiciousFlags: string[];
  hash: string;
}

export interface SensorCapabilitiesSignal {
  apis: Record<string, boolean>;
  permissionStates: Record<string, string | null>;
  policyBlocked: string[];
  availableCount: number;
  hash: string;
}

export interface BehavioralRiskSignal {
  elapsedMs: number;
  totalEventCount: number;
  pointerMoveCount: number;
  pointerDistancePx: number;
  pointerDirectionChanges: number;
  pointerStraightness: number | null;
  clickCount: number;
  scrollEventCount: number;
  scrollBurstCount: number;
  keyEventCount: number;
  inputEventCount: number;
  focusTransitions: number;
  blurTransitions: number;
  visibilityTransitions: number;
  meanPointerIntervalMs: number | null;
  meanKeyIntervalMs: number | null;
  classification: "insufficient_data" | "low_interaction" | "human_like" | "synthetic_like";
  riskScore: number;
  reasons: string[];
  hash: string;
}

export interface IncognitoSignal {
  isPrivate: boolean;
  method: string | null;
}

export interface DevToolsSignal {
  isOpen: boolean;
  indicators: string[];
}

export interface VirtualizationSignal {
  vmDetected: boolean;
  emulatorDetected: boolean;
  indicators: string[];
  confidence: "low" | "medium" | "high";
}

export interface RootedSignal {
  detected: boolean;
  confidence: "low" | "medium";
  indicators: string[];
}

export interface FrameDepthSignal {
  isFramed: boolean;
  depth: number;
  topAccessible: boolean;
  crossOriginBoundary: boolean;
  hash: string;
}

export interface ClientSignals {
  canvas: SignalResult<CanvasSignal> | null;
  webgl: SignalResult<WebGLSignal> | null;
  webgpu: SignalResult<WebGPUSignal> | null;
  audio: SignalResult<AudioSignal> | null;
  fonts: SignalResult<FontSignal> | null;
  webrtc: SignalResult<WebRTCSignal> | null;
  wasmTiming: SignalResult<WasmTimingSignal> | null;
  navigator: SignalResult<NavigatorSignal> | null;
  media: SignalResult<MediaSignal> | null;
  screen: SignalResult<ScreenSignal> | null;
  integrity: SignalResult<IntegritySignal> | null;
  wallets: SignalResult<WalletSignal> | null;
  storage: SignalResult<StorageSignal> | null;
  math: SignalResult<MathSignal> | null;
  domRect: SignalResult<DOMRectSignal> | null;
  headless: SignalResult<HeadlessSignal> | null;
  speech: SignalResult<SpeechSignal> | null;
  intl: SignalResult<IntlSignal> | null;
  timezone: SignalResult<TimezoneSignal> | null;
  cssStyle: SignalResult<CssStyleSignal> | null;
  cssFeatures: SignalResult<CssFeatureSignal> | null;
  error: SignalResult<ErrorSignal> | null;
  workerScope: SignalResult<WorkerScopeSignal> | null;
  resistance: SignalResult<ResistanceSignal> | null;
  svg: SignalResult<SvgSignal> | null;
  windowFeatures: SignalResult<WindowFeaturesSignal> | null;
  htmlElement: SignalResult<HtmlElementSignal> | null;
  codec: SignalResult<CodecSignal> | null;
  status: SignalResult<StatusSignal> | null;
  platformFeatures: SignalResult<PlatformFeaturesSignal> | null;
  uaClientHints: SignalResult<UAClientHintsSignal> | null;
  capabilityVector: SignalResult<CapabilityVectorSignal> | null;
  geometryVector: SignalResult<GeometryVectorSignal> | null;
  runtimeVector: SignalResult<RuntimeVectorSignal> | null;
  sensorCapabilities: SignalResult<SensorCapabilitiesSignal> | null;
  behavioralRisk: SignalResult<BehavioralRiskSignal> | null;
  incognito: SignalResult<IncognitoSignal> | null;
  devTools: SignalResult<DevToolsSignal> | null;
  virtualization: SignalResult<VirtualizationSignal> | null;
  rooted: SignalResult<RootedSignal> | null;
  frameDepth: SignalResult<FrameDepthSignal> | null;
}

export interface Verdicts {
  bot: { result: boolean; probability: number };
  vpn: { result: boolean; confidence: number };
  tor: { result: boolean };
  proxy: { result: boolean };
  incognito: { result: boolean };
  tampering: { result: boolean; anomalyScore: number };
  headless: { result: boolean };
  virtualMachine: { result: boolean };
  devtools: { result: boolean };
  privacyBrowser: { result: boolean; name: string | null };
  highActivity: { result: boolean };
  ipBlocklist: { result: boolean };
  velocity?: {
    distinctIp: { "5m": number; "1h": number; "24h": number };
    distinctCountry: { "5m": number; "1h": number; "24h": number };
    events: { "5m": number; "1h": number; "24h": number };
  };
}

export interface IpLocation {
  country: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
}

export interface SybilRisk {
  score: number;
  level: string;
  reasons: string[];
}

export interface IdentifyResponse {
  requestId: string;
  visitorId: string;
  confidence: number;
  botProbability: number;
  suspectScore: number;
  visitCount: number;
  firstSeenAt: number;
  lastSeenAt: number | null;
  riskFactors: string[];
  verdicts: Verdicts;
  ip: string;
  ipLocation: IpLocation;
  sybilRisk?: SybilRisk;
  web3?: {
    walletsDetected: string[];
    connectedWallets: unknown[];
    sybilAnalysis: unknown;
  };
  timestamp: number;
  cacheHit?: boolean;
  /** Base64-encoded AES-256-GCM encrypted payload containing full event data. Only present when a sealed key is active. Decrypt server-side with @fingerprintiq/server. */
  sealedResult?: string;
}

export interface IdentifyPayload {
  signals: ClientSignals;
  timestamp: number;
  url: string;
  referrer: string;
  walletAddresses?: string[];
  tag?: unknown;
  linkedId?: string;
}

export interface WalletConnection {
  address: string;
  chain: "evm" | "solana";
  provider: string;
  method: "pre-connected" | "listener" | "manual";
}
