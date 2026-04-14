import type {
  SignalResult,
  UAClientHintsBrand,
  UAClientHintsSignal,
} from "../types";
import { sha256 } from "../hash";

interface NavigatorUADataLike {
  brands?: Array<{ brand?: string; version?: string }>;
  mobile?: boolean;
  platform?: string;
  getHighEntropyValues?: (
    hints: string[],
  ) => Promise<Record<string, unknown>>;
}

const HIGH_ENTROPY_HINTS = [
  "architecture",
  "bitness",
  "formFactors",
  "fullVersionList",
  "model",
  "platformVersion",
  "wow64",
];

function normalizeBrands(
  brands: Array<{ brand?: string; version?: string }> | undefined,
): UAClientHintsBrand[] {
  return (brands ?? [])
    .map((entry) => ({
      brand: entry.brand ?? "",
      version: entry.version ?? "",
    }))
    .filter((entry) => entry.brand.length > 0)
    .sort((a, b) =>
      a.brand.localeCompare(b.brand) || a.version.localeCompare(b.version),
    );
}

export async function collectUaClientHints(): Promise<
  SignalResult<UAClientHintsSignal> | null
> {
  const start = performance.now();

  try {
    const nav = navigator as Navigator & {
      userAgentData?: NavigatorUADataLike;
    };
    const uaData = nav.userAgentData;

    if (!uaData) {
      return {
        value: {
          available: false,
          mobile: null,
          platform: null,
          architecture: null,
          bitness: null,
          model: null,
          platformVersion: null,
          wow64: null,
          formFactors: [],
          brands: [],
          fullVersionList: [],
          hash: null,
        },
        duration: performance.now() - start,
      };
    }

    let highEntropyValues: Record<string, unknown> = {};
    try {
      if (typeof uaData.getHighEntropyValues === "function") {
        highEntropyValues =
          (await uaData.getHighEntropyValues(HIGH_ENTROPY_HINTS)) ?? {};
      }
    } catch {
      highEntropyValues = {};
    }

    const brands = normalizeBrands(uaData.brands);
    const fullVersionList = normalizeBrands(
      highEntropyValues.fullVersionList as
        | Array<{ brand?: string; version?: string }>
        | undefined,
    );
    const formFactors = Array.isArray(highEntropyValues.formFactors)
      ? [...(highEntropyValues.formFactors as string[])].sort()
      : [];

    const fingerprintParts = [
      `mobile:${String(uaData.mobile ?? "")}`,
      `platform:${uaData.platform ?? ""}`,
      `architecture:${String(highEntropyValues.architecture ?? "")}`,
      `bitness:${String(highEntropyValues.bitness ?? "")}`,
      `model:${String(highEntropyValues.model ?? "")}`,
      `platformVersion:${String(highEntropyValues.platformVersion ?? "")}`,
      `wow64:${String(highEntropyValues.wow64 ?? "")}`,
      `brands:${brands
        .map((entry) => `${entry.brand}/${entry.version}`)
        .join(",")}`,
      `fullVersionList:${fullVersionList
        .map((entry) => `${entry.brand}/${entry.version}`)
        .join(",")}`,
      `formFactors:${formFactors.join(",")}`,
    ];

    return {
      value: {
        available: true,
        mobile: uaData.mobile ?? null,
        platform: uaData.platform ?? null,
        architecture:
          (highEntropyValues.architecture as string | undefined) ?? null,
        bitness: (highEntropyValues.bitness as string | undefined) ?? null,
        model: (highEntropyValues.model as string | undefined) ?? null,
        platformVersion:
          (highEntropyValues.platformVersion as string | undefined) ?? null,
        wow64: (highEntropyValues.wow64 as boolean | undefined) ?? null,
        formFactors,
        brands,
        fullVersionList,
        hash: await sha256(fingerprintParts.join("|")),
      },
      duration: performance.now() - start,
    };
  } catch {
    return null;
  }
}
