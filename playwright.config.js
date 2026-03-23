import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    // Where generated test files live
    testDir: './runtime/generated-tests',

    // Give each test up to 30 seconds
    timeout: 30_000,

    // Don't retry on CI — failures should be investigated
    retries: 0,

    // Run tests sequentially (avoids port conflicts and race conditions)
    workers: 1,

    // Always emit JSON for our reportParser
    reporter: [
        ['json', { outputFile: 'runtime/reports/last-run.json' }],
        ['list'],  // human-readable progress in the terminal
    ],

    use: {
        // Headless by default; overridden by PLAYWRIGHT_HEADED env var at spawn time
        headless: process.env.PLAYWRIGHT_HEADED !== 'true',

        // Screenshots on failure are saved by each test's own try/catch,
        // but this acts as an extra safety net
        screenshot: 'only-on-failure',

        // Traces help diagnose failures — open with: npx playwright show-trace
        trace: 'on-first-retry',

        // Viewport matching a typical desktop browser
        viewport: { width: 1280, height: 720 },
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    // Store test artifacts alongside reports
    outputDir: 'runtime/artifacts',
});