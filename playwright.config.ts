import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 15000,
  fullyParallel: true,
  use: {
    headless: true,
    viewport: { width: 1280, height: 900 },
  },
  projects: [
    {
      name: 'vanilla-chromium',
      use: {
        browserName: 'chromium',
        baseURL: 'http://localhost:5173',
      },
    },
    {
      name: 'vanilla-firefox',
      use: {
        browserName: 'firefox',
        baseURL: 'http://localhost:5173',
      },
    },
    {
      name: 'vanilla-webkit',
      use: {
        browserName: 'webkit',
        baseURL: 'http://localhost:5173',
      },
    },
    {
      name: 'vue-chromium',
      use: {
        browserName: 'chromium',
        baseURL: 'http://localhost:4173',
      },
    },
    {
      name: 'vue-firefox',
      use: {
        browserName: 'firefox',
        baseURL: 'http://localhost:4173',
      },
    },
    {
      name: 'vue-webkit',
      use: {
        browserName: 'webkit',
        baseURL: 'http://localhost:4173',
      },
    },
  ],
  webServer: [
    {
      command: 'npm run dev -- --port 5173',
      port: 5173,
      reuseExistingServer: true,
    },
    {
      command: 'cd demo-vue && npm install && npm run dev -- --port 4173',
      port: 4173,
      reuseExistingServer: true,
    },
  ],
});
