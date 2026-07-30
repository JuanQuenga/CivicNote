import { defineConfig } from "vitest/config"

// Kept separate from vite.config.ts on purpose: the app config loads the
// TanStack Start and PWA plugins, which spin up a server the test run then
// can't shut down. The Convex tests are plain node modules and need none of it.
export default defineConfig({
  test: {
    include: ["convex/**/*.test.ts"],
    environment: "node",
  },
})
