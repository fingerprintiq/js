import type { SignalResult, WebRTCSignal } from "../types";
import { sha256 } from "../hash";

const LOCAL_IP_REGEX = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/;
const PRIVATE_IP_REGEX = /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/;
const CANDIDATE_TYPE_REGEX = /typ\s+(\w+)/;

export async function collectWebRTC(): Promise<SignalResult<WebRTCSignal> | null> {
  const start = performance.now();
  try {
    if (typeof RTCPeerConnection === "undefined") return null;

    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    pc.createDataChannel("");

    const candidates: string[] = [];
    const localIps: string[] = [];
    const candidateTypes: Set<string> = new Set();

    const gatheringComplete = new Promise<void>((resolve) => {
      const timeout = setTimeout(() => resolve(), 1200);
      pc.onicecandidate = (event) => {
        if (!event.candidate) { clearTimeout(timeout); resolve(); return; }
        const candidateStr = event.candidate.candidate;
        candidates.push(candidateStr);
        const typeMatch = candidateStr.match(CANDIDATE_TYPE_REGEX);
        if (typeMatch?.[1]) candidateTypes.add(typeMatch[1]);
        const ipMatch = candidateStr.match(LOCAL_IP_REGEX);
        if (ipMatch?.[1] && PRIVATE_IP_REGEX.test(ipMatch[1])) localIps.push(ipMatch[1]);
      };
    });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await gatheringComplete;
    pc.close();

    let localIpHash: string | null = null;
    if (localIps.length > 0) {
      const prefix = localIps[0]!.split(".").slice(0, 3).join(".");
      localIpHash = await sha256(prefix);
    }

    return {
      value: { localIpHash, candidateCount: candidates.length, candidateTypes: Array.from(candidateTypes), multipleNics: localIps.length > 1 },
      duration: performance.now() - start,
    };
  } catch { return null; }
}
