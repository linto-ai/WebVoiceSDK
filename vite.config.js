import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  // Build lib pour npm
  if (mode === "lib") {
    return {
      build: {
        lib: {
          entry: resolve(__dirname, "src/webvoicesdk.js"),
          name: "WebVoiceSDK",
          fileName: (format) => {
            if (format === "iife") return "webvoicesdk.min.js";
            return "webvoicesdk.es.js";
          },
          formats: ["es", "iife"],
        },
        outDir: "dist",
        rollupOptions: {
          external: ["@tensorflow/tfjs", "@tensorflow/tfjs-backend-wasm"],
        },
      },
    };
  }

  // Dev / test
  return {
    root: "tests/with-bundler",
    publicDir: "../../hotwords",
    server: {
      port: 3000,
    },
    build: {
      outDir: "../../dist",
    },
  };
});
