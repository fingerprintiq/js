import type { SignalResult, TimezoneSignal } from "../types";
import { sha256 } from "../hash";

export async function collectTimezone(): Promise<SignalResult<TimezoneSignal> | null> {
  const start = performance.now();
  try {
    // Reported timezone from Intl
    const reported = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Historical offset (July 2005 — chosen to capture DST historical behavior)
    const offsetHistorical = new Date(2005, 6, 1).getTimezoneOffset();

    // Compute timezone name via formatToParts
    let computed: string | null = null;
    try {
      const parts = Intl.DateTimeFormat(undefined, { timeZoneName: "long" }).formatToParts(new Date());
      const tzPart = parts.find((p) => p.type === "timeZoneName");
      computed = tzPart?.value ?? null;
    } catch { /* ignore */ }

    // Detect spoofing: compare implied hour from reported timezone vs actual offset
    let isSpoofed = false;
    try {
      const currentOffset = new Date().getTimezoneOffset();
      // Get the UTC offset implied by the reported timezone
      const testDate = new Date();
      const utcStr = testDate.toLocaleString("en-US", { timeZone: "UTC", hour12: false, hour: "numeric" });
      const localStr = testDate.toLocaleString("en-US", { timeZone: reported, hour12: false, hour: "numeric" });
      const utcHour = parseInt(utcStr, 10);
      const localHour = parseInt(localStr, 10);
      const impliedOffset = (utcHour - localHour) * 60;
      // Allow 60 min difference to account for half-hour/quarter-hour zones
      isSpoofed = Math.abs(impliedOffset - currentOffset) > 90;
    } catch { /* ignore */ }

    const hash = await sha256(`${reported}|${offsetHistorical}|${new Date().getTimezoneOffset()}`);

    return {
      value: {
        reported,
        computed,
        offsetHistorical,
        isSpoofed,
        hash,
      },
      duration: performance.now() - start,
    };
  } catch {
    return null;
  }
}
