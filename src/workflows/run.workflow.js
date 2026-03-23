import { runPlaywrightTest } from '../services/execution/playwrightRunner.service.js';
import { parseExecutionReport } from '../services/reportParser.service.js';
import { commitGeneratedTest } from '../services/github/githubCommit.service.js';
import { createArtifactFolder } from '../services/file/artifactFolder.service.js';

// Use the same Azure AI Foundry / Llama service used for generation —
// NOT the separate Azure OpenAI service (claudeAnalyzer.service.js uses
// different env vars: AZURE_OPENAI_ENDPOINT / AZURE_OPENAI_API_KEY)
import { analyzeFailure } from '../services/ai/failureAnalyzer.service.js';

export const runTestWorkflow = async (filePath, testId) => {
    createArtifactFolder(testId);

    const execution = await runPlaywrightTest(filePath);
    const report    = parseExecutionReport(execution.stdout);

    let git       = null;
    let aiAnalysis = null;

    if (report.status === 'PASSED') {
        git = await commitGeneratedTest(filePath, testId);
    }

    if (report.status === 'FAILED') {
        aiAnalysis = await analyzeFailure(report, `runtime/artifacts/${testId}`, execution.stderr);
    }

    return {
        execution,
        report,
        git,
        aiAnalysis,
    };
};