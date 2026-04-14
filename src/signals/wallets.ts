import type { SignalResult, WalletSignal } from "../types";

interface EIP6963ProviderInfo {
  rdns: string;
  name: string;
  icon?: string;
}

interface EIP6963AnnounceProviderEvent extends Event {
  detail: {
    info: EIP6963ProviderInfo;
    provider: unknown;
  };
}

function classifyWallet(name: string): "evm" | "solana" | "both" {
  const lower = name.toLowerCase();
  if (lower.includes("phantom") || lower.includes("solflare") || lower.includes("backpack") || lower.includes("solana")) {
    return "solana";
  }
  if (lower.includes("keplr")) {
    return "evm"; // Keplr is cosmos but treat as non-solana
  }
  return "evm";
}

/**
 * Discover wallet providers via EIP-6963.
 * This dispatches the standard requestProvider event. Wallet extensions
 * respond with provider info — no connection dialog is triggered.
 * We do NOT call any RPC methods on discovered providers.
 */
async function discoverEIP6963Providers(): Promise<string[]> {
  if (typeof window === "undefined" || typeof window.dispatchEvent === "undefined") {
    return [];
  }

  return new Promise<string[]>((resolve) => {
    const discovered: string[] = [];

    const handler = (event: Event) => {
      const e = event as EIP6963AnnounceProviderEvent;
      if (e.detail?.info?.name) {
        discovered.push(e.detail.info.name);
      }
    };

    window.addEventListener("eip6963:announceProvider", handler);
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    setTimeout(() => {
      window.removeEventListener("eip6963:announceProvider", handler);
      resolve(discovered);
    }, 50);
  });
}

export async function collectWallets(): Promise<SignalResult<WalletSignal>> {
  const start = performance.now();

  const detected: string[] = [];
  const evmProviders: string[] = [];
  const solanaProviders: string[] = [];

  try {
    // Step 1: EIP-6963 provider discovery (passive — no RPC calls)
    const eip6963Names = await discoverEIP6963Providers();
    for (const name of eip6963Names) {
      if (!detected.includes(name)) {
        detected.push(name);
        const type = classifyWallet(name);
        if (type === "solana") {
          if (!solanaProviders.includes(name)) solanaProviders.push(name);
        } else {
          if (!evmProviders.includes(name)) evmProviders.push(name);
        }
      }
    }

    // Step 2: Legacy window object detection (property checks only — no RPC calls)
    const g = globalThis as Record<string, unknown>;

    // window.ethereum — detect by property flags only
    const ethereum = g["ethereum"] as Record<string, unknown> | undefined;
    if (ethereum && typeof ethereum === "object") {
      if (ethereum["isMetaMask"] && !detected.includes("MetaMask")) {
        detected.push("MetaMask");
        evmProviders.push("MetaMask");
      }
      if (ethereum["isCoinbaseWallet"] && !detected.includes("Coinbase Wallet")) {
        detected.push("Coinbase Wallet");
        evmProviders.push("Coinbase Wallet");
      }
      if (ethereum["isRainbow"] && !detected.includes("Rainbow")) {
        detected.push("Rainbow");
        evmProviders.push("Rainbow");
      }
      if (ethereum["isBraveWallet"] && !detected.includes("Brave Wallet")) {
        detected.push("Brave Wallet");
        evmProviders.push("Brave Wallet");
      }
    }

    // window.coinbaseWalletExtension
    if (g["coinbaseWalletExtension"] && !detected.includes("Coinbase Wallet")) {
      detected.push("Coinbase Wallet");
      evmProviders.push("Coinbase Wallet");
    }

    // window.okxwallet
    if (g["okxwallet"] && !detected.includes("OKX Wallet")) {
      detected.push("OKX Wallet");
      evmProviders.push("OKX Wallet");
    }

    // window.xfi (XDEFI)
    if (g["xfi"] && !detected.includes("XDEFI")) {
      detected.push("XDEFI");
      evmProviders.push("XDEFI");
    }

    // window.solana
    const solana = g["solana"] as Record<string, unknown> | undefined;
    if (solana && typeof solana === "object") {
      if (solana["isPhantom"] && !detected.includes("Phantom")) {
        detected.push("Phantom");
        solanaProviders.push("Phantom");
      }
      if (solana["isSolflare"] && !detected.includes("Solflare")) {
        detected.push("Solflare");
        solanaProviders.push("Solflare");
      }
      if (solana["isBackpack"] && !detected.includes("Backpack")) {
        detected.push("Backpack");
        solanaProviders.push("Backpack");
      }
    }

    // window.phantom.solana
    const phantom = g["phantom"] as Record<string, unknown> | undefined;
    if (phantom && typeof phantom === "object") {
      const phantomSolana = phantom["solana"] as Record<string, unknown> | undefined;
      if (phantomSolana && typeof phantomSolana === "object" && !detected.includes("Phantom")) {
        detected.push("Phantom");
        solanaProviders.push("Phantom");
      }
    }

    // window.keplr
    if (g["keplr"] && !detected.includes("Keplr")) {
      detected.push("Keplr");
      evmProviders.push("Keplr");
    }

    // window.unisat
    if (g["unisat"] && !detected.includes("UniSat")) {
      detected.push("UniSat");
      evmProviders.push("UniSat");
    }
  } catch {
    // always succeed
  }

  return {
    value: {
      detected,
      count: detected.length,
      evmProviders,
      solanaProviders,
      multipleWallets: detected.length > 1,
      versions: {},
    },
    duration: performance.now() - start,
  };
}
