import type { SignalResult, WindowFeaturesSignal } from "../types";
import { sha256 } from "../hash";

const KNOWN_GLOBALS = new Set([
  "undefined", "globalThis", "Infinity", "NaN",
  "eval", "isFinite", "isNaN", "parseFloat", "parseInt",
  "decodeURI", "decodeURIComponent", "encodeURI", "encodeURIComponent",
  "escape", "unescape", "Object", "Function", "Boolean", "Symbol",
  "Error", "EvalError", "RangeError", "ReferenceError", "SyntaxError",
  "TypeError", "URIError", "AggregateError", "InternalError",
  "Number", "BigInt", "Math", "Date", "String", "RegExp", "Array",
  "Int8Array", "Uint8Array", "Uint8ClampedArray", "Int16Array", "Uint16Array",
  "Int32Array", "Uint32Array", "Float32Array", "Float64Array", "BigInt64Array",
  "BigUint64Array", "Map", "Set", "WeakMap", "WeakSet", "WeakRef",
  "ArrayBuffer", "SharedArrayBuffer", "Atomics", "DataView", "JSON",
  "Promise", "Generator", "GeneratorFunction", "AsyncFunction",
  "AsyncGenerator", "AsyncGeneratorFunction", "Reflect", "Proxy",
  "Intl", "Iterator",
  // Browser globals
  "window", "self", "document", "frames", "parent", "top", "opener",
  "closed", "length", "frameElement", "external", "location", "history",
  "navigator", "screen", "visualViewport", "performance", "crypto",
  "console", "alert", "confirm", "prompt", "open", "close", "focus",
  "blur", "postMessage", "requestAnimationFrame", "cancelAnimationFrame",
  "requestIdleCallback", "cancelIdleCallback", "setTimeout", "clearTimeout",
  "setInterval", "clearInterval", "queueMicrotask", "fetch", "XMLHttpRequest",
  "WebSocket", "EventSource", "Worker", "SharedWorker", "ServiceWorker",
  "Notification", "PushManager", "Blob", "File", "FileList", "FileReader",
  "FormData", "URLSearchParams", "URL", "Headers", "Request", "Response",
  "Event", "EventTarget", "CustomEvent", "MessageEvent", "ErrorEvent",
  "ProgressEvent", "UIEvent", "MouseEvent", "KeyboardEvent", "TouchEvent",
  "PointerEvent", "WheelEvent", "FocusEvent", "InputEvent", "CompositionEvent",
  "DragEvent", "ClipboardEvent", "BeforeUnloadEvent", "HashChangeEvent",
  "PopStateEvent", "PageTransitionEvent", "StorageEvent", "AnimationEvent",
  "TransitionEvent", "DeviceOrientationEvent", "DeviceMotionEvent",
  "MediaQueryList", "MediaQueryListEvent", "ResizeObserver", "MutationObserver",
  "IntersectionObserver", "PerformanceObserver",
  "HTMLElement", "Element", "Node", "NodeList", "HTMLCollection",
  "Document", "DocumentFragment", "ShadowRoot", "Text", "Comment",
  "Attr", "CSSStyleDeclaration", "DOMParser", "XMLSerializer", "Range",
  "Selection", "TreeWalker", "NodeIterator", "XPathResult", "XPathExpression",
  "Canvas", "CanvasRenderingContext2D", "WebGLRenderingContext",
  "WebGL2RenderingContext", "ImageData", "ImageBitmap",
  "Audio", "AudioContext", "AudioBuffer", "AudioNode",
  "MediaStream", "MediaStreamTrack", "RTCPeerConnection",
  "IDBFactory", "IDBDatabase", "indexedDB", "localStorage", "sessionStorage",
  "caches", "cookieStore", "speechSynthesis", "speechRecognition",
  "CSS", "CSSAnimation", "CSSTransition",
  "customElements", "reportError",
  "AbortController", "AbortSignal",
  "TextEncoder", "TextDecoder", "TextDecoderStream", "TextEncoderStream",
  "TransformStream", "ReadableStream", "WritableStream", "ByteLengthQueuingStrategy",
  "CountQueuingStrategy",
  "structuredClone", "atob", "btoa",
  "clearImmediate", "setImmediate",
  "matchMedia", "getComputedStyle", "getSelection", "dispatchEvent",
  "addEventListener", "removeEventListener",
  "scrollX", "scrollY", "pageXOffset", "pageYOffset",
  "screenX", "screenY", "screenLeft", "screenTop",
  "innerWidth", "innerHeight", "outerWidth", "outerHeight",
  "devicePixelRatio", "scrollbars", "menubar", "toolbar",
  "statusbar", "personalbar", "locationbar",
  "status", "defaultStatus", "name",
  "origin", "crossOriginIsolated", "isSecureContext",
  "trustedTypes", "launchQueue",
  "scheduler", "navigation",
  "TEMPORARY", "PERSISTENT",
  "Gamepad", "GamepadEvent",
  "SpeechSynthesis", "SpeechSynthesisVoice", "SpeechSynthesisUtterance",
  "SpeechRecognition", "SpeechGrammar", "SpeechGrammarList",
  "BroadcastChannel", "MessageChannel", "MessagePort",
  "OffscreenCanvas", "Path2D",
  "PaymentRequest", "PaymentResponse",
  "CredentialsContainer", "PublicKeyCredential",
  "SubtleCrypto",
  "CompressionStream", "DecompressionStream",
  "LockManager", "Lock",
  "StorageManager",
  "BarProp", "History", "Location", "Navigator", "Screen",
  "DataTransfer", "DataTransferItem", "DataTransferItemList",
  "DOMException", "DOMImplementation", "DOMRect", "DOMPoint", "DOMMatrix",
  "DOMRectReadOnly", "DOMPointReadOnly", "DOMMatrixReadOnly",
]);

export async function collectWindowFeatures(): Promise<SignalResult<WindowFeaturesSignal> | null> {
  const start = performance.now();
  try {
    const props = Object.getOwnPropertyNames(window);
    const propertyCount = props.length;

    let webkitCount = 0;
    let mozCount = 0;
    const litterKeys: string[] = [];

    for (const key of props) {
      const lower = key.toLowerCase();
      if (lower.startsWith("webkit")) {
        webkitCount++;
        continue;
      }
      if (lower.startsWith("moz")) {
        mozCount++;
        continue;
      }
      // Skip known globals
      if (KNOWN_GLOBALS.has(key)) continue;
      // Skip "on*" event handlers
      if (key.startsWith("on")) continue;
      // Skip "__" prefixed properties
      if (key.startsWith("__")) continue;
      // Skip numeric indices
      if (/^\d+$/.test(key)) continue;
      // Skip webkit/moz already counted
      // This key is "litter"
      litterKeys.push(key);
    }

    litterKeys.sort();
    const capped = litterKeys.slice(0, 50);

    const hash = await sha256(
      `${propertyCount}|${webkitCount}|${mozCount}|${capped.join(",")}`
    );

    return {
      value: {
        propertyCount,
        webkitCount,
        mozCount,
        litterKeys: capped,
        hash,
      },
      duration: performance.now() - start,
    };
  } catch {
    return null;
  }
}
