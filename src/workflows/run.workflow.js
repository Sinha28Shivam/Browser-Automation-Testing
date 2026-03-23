import { runPlaywrightTest } from '../services/execution/playwrightRunner.service.js';
import { parseExecutionReport } from '../services/reportParser.service.js';
import { analyzeFailure } from '../services/ai/failureAnalyzer.service.js';
import { commitGeneratedTest } from '../services/github/githubCommit.service.js';
import {logInfo, logError} from '../utils/logger.js';

export async function runTestWorkflow(filePath, testId) {
    logInfo(`Starting test workflow for testId: ${testId}`);

    const execution = await runPlaywrightTest(filePath, testId);
    const report = parseExecutionReport(execution.stdout);

    logInfo(`Test result: ${report.totalTests} total, ${report.failedTests} failed`);

    if (report.failedTests === 0 && report.totalTests > 0) {
        try {
            await commitGeneratedTest(filePath, testId);
            logInfo(`Test passed and committed to GitHub: ${testId}`);
        } catch (err) {
            logError(`GitHub push failed: ${err.message}`);
        }
    }

    if (report.failedTests > 0) {
        try {
            const analysis = await analyzeFailure(report, execution.stderr);
            report.aiAnalysis = analysis;
        } catch (err) {
            logError(`AI analysis failed: ${err.message}`);
            report.aiAnalysis = 'Analysis unavailable.';
        }
    }

    return { report, execution };
}