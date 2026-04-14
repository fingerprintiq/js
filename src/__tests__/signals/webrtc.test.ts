import { describe, it, expect, vi, beforeEach } from "vitest";
import { collectWebRTC } from "../../signals/webrtc";

describe("collectWebRTC", () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it("extracts local IP hash and candidate info", async () => {
    const mockPc = {
      createDataChannel: vi.fn(),
      createOffer: vi.fn().mockResolvedValue({ type: "offer", sdp: "mock" }),
      setLocalDescription: vi.fn().mockResolvedValue(undefined),
      onicecandidate: null as ((event: { candidate: { candidate: string } | null }) => void) | null,
      close: vi.fn(),
    };
    vi.stubGlobal("RTCPeerConnection", vi.fn().mockImplementation(() => {
      setTimeout(() => {
        if (mockPc.onicecandidate) {
          mockPc.onicecandidate({ candidate: { candidate: "candidate:1 1 udp 2122260223 192.168.1.100 54321 typ host" } });
          mockPc.onicecandidate({ candidate: { candidate: "candidate:2 1 udp 1686052607 203.0.113.5 12345 typ srflx" } });
          mockPc.onicecandidate({ candidate: null });
        }
      }, 10);
      return mockPc;
    }));

    const result = await collectWebRTC();
    expect(result).not.toBeNull();
    expect(result!.value.localIpHash).toMatch(/^[0-9a-f]{64}$/);
    expect(result!.value.candidateCount).toBe(2);
    expect(result!.value.candidateTypes).toContain("host");
    expect(result!.value.candidateTypes).toContain("srflx");
  });

  it("returns null when RTCPeerConnection is unavailable", async () => {
    vi.stubGlobal("RTCPeerConnection", undefined);
    const result = await collectWebRTC();
    expect(result).toBeNull();
  });
});
