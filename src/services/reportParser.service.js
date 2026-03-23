import { logError, logInfo } from '../utils/logger.js';

/**
 * Playwright writes JSON to stdout when --reporter=json is set,
 * but may also write progress/warning lines before the JSON blob.
 * We extract the first complete JSON object from the output.
 */
function extractJson(stdout) {
    if (!stdout) return null;

    // Find the first '{' that starts the JSON report
    const start = stdout.indexOf('{');
    if (start === -1) return null;

    // Find the matching closing brace by tracking depth
    let depth = 0;
    let end   = -1;

    for (let i = start; i < stdout.length; i++) {
        if (stdout[i] === '{') depth++;
        else if (stdout[i] === '}') {
            depth--;
            if (depth === 0) {
                end = i;
                break;
            }
        }
    }

    if (end === -1) return null;

    return stdout.slice(start, end + 1);
}

export const parseExecutionReport = (stdout) => {
    try {
        const jsonStr = extractJson(stdout);

        if (!jsonStr) {
            logError('No JSON found in Playwright stdout');
            return buildUnknownReport('No JSON output from Playwright');
        }

        const report = JSON.parse(jsonStr);

        const stats = report.stats || {};

        const totalTests  = (stats.expected   ?? 0) + (stats.unexpected ?? 0) + (stats.skipped ?? 0);
        const failedTests = stats.unexpected  ?? 0;
        const skippedTests = stats.skipped    ?? 0;
        const duration    = stats.duration    ?? 0;
        const status      = failedTests === 0 && totalTests > 0 ? 'PASSED' : 'FAILED';

        // Collect failed test details from the nested suite structure
        const failedDetails = [];
        collectFailures(report.suites || [], failedDetails);

        logInfo(`Report parsed: ${status} — ${totalTests} total, ${failedTests} failed`);

        return {
            status,
            duration,
            totalTests,
            failedTests,
            skippedTests,
            failedDetails,
        };

    } catch (err) {
        logError(`Failed to parse Playwright report: ${err.message}`);
        return buildUnknownReport(err.message);
    }
};

function collectFailures(suites, out) {
    for (const suite of suites) {
        // Recurse into nested suites
        if (suite.suites?.length) {
            collectFailures(suite.suites, out);
        }
        for (const spec of (suite.specs || [])) {
            if (!spec.ok) {
                out.push({
                    title: spec.title,
                    error: spec.tests?.[0]?.results?.[0]?.errors?.[0]?.message || 'Unknown error',
                });
            }
        }
    }
}

function buildUnknownReport(reason) {
    return {
        status: 'UNKNOWN',
        duration: 0,
        totalTests: 0,
        failedTests: 0,
        skippedTests: 0,
        failedDetails: [{ title: 'parse error', error: reason }],
    };
}