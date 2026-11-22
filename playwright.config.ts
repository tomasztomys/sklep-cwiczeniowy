import { defineConfig } from '@playwright/test';

const port = Number(process.env.PORT ?? 3000);
const baseURL = process.env.BASE_URL ?? `http://localhost:${String(port)}`;

export default defineConfig({
  testDir: './testy',
  // Testy trybów błędów uruchamiają własne procesy sklepu z kodu, więc nie dotyczą kontenera.
  testIgnore: process.env.BASE_URL ? ['**/tryby/**'] : [],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: { baseURL, trace: 'retain-on-failure' },
  // Bez BASE_URL testy uruchamiają sklep z kodu źródłowego; z BASE_URL testują podany adres, np. kontener.
  webServer: process.env.BASE_URL
    ? undefined
    : { command: 'node src/serwer.ts', url: `${baseURL}/api/health`, reuseExistingServer: !process.env.CI, env: { PORT: String(port) } },
});
