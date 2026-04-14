import type { SignalResult } from "../types";

export interface HeadlessSignal {
  isHeadless: boolean;
  markers: string[];
}

export async function collectHeadless(): Promise<SignalResult<HeadlessSignal>> {
  const start = performance.now();
  const markers: string[] = [];
  const win = globalThis as Record<string, unknown>;
  const nav = globalThis.navigator as unknown as Record<string, unknown>;

  // WebDriver flag
  if (nav.webdriver === true) markers.push("webdriver");

  // Check if webdriver is writable (real browsers lock it)
  try {
    const desc = Object.getOwnPropertyDescriptor(Navigator.prototype, "webdriver");
    if (desc && desc.configurable) markers.push("webdriver_configurable");
  } catch { /* ignore */ }

  // Selenium markers
  if (win._selenium !== undefined) markers.push("selenium");
  if (win.__selenium_unwrapped !== undefined) markers.push("selenium_unwrapped");
  if ((document as unknown as Record<string, unknown>).$cdc_asdjflasutopfhvcZLmcfl_ !== undefined) markers.push("chromedriver_cdc");
  if ((document as unknown as Record<string, unknown>).__webdriver_evaluate !== undefined) markers.push("webdriver_evaluate");
  if ((document as unknown as Record<string, unknown>).__driver_evaluate !== undefined) markers.push("driver_evaluate");

  // Playwright markers
  if (win.__playwright !== undefined) markers.push("playwright");
  if (win.__pw_manual !== undefined) markers.push("playwright_manual");

  // Puppeteer markers
  if (win.__puppeteer !== undefined) markers.push("puppeteer");

  // Nightmare.js
  if (win.__nightmare !== undefined) markers.push("nightmare");

  // PhantomJS
  if (win.callPhantom !== undefined || win._phantom !== undefined) markers.push("phantom");

  // Chrome-specific: real Chrome has window.chrome
  const ua = (typeof navigator !== "undefined" ? navigator.userAgent : "").toLowerCase();
  const claimsChrome = ua.includes("chrome") && !ua.includes("edg");
  if (claimsChrome && !win.chrome) markers.push("missing_chrome_object");

  // HeadlessChrome in user agent
  if (ua.includes("headlesschrome")) markers.push("headless_ua");

  // Plugin count (real browsers usually have > 0 plugins)
  if (typeof navigator !== "undefined" && navigator.plugins && navigator.plugins.length === 0 && claimsChrome) {
    markers.push("no_plugins");
  }

  // Languages empty (headless default)
  if (typeof navigator !== "undefined" && (!navigator.languages || navigator.languages.length === 0)) {
    markers.push("no_languages");
  }

  // Impossible deviceMemory
  const deviceMem = (nav as Record<string, unknown>).deviceMemory;
  if (typeof deviceMem === "number" && (deviceMem <= 0 || deviceMem > 256)) {
    markers.push("impossible_device_memory");
  }

  // Notification permission anomaly (headless browsers often have "denied" even before asking)
  try {
    if (typeof Notification !== "undefined" && Notification.permission === "denied" && !win._notificationDenied) {
      // This alone isn't conclusive, but combined with other markers it helps
    }
  } catch { /* ignore */ }

  // DOM automation interfaces
  if (win.domAutomation !== undefined || win.domAutomationController !== undefined) {
    markers.push("dom_automation");
  }

  return {
    value: {
      isHeadless: markers.length >= 2,
      markers,
    },
    duration: performance.now() - start,
  };
}
