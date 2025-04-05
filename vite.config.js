import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  root: "src",
  base: command === "serve" ? "/" : "/signalk-heel-angle/",
  server: {
    host: true,
    port: 5173,
    open: true,
  },
  build: {
    outDir: "../public",
    sourcemap: true,
    assetsDir: "assets",
    emptyOutDir: true,
  },
  assetsInclude: ["**/*.svg"],
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
  },
}));
