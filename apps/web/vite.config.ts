import { defineConfig } from "vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import viteTsConfigPaths from "vite-tsconfig-paths"
import tailwindcss from "@tailwindcss/vite"
import { nitro } from "nitro/vite"
import { VitePWA } from "vite-plugin-pwa"

const config = defineConfig({
  plugins: [
    nitro(),
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      outDir: ".output/public",
      injectRegister: "script",
      registerType: "prompt",
      manifest: false,
      includeAssets: [
        "favicon.svg",
        "apple-touch-icon.png",
        "icons/*.png",
        "offline.html",
        "manifest.json",
      ],
      injectManifest: {
        globPatterns: [
          "registerSW.js",
          "assets/main-*.js",
          "assets/SiteHeader-*.js",
          "assets/globals-*.css",
        ],
      },
    }),
  ],
})

export default config
