import type { SignalResult, StorageSignal } from "../types";

const FIQ_VID_KEY = "fiq_vid";
const TEST_KEY = "__fiq_test__";

function testStorage(storage: Storage): boolean {
  try {
    storage.setItem(TEST_KEY, "1");
    storage.removeItem(TEST_KEY);
    return true;
  } catch {
    return false;
  }
}

function testCookies(): boolean {
  try {
    const testValue = "__fiq_cookie_test__=1";
    document.cookie = testValue + "; SameSite=Strict";
    const found = document.cookie.indexOf("__fiq_cookie_test__") !== -1;
    // Clean up
    document.cookie = "__fiq_cookie_test__=; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict";
    return found;
  } catch {
    return false;
  }
}

function testIndexedDB(): Promise<boolean> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(false), 1000);
    try {
      if (typeof indexedDB === "undefined" || !indexedDB) {
        clearTimeout(timeout);
        resolve(false);
        return;
      }
      const req = indexedDB.open("__fiq_test__", 1);
      req.onsuccess = () => {
        clearTimeout(timeout);
        req.result.close();
        indexedDB.deleteDatabase("__fiq_test__");
        resolve(true);
      };
      req.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };
    } catch {
      clearTimeout(timeout);
      resolve(false);
    }
  });
}

function getSurvivingMechanisms(): string[] {
  const surviving: string[] = [];
  try {
    if (typeof localStorage !== "undefined" && localStorage.getItem(FIQ_VID_KEY) !== null) {
      surviving.push("localStorage");
    }
  } catch { /* ignore */ }
  try {
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(FIQ_VID_KEY) !== null) {
      surviving.push("sessionStorage");
    }
  } catch { /* ignore */ }
  try {
    if (document.cookie.indexOf(FIQ_VID_KEY + "=") !== -1) {
      surviving.push("cookie");
    }
  } catch { /* ignore */ }
  return surviving;
}

export async function collectStorage(): Promise<SignalResult<StorageSignal>> {
  const start = performance.now();

  let localStorageAvailable = false;
  try {
    localStorageAvailable = testStorage(localStorage);
  } catch { /* ignore */ }

  let sessionStorageAvailable = false;
  try {
    sessionStorageAvailable = testStorage(sessionStorage);
  } catch { /* ignore */ }

  const cookieAvailable = testCookies();
  const indexedDbAvailable = await testIndexedDB();
  const survivingMechanisms = getSurvivingMechanisms();

  return {
    value: {
      localStorage: localStorageAvailable,
      sessionStorage: sessionStorageAvailable,
      indexedDb: indexedDbAvailable,
      cookie: cookieAvailable,
      survivingMechanisms,
    },
    duration: performance.now() - start,
  };
}
