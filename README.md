# @fingerprintiq/js

[![npm](https://img.shields.io/npm/v/@fingerprintiq/js.svg)](https://www.npmjs.com/package/@fingerprintiq/js)
[![npm downloads](https://img.shields.io/npm/dm/@fingerprintiq/js.svg)](https://www.npmjs.com/package/@fingerprintiq/js)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@fingerprintiq/js)](https://bundlephobia.com/package/@fingerprintiq/js)
[![license](https://img.shields.io/npm/l/@fingerprintiq/js.svg)](./LICENSE)

Browser fingerprinting SDK with 99%+ accuracy. 41 client signals fused with server-side TLS/JA4 analysis.

- **Docs**: [docs.fingerprintiq.com](https://docs.fingerprintiq.com)
- **SDK reference**: [docs.fingerprintiq.com/sdk/javascript](https://docs.fingerprintiq.com/sdk/javascript)
- **npm**: [npmjs.com/package/@fingerprintiq/js](https://www.npmjs.com/package/@fingerprintiq/js)
- **Issues**: [github.com/fingerprintiq/js/issues](https://github.com/fingerprintiq/js/issues)

## Install

```bash
npm install @fingerprintiq/js
# or
pnpm add @fingerprintiq/js
# or
yarn add @fingerprintiq/js
```

## Quick Start

```typescript
import FingerprintIQ from '@fingerprintiq/js';

const fiq = new FingerprintIQ({ apiKey: 'fiq_live_...' });
const result = await fiq.identify();

console.log(result.visitorId);      // "iq_01abc..."
console.log(result.confidence);     // 0.97
console.log(result.botProbability); // 0.03
```

Grab an API key from the [FingerprintIQ dashboard](https://fingerprintiq.com/dashboard) — free tier includes 10,000 identifications/month.

## Framework Integrations

### React

```tsx
import { useFingerprintIQ } from '@fingerprintiq/js/react';

function Component() {
  const { result, loading, error } = useFingerprintIQ({ apiKey: 'fiq_live_...' });

  if (loading) return <p>Identifying…</p>;
  if (error) return <p>Error: {error.message}</p>;
  return <p>Visitor: {result?.visitorId}</p>;
}
```

### Next.js (App Router)

```tsx
'use client';
import { useFingerprintIQ } from '@fingerprintiq/js/next';

export function VisitorGate() {
  const { result } = useFingerprintIQ({ apiKey: 'fiq_live_...' });
  return <p>Visitor: {result?.visitorId}</p>;
}
```

### Vue 3

```vue
<script setup lang="ts">
import { useFingerprintIQ } from '@fingerprintiq/js/vue';

const { result, loading, error } = useFingerprintIQ({ apiKey: 'fiq_live_...' });
</script>

<template>
  <p v-if="loading">Identifying…</p>
  <p v-else-if="error">Error: {{ error.message }}</p>
  <p v-else>Visitor: {{ result?.visitorId }}</p>
</template>
```

Each subpath auto-calls `identify()` on mount. Pass `manual: true` to skip and call `identify()` yourself when ready.

## Signals Collected

- Canvas 2D, WebGL, WebGPU
- AudioContext timing
- Font enumeration (650+ fonts)
- WASM CPU microarchitecture
- Navigator deep mining
- CSS media queries
- Screen & display
- Prototype lie detection
- Wallet extension detection (MetaMask, Phantom, etc.) — passive, never triggers popups
- Storage persistence
- WebRTC LAN IP
- And more...

Server-side signals (JA4 TLS, HTTP/2 settings, ASN classification, RTT coherence) are fused automatically at the edge.

## Configuration

```typescript
const fiq = new FingerprintIQ({
  apiKey: 'fiq_live_...',     // Required
  endpoint: 'https://...',    // Custom endpoint (default: fingerprintiq.com)
  timeout: 5000,              // API timeout in ms (default: 5000)
  detectWallets: true,        // Detect crypto wallets (default: true)
});
```

Signal collectors are individually time-boxed so one slow browser API cannot hold up the full `identify()` call. User-Agent Client Hints bootstrap runs in the background and is reused on later calls.

## Response

```typescript
interface IdentifyResponse {
  visitorId: string;
  confidence: number;        // 0.0 - 1.0
  botProbability: number;    // 0.0 - 1.0
  visitCount: number;
  signals: {
    client: { ... };
    server: { ... };
  };
}
```

## Sibling Packages

| Package | Purpose |
|---------|---------|
| [`@fingerprintiq/js`](https://www.npmjs.com/package/@fingerprintiq/js) | Browser fingerprinting (this package) |
| [`@fingerprintiq/server`](https://www.npmjs.com/package/@fingerprintiq/server) | Server-side caller classification (Hono, Express) |
| [`@fingerprintiq/pulse`](https://www.npmjs.com/package/@fingerprintiq/pulse) | CLI usage analytics and machine fingerprinting |
| [`fingerprintiq`](https://pypi.org/project/fingerprintiq/) (PyPI) | Python SDK — Identify, Sentinel, Pulse |

## Contributing

This repo is a **read-only public mirror**. The master copy lives in the private FingerprintIQ monorepo and is synced here on every push to `main`. Please [file issues](https://github.com/fingerprintiq/js/issues) rather than PRs.

## License

MIT
