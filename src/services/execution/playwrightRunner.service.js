import { spawn } from 'child_process';
import path from 'path';
import { logInfo, logError } from '../../utils/logger.js';

export const runPlaywrightTest = (filePath) => {
    return new Promise((resolve, reject) => {
        logInfo(`Executing Playwright test: ${filePath}`);

        const normalizePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');

        logInfo(`Normalized test file path: ${normalizePath}`);

        const runner = spawn('cmd', [
    '/c',
    'npx',
    'playwright',
    'test',
    normalizePath,
    '--reporter=json',
    '--headed'

], {
            shell: true,
        });

        let stdout = '';
        let stderr = '';

        runner.stdout.on('data', (data) => {
            const output = data.toString();
            stdout += output;
            logInfo(output);
        });

        runner.stderr.on('data', (data) => {
            const output = data.toString();
            stderr += output;
            logError(output);
        });

        runner.on('close', (code) => {
            logInfo(`Playwright process finished with code ${code}`);
            if (code === 0) {
                resolve({
                    success: true,
                    stdout,
                    stderr
                });
            } else {
                resolve({
                    success: false,
                    stdout,
                    stderr,
                    error: `Process exited with code ${code}`
                });
            }
        });

        runner.on('error', (err) => {
            logError(err.message);
            reject(err);
        });
    });
};