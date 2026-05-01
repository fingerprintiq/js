import type { HeadlessSignal, SignalResult } from "../types";

interface AutomationWindowFields {
  _notificationDenied?: boolean;
  _phantom?: object;
  _selenium?: object;
  __nightmare?: object;
  __playwright?: object;
  __puppeteer?: object;
  __pw_manual?: object;
  __selenium_unwrapped?: object;
  callPhantom?: object;
  chrome?: object;
  domAutomation?: object;
  domAutomationController?: object;
}

interface AutomationDocumentFields {
  $cdc_asdjflasutopfhvcZLmcfl_?: object;
  __driver_evaluate?: object;
  __webdriver_evaluate?: object;
}

type NavigatorWithAutomationFields = Navigator & {
  deviceMemory?: number;
  webdriver?: boolean;
};

export async function collectHeadless(): Promise<SignalResult<HeadlessSignal>> {
  const start = performance.now();
  const markers: string[] = [];
  const win = globalThis as typeof globalThis & AutomationWindowFields;
  const nav = typeof navigator === "undefined"
    ? undefined
    : navigator as NavigatorWithAutomationFields;
  const doc = typeof document === "undefined"
    ? undefined
    : document as Document & AutomationDocumentFields;

  // WebDriver flag
  if (nav?.webdriver === true) markers.push("webdriver");

  // Check if webdriver is writable (real browsers lock it)
  try {
    const desc = typeof Navigator === "undefined"
      ? undefined
      : Object.getOwnPropertyDescriptor(Navigator.prototype, "webdriver");
    if (desc && desc.configurable) markers.push("webdriver_configurable");
  } catch { /* ignore */ }

  // Selenium markers
  if (win._selenium !== undefined) markers.push("selenium");
  if (win.__selenium_unwrapped !== undefined) markers.push("selenium_unwrapped");
  if (doc?.$cdc_asdjflasutopfhvcZLmcfl_ !== undefined) markers.push("chromedriver_cdc");
  if (doc?.__webdriver_evaluate !== undefined) markers.push("webdriver_evaluate");
  if (doc?.__driver_evaluate !== undefined) markers.push("driver_evaluate");

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
  const ua = (nav?.userAgent ?? "").toLowerCase();
  const claimsChrome = ua.includes("chrome") && !ua.includes("edg");
  if (claimsChrome && !win.chrome) markers.push("missing_chrome_object");

  // HeadlessChrome in user agent
  if (ua.includes("headlesschrome")) markers.push("headless_ua");

  // Plugin count (real browsers usually have > 0 plugins)
  if (nav?.plugins && nav.plugins.length === 0 && claimsChrome) {
    markers.push("no_plugins");
  }

  // Languages empty (headless default)
  if (nav && (!nav.languages || nav.languages.length === 0)) {
    markers.push("no_languages");
  }

  // Impossible deviceMemory
  const deviceMem = nav?.deviceMemory;
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
