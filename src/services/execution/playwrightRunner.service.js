import { spawn } from 'child_process';
import path from 'path';
import { logInfo, logError } from '../../utils/logger.js';

// ─────────────────────────────────────────────
// Cross-platform Playwright test runner
// Works on Windows, macOS, and Linux
// ─────────────────────────────────────────────
export const runPlaywrightTest = (filePath) => {
    return new Promise((resolve, reject) => {
        logInfo(`Executing Playwright test: ${filePath}`);

        const normalizePath = path
            .relative(process.cwd(), filePath)
            .replace(/\\/g, '/');

        logInfo(`Normalized path: ${normalizePath}`);

        const isWindows = process.platform === 'win32';

        // On Windows we need cmd /c to resolve npx from PATH
        const command = isWindows ? 'cmd' : 'npx';
        const args    = isWindows
            ? ['/c', 'npx', 'playwright', 'test', normalizePath, '--reporter=json', '--headed']
            : ['playwright', 'test', normalizePath, '--reporter=json', '--headed'];

        logInfo(`Running: ${command} ${args.join(' ')}`);

        const runner = spawn(command, args, {
            shell: true,
            // inherit the current process env so Playwright can find browsers
            env: { ...process.env },
        });

        let stdout = '';
        let stderr = '';

        runner.stdout.on('data', (data) => {
            const out = data.toString();
            stdout += out;
            logInfo(out.trimEnd());
        });

        runner.stderr.on('data', (data) => {
            const out = data.toString();
            stderr += out;
            // Playwright writes progress to stderr — not always an error
            logInfo(out.trimEnd());
        });

        runner.on('close', (code) => {
            logInfo(`Playwright process exited with code ${code}`);
            // Playwright exits 0 = all passed, 1 = some failed, 2+ = config error
            // We resolve in all cases and let reportParser decide pass/fail
            resolve({
                success: code === 0,
                exitCode: code,
                stdout,
                stderr,
                error: code !== 0 ? `Process exited with code ${code}` : undefined,
            });
        });

        runner.on('error', (err) => {
            logError(`Failed to spawn Playwright: ${err.message}`);
            reject(err);
        });
    });
};