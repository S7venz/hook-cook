import { defineConfig, devices } from '@playwright/test'

/**
 * Configuration Playwright pour les tests E2E Hook & Cook.
 *
 * Stratégie :
 * - Tests lancés contre l'app dockerisée (docker compose up -d)
 *   → frontend sur :5173, backend sur :8080.
 * - 1 seul navigateur (chromium) car les autres sont irrelevants ici et
 *   notre CI a un budget temps limité ; basculer en multi-browser si
 *   un jour on a des bugs spécifiques à Firefox/WebKit.
 * - Captures + traces conservées uniquement en cas d'échec.
 * - Pas de webServer auto-démarré ici : on assume docker compose tourne
 *   déjà (script `npm run test:e2e` documenté dans le README).
 */
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.js',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['list']]
    : [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: process.env.HC_E2E_BASE || 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  outputDir: 'e2e-results/',
})
