import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  timeout: 240000,
  expect: { timeout: 15000 },
  workers: 1,
  use: {
    baseURL: process.env.TEST_BASE_URL || "http://127.0.0.1:3000",
    actionTimeout: 15000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  reporter: "list",
});
