import type { SignalResult, FontSignal } from "../types";

const TEST_FONTS = [
  "Arial", "Arial Black", "Calibri", "Cambria", "Comic Sans MS", "Consolas",
  "Courier New", "Georgia", "Helvetica", "Helvetica Neue", "Impact",
  "Lucida Console", "Lucida Sans Unicode", "Microsoft Sans Serif",
  "Palatino Linotype", "Segoe UI", "Tahoma", "Times New Roman", "Trebuchet MS",
  "Verdana", "Monaco", "Menlo", "SF Pro", "SF Mono", "Roboto", "Noto Sans",
  "Ubuntu", "Cantarell", "DejaVu Sans", "Liberation Sans", "Fira Code",
  "Source Code Pro", "Droid Sans", "Open Sans", "Lato", "Montserrat",
  "Gill Sans", "Futura", "Optima", "Baskerville", "Garamond",
  "Century Gothic", "Franklin Gothic Medium", "Rockwell", "Copperplate",
  "Papyrus", "Brush Script MT",
  "SimHei", "SimSun", "MS Gothic", "MS Mincho", "Malgun Gothic",
  "Yu Gothic", "Meiryo", "Apple SD Gothic Neo", "Nanum Gothic",
  "Arabic Typesetting", "Nirmala UI", "Mangal",
];

const BASE_FONTS = ["monospace", "sans-serif", "serif"] as const;
const TEST_STRING = "mmmmmmmmmmlli1WWWWW";
const TEST_SIZE = "72px";

function measureWidth(fontFamily: string): number {
  const span = document.createElement("span");
  span.style.position = "absolute";
  span.style.left = "-9999px";
  span.style.fontSize = TEST_SIZE;
  span.style.fontFamily = fontFamily;
  span.style.letterSpacing = "normal";
  span.textContent = TEST_STRING;
  document.body.appendChild(span);
  const width = span.getBoundingClientRect().width;
  span.remove();
  return width;
}

export async function collectFonts(): Promise<SignalResult<FontSignal> | null> {
  const start = performance.now();
  try {
    const baseWidths = BASE_FONTS.map((f) => measureWidth(f));
    const detected: string[] = [];

    for (const font of TEST_FONTS) {
      for (let i = 0; i < BASE_FONTS.length; i++) {
        const testWidth = measureWidth(`'${font}', ${BASE_FONTS[i]}`);
        if (testWidth !== baseWidths[i]) {
          detected.push(font);
          break;
        }
      }
    }

    const allSameWidth = detected.length === 0 && TEST_FONTS.length > 10;
    const allDetected = detected.length === TEST_FONTS.length;
    const isSpoofed = allSameWidth || allDetected;

    return { value: { detected, count: detected.length, isSpoofed }, duration: performance.now() - start };
  } catch { return null; }
}
