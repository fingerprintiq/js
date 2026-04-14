import type { SignalResult, IntlSignal } from "../types";
import { sha256 } from "../hash";

export async function collectIntl(): Promise<SignalResult<IntlSignal> | null> {
  const start = performance.now();
  try {
    const locales: string[] = [];
    const parts: string[] = [];

    // Collator
    try {
      const collator = new Intl.Collator();
      locales.push(collator.resolvedOptions().locale);
      parts.push(`collator:${collator.resolvedOptions().locale}`);
    } catch { /* ignore */ }

    // DateTimeFormat
    try {
      const dtf = new Intl.DateTimeFormat();
      locales.push(dtf.resolvedOptions().locale);
      const formatted = dtf.format(new Date(2024, 0, 1));
      parts.push(`dtf:${dtf.resolvedOptions().locale}:${formatted}`);
    } catch { /* ignore */ }

    // DisplayNames
    let displayNamesOutput = "";
    try {
      const dn = new (Intl as unknown as { DisplayNames: new (locale: string[], opts: object) => { of: (code: string) => string; resolvedOptions: () => { locale: string } } }).DisplayNames(["en"], { type: "region" });
      locales.push(dn.resolvedOptions().locale);
      const us = dn.of("US") ?? "";
      const jp = dn.of("JP") ?? "";
      const de = dn.of("DE") ?? "";
      displayNamesOutput = `${us},${jp},${de}`;
      parts.push(`displayNames:${displayNamesOutput}`);
    } catch { /* ignore */ }

    // ListFormat
    let formattedList = "";
    try {
      const lf = new (Intl as unknown as { ListFormat: new (locale: string[], opts: object) => { format: (items: string[]) => string; resolvedOptions: () => { locale: string } } }).ListFormat(["en"], { style: "long", type: "conjunction" });
      locales.push(lf.resolvedOptions().locale);
      formattedList = lf.format(["Alice", "Bob", "Carol"]);
      parts.push(`listFormat:${formattedList}`);
    } catch { /* ignore */ }

    // NumberFormat
    let formattedNumber = "";
    try {
      const nf = new Intl.NumberFormat(undefined, { notation: "compact", compactDisplay: "long" } as Intl.NumberFormatOptions);
      locales.push(nf.resolvedOptions().locale);
      formattedNumber = nf.format(21000000);
      parts.push(`numberFormat:${formattedNumber}`);
    } catch { /* ignore */ }

    // PluralRules
    try {
      const pr = new Intl.PluralRules();
      locales.push(pr.resolvedOptions().locale);
      const p0 = pr.select(0);
      const p1 = pr.select(1);
      const p2 = pr.select(2);
      parts.push(`pluralRules:${p0},${p1},${p2}`);
    } catch { /* ignore */ }

    // RelativeTimeFormat
    let formattedRelativeTime = "";
    try {
      const rtf = new (Intl as unknown as { RelativeTimeFormat: new (locale: string[], opts: object) => { format: (value: number, unit: string) => string; resolvedOptions: () => { locale: string } } }).RelativeTimeFormat(["en"], { numeric: "auto" });
      locales.push(rtf.resolvedOptions().locale);
      formattedRelativeTime = rtf.format(-1, "year");
      parts.push(`relativeTime:${formattedRelativeTime}`);
    } catch { /* ignore */ }

    const uniqueLocales = [...new Set(locales)];

    // Detect locale spoofing: compare against navigator.language
    let localeSpoofed = false;
    try {
      const navLang = navigator.language?.split("-")[0].toLowerCase();
      if (navLang && uniqueLocales.length > 0) {
        const intlLang = uniqueLocales[0].split("-")[0].toLowerCase();
        localeSpoofed = intlLang !== navLang;
      }
    } catch { /* ignore */ }

    const hash = await sha256(parts.join("|"));

    return {
      value: {
        locales: uniqueLocales,
        formattedNumber,
        formattedRelativeTime,
        formattedList,
        localeSpoofed,
        hash,
      },
      duration: performance.now() - start,
    };
  } catch {
    return null;
  }
}
