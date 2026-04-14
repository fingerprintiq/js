import type { WalletConnection } from "../types";

const discoveredAddresses = new Set<string>();
const connections: WalletConnection[] = [];
let listening = false;

function normalizeAddress(addr: string): string {
  return addr.toLowerCase();
}

function addConnection(address: string, chain: "evm" | "solana", provider: string, method: WalletConnection["method"]) {
  const norm = normalizeAddress(address);
  if (discoveredAddresses.has(norm)) return;
  discoveredAddresses.add(norm);
  connections.push({ address: norm, chain, provider, method });
}

/**
 * Check for already-connected wallets using passive property checks only.
 * We NEVER call ethereum.request() or any RPC method here — that can
 * trigger wallet extension popups. We only read properties that are
 * already exposed on the provider object.
 */
function checkPreConnected() {
  const g = globalThis as Record<string, unknown>;

  // Solana wallets expose .publicKey when already connected
  const solana = g["solana"] as { publicKey?: { toBase58?: () => string }; isConnected?: boolean } | undefined;
  if (solana?.isConnected && solana?.publicKey?.toBase58) {
    try {
      const addr = solana.publicKey.toBase58();
      if (addr) addConnection(addr, "solana", "solana", "pre-connected");
    } catch { /* silent */ }
  }

  const phantom = g["phantom"] as { solana?: typeof solana } | undefined;
  if (phantom?.solana?.isConnected && phantom?.solana?.publicKey?.toBase58) {
    try {
      const addr = phantom.solana.publicKey.toBase58();
      if (addr) addConnection(addr, "solana", "Phantom", "pre-connected");
    } catch { /* silent */ }
  }

  // EVM: check if ethereum.selectedAddress is already set (no RPC needed)
  const ethereum = g["ethereum"] as { selectedAddress?: string | null } | undefined;
  if (ethereum?.selectedAddress && typeof ethereum.selectedAddress === "string" && ethereum.selectedAddress.startsWith("0x")) {
    addConnection(ethereum.selectedAddress, "evm", "ethereum", "pre-connected");
  }
}

/**
 * Attach passive event listeners for wallet connections.
 * We listen for accountsChanged events (fired by the extension itself
 * when the user connects via the extension UI or a dapp connector).
 * We NEVER initiate RPC calls.
 */
function attachListeners() {
  if (listening) return;
  listening = true;
  const g = globalThis as Record<string, unknown>;

  const ethereum = g["ethereum"] as { on?: (event: string, cb: (accounts: string[]) => void) => void } | undefined;
  if (ethereum?.on) {
    ethereum.on("accountsChanged", (accounts: string[]) => {
      for (const addr of accounts) {
        if (typeof addr === "string" && addr.startsWith("0x")) {
          addConnection(addr, "evm", "ethereum", "listener");
        }
      }
    });
  }

  // Listen for EIP-6963 provider announcements — passive only, no RPC calls
  if (typeof window !== "undefined") {
    window.addEventListener("eip6963:announceProvider", (event: Event) => {
      const e = event as Event & { detail?: { info?: { name?: string }; provider?: { on?: (event: string, cb: (accounts: string[]) => void) => void } } };
      const provider = e.detail?.provider;
      const name = e.detail?.info?.name ?? "unknown";

      // Only attach event listeners — never call request() methods
      if (provider?.on) {
        provider.on("accountsChanged", (accounts: string[]) => {
          for (const addr of accounts) {
            if (typeof addr === "string" && addr.startsWith("0x")) {
              addConnection(addr, "evm", name, "listener");
            }
          }
        });
      }
    });
  }

  const solana = g["solana"] as { on?: (event: string, cb: () => void) => void; publicKey?: { toBase58?: () => string } } | undefined;
  if (solana?.on) {
    solana.on("connect", () => {
      if (solana?.publicKey?.toBase58) {
        try {
          const addr = solana.publicKey.toBase58();
          if (addr) addConnection(addr, "solana", "solana", "listener");
        } catch { /* silent */ }
      }
    });
  }
}

export function initWalletListener() {
  if (typeof window === "undefined") return;
  checkPreConnected();
  attachListeners();
}

export function getDiscoveredAddresses(): string[] {
  return Array.from(discoveredAddresses);
}

export function getWalletConnections(): WalletConnection[] {
  return [...connections];
}

/**
 * Explicitly request a wallet connection. This is the ONLY function
 * that calls RPC methods (eth_requestAccounts, solana.connect, etc.)
 * and should only be called in response to a user action.
 */
export async function requestWalletConnection(wallet?: string): Promise<string | null> {
  const g = globalThis as Record<string, unknown>;
  const target = wallet?.toLowerCase();

  // Solana wallets
  if (target === "phantom") {
    const phantom = g["phantom"] as { solana?: { connect: () => Promise<{ publicKey: { toBase58: () => string } }> } } | undefined;
    if (!phantom?.solana?.connect) return null;
    try {
      const resp = await phantom.solana.connect();
      const addr = resp.publicKey.toBase58();
      if (addr) { addConnection(addr, "solana", "Phantom", "manual"); return normalizeAddress(addr); }
    } catch { /* user rejected */ }
    return null;
  }

  if (target === "solflare") {
    const solflare = g["solflare"] as { connect: () => Promise<void>; publicKey?: { toBase58: () => string } } | undefined;
    if (!solflare?.connect) return null;
    try {
      await solflare.connect();
      const addr = solflare.publicKey?.toBase58();
      if (addr) { addConnection(addr, "solana", "Solflare", "manual"); return normalizeAddress(addr); }
    } catch { /* user rejected */ }
    return null;
  }

  // Aptos wallets
  if (target === "martian") {
    const martian = g["martian"] as { connect: () => Promise<{ address: string }> } | undefined;
    if (!martian?.connect) return null;
    try {
      const resp = await martian.connect();
      if (resp.address) { addConnection(resp.address, "solana", "Martian", "manual"); return normalizeAddress(resp.address); }
    } catch { /* user rejected */ }
    return null;
  }

  if (target === "petra") {
    const petra = g["petra"] as { connect: () => Promise<{ address: string }> } | undefined;
    if (!petra?.connect) return null;
    try {
      const resp = await petra.connect();
      if (resp.address) { addConnection(resp.address, "solana", "Petra", "manual"); return normalizeAddress(resp.address); }
    } catch { /* user rejected */ }
    return null;
  }

  // EVM wallets (default)
  const ethereum = g["ethereum"] as { request?: (args: { method: string }) => Promise<string[]> } | undefined;
  if (!ethereum?.request) return null;
  try {
    const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    if (Array.isArray(accounts) && accounts[0]) {
      addConnection(accounts[0], "evm", "ethereum", "manual");
      return normalizeAddress(accounts[0]);
    }
  } catch { /* user rejected */ }
  return null;
}
