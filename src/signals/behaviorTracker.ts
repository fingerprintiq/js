interface PointerSample {
  x: number;
  y: number;
  t: number;
}

interface TrackerState {
  installedAt: number;
  pointerMoveCount: number;
  pointerDistancePx: number;
  pointerDirectionChanges: number;
  clickCount: number;
  scrollEventCount: number;
  scrollBurstCount: number;
  keyEventCount: number;
  inputEventCount: number;
  focusTransitions: number;
  blurTransitions: number;
  visibilityTransitions: number;
  pointerIntervals: number[];
  keyIntervals: number[];
  firstPointerSample: PointerSample | null;
  lastPointerSample: PointerSample | null;
  lastPointerAngle: number | null;
  lastScrollAt: number | null;
  lastKeyAt: number | null;
}

interface BehaviorSnapshot {
  elapsedMs: number;
  pointerMoveCount: number;
  pointerDistancePx: number;
  pointerDirectionChanges: number;
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
  pointerStraightness: number | null;
}

const GLOBAL_TRACKER_KEY = "__fiq_behavior_tracker_state__";
const MIN_DIRECTION_DELTA_RAD = Math.PI / 6;

function nowMs(): number {
  try {
    return performance.now();
  } catch {
    return Date.now();
  }
}

function createInitialState(): TrackerState {
  return {
    installedAt: nowMs(),
    pointerMoveCount: 0,
    pointerDistancePx: 0,
    pointerDirectionChanges: 0,
    clickCount: 0,
    scrollEventCount: 0,
    scrollBurstCount: 0,
    keyEventCount: 0,
    inputEventCount: 0,
    focusTransitions: 0,
    blurTransitions: 0,
    visibilityTransitions: 0,
    pointerIntervals: [],
    keyIntervals: [],
    firstPointerSample: null,
    lastPointerSample: null,
    lastPointerAngle: null,
    lastScrollAt: null,
    lastKeyAt: null,
  };
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function computeStraightness(
  firstPointerSample: PointerSample | null,
  lastPointerSample: PointerSample | null,
  pointerDistancePx: number,
): number | null {
  if (!firstPointerSample || !lastPointerSample || pointerDistancePx <= 0) {
    return null;
  }
  const dx = lastPointerSample.x - firstPointerSample.x;
  const dy = lastPointerSample.y - firstPointerSample.y;
  const displacement = Math.hypot(dx, dy);
  return Math.min(1, displacement / pointerDistancePx);
}

function getTrackerState(): TrackerState | null {
  const globalState = globalThis as Record<string, unknown>;
  return (globalState[GLOBAL_TRACKER_KEY] as TrackerState | null) ?? null;
}

function setTrackerState(state: TrackerState): void {
  (globalThis as Record<string, unknown>)[GLOBAL_TRACKER_KEY] = state;
}

export function primeBehaviorTracking(): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (getTrackerState()) return;

  const state = createInitialState();
  setTrackerState(state);

  const trackPointer = (event: MouseEvent | PointerEvent): void => {
    const sample: PointerSample = {
      x: event.clientX ?? 0,
      y: event.clientY ?? 0,
      t: nowMs(),
    };

    state.pointerMoveCount += 1;
    if (!state.firstPointerSample) {
      state.firstPointerSample = sample;
    }

    if (state.lastPointerSample) {
      const dx = sample.x - state.lastPointerSample.x;
      const dy = sample.y - state.lastPointerSample.y;
      state.pointerDistancePx += Math.hypot(dx, dy);

      const dt = sample.t - state.lastPointerSample.t;
      if (dt > 0) {
        state.pointerIntervals.push(dt);
      }

      if (dx !== 0 || dy !== 0) {
        const angle = Math.atan2(dy, dx);
        if (
          state.lastPointerAngle !== null &&
          Math.abs(angle - state.lastPointerAngle) > MIN_DIRECTION_DELTA_RAD
        ) {
          state.pointerDirectionChanges += 1;
        }
        state.lastPointerAngle = angle;
      }
    }

    state.lastPointerSample = sample;
  };

  const trackClick = (): void => {
    state.clickCount += 1;
  };

  const trackScroll = (): void => {
    const at = nowMs();
    state.scrollEventCount += 1;
    if (state.lastScrollAt !== null && at - state.lastScrollAt <= 120) {
      state.scrollBurstCount += 1;
    }
    state.lastScrollAt = at;
  };

  const trackKey = (): void => {
    const at = nowMs();
    state.keyEventCount += 1;
    if (state.lastKeyAt !== null) {
      const dt = at - state.lastKeyAt;
      if (dt > 0) {
        state.keyIntervals.push(dt);
      }
    }
    state.lastKeyAt = at;
  };

  const trackInput = (): void => {
    state.inputEventCount += 1;
  };

  const trackFocus = (): void => {
    state.focusTransitions += 1;
  };

  const trackBlur = (): void => {
    state.blurTransitions += 1;
  };

  const trackVisibility = (): void => {
    state.visibilityTransitions += 1;
  };

  window.addEventListener("pointermove", trackPointer, { passive: true, capture: true });
  window.addEventListener("click", trackClick, { passive: true, capture: true });
  window.addEventListener("scroll", trackScroll, { passive: true, capture: true });
  window.addEventListener("keydown", trackKey, { passive: true, capture: true });
  window.addEventListener("input", trackInput, { passive: true, capture: true });
  window.addEventListener("focus", trackFocus, true);
  window.addEventListener("blur", trackBlur, true);
  document.addEventListener("visibilitychange", trackVisibility, true);
}

export function collectBehaviorSnapshot(): BehaviorSnapshot | null {
  const state = getTrackerState();
  if (!state) return null;

  return {
    elapsedMs: Math.max(0, Math.round(nowMs() - state.installedAt)),
    pointerMoveCount: state.pointerMoveCount,
    pointerDistancePx: Math.round(state.pointerDistancePx),
    pointerDirectionChanges: state.pointerDirectionChanges,
    clickCount: state.clickCount,
    scrollEventCount: state.scrollEventCount,
    scrollBurstCount: state.scrollBurstCount,
    keyEventCount: state.keyEventCount,
    inputEventCount: state.inputEventCount,
    focusTransitions: state.focusTransitions,
    blurTransitions: state.blurTransitions,
    visibilityTransitions: state.visibilityTransitions,
    meanPointerIntervalMs: average(state.pointerIntervals),
    meanKeyIntervalMs: average(state.keyIntervals),
    pointerStraightness: computeStraightness(
      state.firstPointerSample,
      state.lastPointerSample,
      state.pointerDistancePx,
    ),
  };
}

export function resetBehaviorTrackingForTests(): void {
  const globalState = globalThis as Record<string, unknown>;
  delete globalState[GLOBAL_TRACKER_KEY];
}
