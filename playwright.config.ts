import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:3162";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  workers: 2,
  timeout: 60_000,
  use: {
    baseURL,
    channel: process.env.WTN_BROWSER_CHANNEL || undefined,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3162",
    url: baseURL + "/demo",
    timeout: 120_000,
    env: { GEMINI_API_KEY: "", NEXT_TELEMETRY_DISABLED: "1" },
  },
});
