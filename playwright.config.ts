process.env.LANG ||= 'C.UTF-8'
import { defineConfig, devices } from '@playwright/test'

const origin = 'http://127.0.0.1:4321'

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: origin,
    browserName: 'chromium',
  },
  projects: [
    { name: 'chromium' },
    { name: 'reduced-motion', use: { reducedMotion: 'reduce' } },
    { name: 'mobile', testMatch: /(?:smoke|overflow)\.spec\.ts$/, use: { ...devices['iPhone 13'], browserName: 'chromium', defaultBrowserType: 'chromium' } },
  ],
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4321 --ignore-lock',
    reuseExistingServer: true,
    url: `${origin}/portfolio-web-design/`,
  },
})
