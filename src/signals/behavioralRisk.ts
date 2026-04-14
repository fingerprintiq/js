import type { BehavioralRiskSignal, SignalResult } from "../types";
import { sha256 } from "../hash";
import {
  collectBehaviorSnapshot,
  primeBehaviorTracking,
} from "./behaviorTracker";

export async function collectBehavioralRisk(): Promise<
  SignalResult<BehavioralRiskSignal> | null
> {
  const start = performance.now();

  try {
    primeBehaviorTracking();
    const snapshot = collectBehaviorSnapshot();
    if (!snapshot) return null;

    const totalEventCount =
      snapshot.pointerMoveCount +
      snapshot.clickCount +
      snapshot.scrollEventCount +
      snapshot.keyEventCount +
      snapshot.inputEventCount;
    const reasons: string[] = [];
    let riskScore = 0;
    let classification: BehavioralRiskSignal["classification"] =
      "insufficient_data";

    if (snapshot.elapsedMs >= 750 && totalEventCount >= 2) {
      classification = totalEventCount < 4 ? "low_interaction" : "human_like";

      if (
        snapshot.pointerMoveCount >= 8 &&
        snapshot.pointerStraightness !== null &&
        snapshot.pointerStraightness > 0.985 &&
        snapshot.pointerDirectionChanges <= 1
      ) {
        reasons.push("low_pointer_curvature");
        riskScore += 0.24;
      }

      if (snapshot.scrollEventCount >= 8 && snapshot.scrollBurstCount >= 3) {
        reasons.push("scroll_burst");
        riskScore += 0.16;
      }

      if (
        snapshot.keyEventCount >= 4 &&
        snapshot.meanKeyIntervalMs !== null &&
        snapshot.meanKeyIntervalMs < 25
      ) {
        reasons.push("unusually_fast_typing");
        riskScore += 0.22;
      }

      if (
        snapshot.focusTransitions + snapshot.blurTransitions >= 4 &&
        snapshot.elapsedMs < 2500
      ) {
        reasons.push("rapid_focus_switches");
        riskScore += 0.12;
      }

      if (riskScore >= 0.45 && totalEventCount >= 5) {
        classification = "synthetic_like";
      }
    }

    const value: BehavioralRiskSignal = {
      elapsedMs: snapshot.elapsedMs,
      totalEventCount,
      pointerMoveCount: snapshot.pointerMoveCount,
      pointerDistancePx: snapshot.pointerDistancePx,
      pointerDirectionChanges: snapshot.pointerDirectionChanges,
      pointerStraightness: snapshot.pointerStraightness,
      clickCount: snapshot.clickCount,
      scrollEventCount: snapshot.scrollEventCount,
      scrollBurstCount: snapshot.scrollBurstCount,
      keyEventCount: snapshot.keyEventCount,
      inputEventCount: snapshot.inputEventCount,
      focusTransitions: snapshot.focusTransitions,
      blurTransitions: snapshot.blurTransitions,
      visibilityTransitions: snapshot.visibilityTransitions,
      meanPointerIntervalMs: snapshot.meanPointerIntervalMs,
      meanKeyIntervalMs: snapshot.meanKeyIntervalMs,
      classification,
      riskScore: Number(riskScore.toFixed(2)),
      reasons,
      hash: "",
    };

    value.hash = await sha256(
      [
        `elapsedMs:${value.elapsedMs}`,
        `totalEventCount:${value.totalEventCount}`,
        `pointerMoveCount:${value.pointerMoveCount}`,
        `pointerDistancePx:${value.pointerDistancePx}`,
        `pointerDirectionChanges:${value.pointerDirectionChanges}`,
        `pointerStraightness:${String(value.pointerStraightness ?? "")}`,
        `clickCount:${value.clickCount}`,
        `scrollEventCount:${value.scrollEventCount}`,
        `scrollBurstCount:${value.scrollBurstCount}`,
        `keyEventCount:${value.keyEventCount}`,
        `inputEventCount:${value.inputEventCount}`,
        `focusTransitions:${value.focusTransitions}`,
        `blurTransitions:${value.blurTransitions}`,
        `visibilityTransitions:${value.visibilityTransitions}`,
        `meanPointerIntervalMs:${String(value.meanPointerIntervalMs ?? "")}`,
        `meanKeyIntervalMs:${String(value.meanKeyIntervalMs ?? "")}`,
        `classification:${value.classification}`,
        `riskScore:${value.riskScore}`,
        `reasons:${value.reasons.join(",")}`,
      ].join("|"),
    );

    return {
      value,
      duration: performance.now() - start,
    };
  } catch {
    return null;
  }
}
