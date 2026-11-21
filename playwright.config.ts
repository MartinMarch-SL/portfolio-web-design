import { defineConfig } from '@playwright/test'

const origin = 'http://127.0.0.1:4321'

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: origin,
    browserName: 'chromium',
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4321 --ignore-lock',
    reuseExistingServer: true,
    url: `${origin}/portfolio-web-design/`,
  },
})
