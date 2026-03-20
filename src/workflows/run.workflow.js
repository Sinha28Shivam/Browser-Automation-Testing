import { runPlaywrightTest } from '../services/execution/playwrightRunner.service.js';
import { parseExecutionReport } from '../services/reportParser.service.js';
import { commitGeneratedTest } from '../services/github/githubCommit.service.js';


export const runTestWorkflow = async (filePath, testId) => {
    const execution = await runPlaywrightTest(filePath);
    const report = parseExecutionReport(execution.stdout);

    let git = null;
    if(report.status === 'PASSED') {
        git = await commitGeneratedTest(filePath, testId);
    }

    return {
        execution,
        report,
        git
    };
};