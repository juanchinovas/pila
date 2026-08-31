import { defineConfig } from '@playwright/test';

const crossBrowserSmoke = [
  'e2e/slash-menu.keyboard.spec.ts',
  'e2e/floating-toolbar.spec.ts',
  'e2e/overlay-lifecycle.spec.ts',
  'e2e/post-export.spec.ts',
];

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  fullyParallel: true,
  use: {
    headless: true,
    viewport: { width: 1280, height: 900 },
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'vanilla-webkit-smoke',
      testMatch: crossBrowserSmoke,
      use: {
        browserName: 'webkit',
        baseURL: 'http://localhost:5173',
      },
    },
    {
      name: 'vanilla-firefox-smoke',
      testMatch: crossBrowserSmoke,
      use: {
        browserName: 'firefox',
        baseURL: 'http://localhost:5173',
      },
    },
    {
      name: 'vanilla-mobile-chromium-smoke',
      testMatch: crossBrowserSmoke,
      use: {
        browserName: 'chromium',
        baseURL: 'http://localhost:5173',
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: 'npm run dev -- --port 5173',
    port: 5173,
    reuseExistingServer: true,
  },
});
