import { defineConfig } from "vite";

export default defineConfig({
  root: "tests/with-bundler",
  publicDir: "../../hotwords",
  server: {
    port: 3000,
  },
  build: {
    outDir: "../../dist",
  },
});
