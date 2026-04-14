import { describe, it, expect, beforeEach } from "vitest";
import { collectWallets } from "../../signals/wallets";

function cleanWindowProps() {
  const g = globalThis as Record<string, unknown>;
  delete g["ethereum"];
  delete g["coinbaseWalletExtension"];
  delete g["okxwallet"];
  delete g["xfi"];
  delete g["solana"];
  delete g["phantom"];
  delete g["keplr"];
  delete g["unisat"];
}

describe("collectWallets", () => {
  beforeEach(() => {
    cleanWindowProps();
  });

  it("returns empty result when no wallets are present", async () => {
    const result = await collectWallets();
    expect(result).not.toBeNull();
    expect(result.value.detected).toEqual([]);
    expect(result.value.count).toBe(0);
    expect(result.value.evmProviders).toEqual([]);
    expect(result.value.solanaProviders).toEqual([]);
    expect(result.value.multipleWallets).toBe(false);
    expect(result.value.versions).toEqual({});
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it("detects MetaMask via window.ethereum.isMetaMask", async () => {
    (globalThis as Record<string, unknown>)["ethereum"] = {
      isMetaMask: true,
    };

    const result = await collectWallets();
    expect(result.value.detected).toContain("MetaMask");
    expect(result.value.evmProviders).toContain("MetaMask");
    expect(result.value.solanaProviders).not.toContain("MetaMask");
    expect(result.value.count).toBeGreaterThanOrEqual(1);
  });

  it("detects Phantom via window.solana.isPhantom", async () => {
    (globalThis as Record<string, unknown>)["solana"] = {
      isPhantom: true,
    };

    const result = await collectWallets();
    expect(result.value.detected).toContain("Phantom");
    expect(result.value.solanaProviders).toContain("Phantom");
    expect(result.value.evmProviders).not.toContain("Phantom");
    expect(result.value.count).toBeGreaterThanOrEqual(1);
  });

  it("detects Phantom via window.phantom.solana", async () => {
    (globalThis as Record<string, unknown>)["phantom"] = {
      solana: { isPhantom: true },
    };

    const result = await collectWallets();
    expect(result.value.detected).toContain("Phantom");
    expect(result.value.solanaProviders).toContain("Phantom");
  });

  it("sets multipleWallets=true when multiple wallets are detected", async () => {
    (globalThis as Record<string, unknown>)["ethereum"] = {
      isMetaMask: true,
    };
    (globalThis as Record<string, unknown>)["solana"] = {
      isPhantom: true,
    };

    const result = await collectWallets();
    expect(result.value.multipleWallets).toBe(true);
    expect(result.value.detected.length).toBeGreaterThanOrEqual(2);
    expect(result.value.detected).toContain("MetaMask");
    expect(result.value.detected).toContain("Phantom");
  });

  it("detects Coinbase Wallet via window.ethereum.isCoinbaseWallet", async () => {
    (globalThis as Record<string, unknown>)["ethereum"] = {
      isCoinbaseWallet: true,
    };

    const result = await collectWallets();
    expect(result.value.detected).toContain("Coinbase Wallet");
    expect(result.value.evmProviders).toContain("Coinbase Wallet");
  });

  it("detects OKX Wallet via window.okxwallet", async () => {
    (globalThis as Record<string, unknown>)["okxwallet"] = { request: () => {} };

    const result = await collectWallets();
    expect(result.value.detected).toContain("OKX Wallet");
    expect(result.value.evmProviders).toContain("OKX Wallet");
  });

  it("detects Keplr via window.keplr", async () => {
    (globalThis as Record<string, unknown>)["keplr"] = { enable: () => {} };

    const result = await collectWallets();
    expect(result.value.detected).toContain("Keplr");
    expect(result.value.evmProviders).toContain("Keplr");
  });

  // Intentionally no version-detection test: wallet detection is passive only
  // (property checks), never calling ethereum.request() which would trigger a
  // wallet popup. `versions` is always `{}` for this reason.

  it("count matches the number of detected wallets", async () => {
    (globalThis as Record<string, unknown>)["ethereum"] = {
      isMetaMask: true,
    };
    (globalThis as Record<string, unknown>)["solana"] = {
      isPhantom: true,
    };
    (globalThis as Record<string, unknown>)["keplr"] = { enable: () => {} };

    const result = await collectWallets();
    expect(result.value.count).toBe(result.value.detected.length);
    expect(result.value.count).toBeGreaterThanOrEqual(3);
  });
});
