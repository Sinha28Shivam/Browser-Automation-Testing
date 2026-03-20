import { z } from 'zod';
import { generateTest, runTest, getTestStatus } from './tools.js';

/**
 * Register all three tools on a given McpServer instance.
 * Called by both stdio and HTTP entry points so definitions stay in one place.
 */
export function registerTools(server) {

    // ── generate_test ─────────────────────────────────────────────────────
    server.tool(
        'generate_test',
        'Generate a Playwright test file from a plain-English description. ' +
        'Returns testId and filePath. Call run_test afterwards to execute it.',
        {
            url: z.string().url().describe('The page URL to test'),
            title: z.string().describe('Short title for the test suite e.g. "Login flow"'),
            scenario: z.string().describe(
                'Plain-English description of what to test — include positive and negative cases.'
            ),
            selectors: z.object({
                username: z.string().optional().describe('CSS selector for username field'),
                password: z.string().optional().describe('CSS selector for password field'),
                submit:   z.string().optional().describe('CSS selector for submit button'),
            }).optional().describe('Known CSS selectors — leave empty if unsure'),
        },
        async ({ url, title, scenario, selectors }) => {
            const result = await generateTest({ url, title, scenario, selectors });

            if (!result.success) {
                return {
                    content: [{ type: 'text', text: `❌ Generation failed:\n${result.error}` }],
                    isError: true,
                };
            }

            return {
                content: [{
                    type: 'text',
                    text: [
                        `✅ Test generated!`,
                        ``,
                        `**Test ID:** ${result.data.testId}`,
                        `**File:** ${result.data.file?.filePath}`,
                        `**Status:** ${result.data.status}`,
                        ``,
                        `Now call \`run_test\` with:`,
                        `  filePath: "${result.data.file?.filePath}"`,
                        `  testId:   "${result.data.testId}"`,
                    ].join('\n'),
                }],
            };
        }
    );

    // ── run_test ──────────────────────────────────────────────────────────
    server.tool(
        'run_test',
        'Execute a previously generated Playwright test file. ' +
        'Returns pass/fail summary. On full pass the file is committed and pushed to GitHub.',
        {
            filePath: z.string().describe('Absolute path of the .spec.js file from generate_test'),
            testId:   z.string().describe('The testId from generate_test'),
        },
        async ({ filePath, testId }) => {
            const result = await runTest({ filePath, testId });

            if (!result.success) {
                return {
                    content: [{ type: 'text', text: `❌ Run failed:\n${result.error}` }],
                    isError: true,
                };
            }

            const { report, git } = result.data;
            const icon = report.status === 'PASSED' ? '✅' : '❌';

            const lines = [
                `${icon} Test run complete`,
                ``,
                `**Status:**  ${report.status}`,
                `**Total:**   ${report.totalTests}`,
                `**Failed:**  ${report.failedTests}`,
                `**Skipped:** ${report.skippedTests}`,
                `**Duration:** ${(report.duration / 1000).toFixed(2)}s`,
            ];

            if (git) {
                lines.push('');
                lines.push(git.success
                    ? `🔀 **GitHub:** ${git.message}`
                    : `⚠️  **GitHub:** ${git.message}`
                );
            }

            return { content: [{ type: 'text', text: lines.join('\n') }] };
        }
    );

    // ── get_report ────────────────────────────────────────────────────────
    server.tool(
        'get_report',
        'Fetch the raw Playwright stdout/stderr for a test run. ' +
        'Use this when run_test shows failures and you need the full output to diagnose.',
        {
            testId: z.string().describe('The testId of the run to inspect'),
        },
        async ({ testId }) => {
            const result = await getTestStatus({ testId });

            if (!result.success) {
                return {
                    content: [{ type: 'text', text: `❌ Report not found:\n${result.error}` }],
                    isError: true,
                };
            }

            return { content: [{ type: 'text', text: result.data }] };
        }
    );
}