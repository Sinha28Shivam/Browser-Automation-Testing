import { runPlaywrightTest } from '../services/execution/playwrightRunner.service.js';
import { parseExecutionReport } from '../services/reportParser.service.js';
import { commitGeneratedTest } from '../services/github/githubCommit.service.js';

import { analyzeFailureWithAI } from '../services/ai/claudeAnalyzer.service.js';
import { createArtifactFolder } from '../services/file/artifactFolder.service.js';

export const runTestWorkflow = async (filePath, testId) => {
    createArtifactFolder(testId);
    const execution = await runPlaywrightTest(filePath);
    const report = parseExecutionReport(execution.stdout);

    let git = null;
    if(report.status === 'PASSED') {
        git = await commitGeneratedTest(filePath, testId);
    }

    let aiAnalysis = null;
    if(report.status === 'FAILED') {
        aiAnalysis = await analyzeFailureWithAI(report, `runtime/artifacts/${testId}`);
    }

    return {
        execution,
        report,
        git,
        aiAnalysis
    };
};