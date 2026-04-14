import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { index: "src/index.ts" },
    format: ["esm", "cjs", "iife"],
    globalName: "FingerprintIQ",
    dts: true,
    sourcemap: true,
    clean: true,
    minify: true,
    target: "es2022",
  },
  {
    entry: {
      "react/index": "src/react/index.ts",
      "vue/index": "src/vue/index.ts",
      "next/index": "src/next/index.ts",
    },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    // clean: false — the first config owns dist cleanup; setting true here
    // would wipe dist/index.* before we get to emit dist/{react,vue,next}/*.
    clean: false,
    minify: true,
    target: "es2022",
    external: ["react", "react-dom", "vue"],
  },
]);
