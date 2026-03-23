import { successResponse } from "../utils/responseFormatter.js";
import { logInfo, logError } from "../utils/logger.js";
import { runTestWorkflow } from "../workflows/run.workflow.js";
import { createTestMetadata} from "../services/testMetadata.service.js";
import { writeTestFile } from "../services/file/fileWriter.service.js";
import { generateTestScript } from "../services/ai/generateTest.service.js";
// import { report, stderr, stdout } from "process";

const executionLogs = new Map();

export async function createTest(req, res, next) {
    try {
        const { url, title, scenario, description, selectors } = req.body;
 
        if (!url) {
            return res.status(400).json({ success: false, message: 'URL is required' });
        }
 
        logInfo('Received test creation request');
 
        // Build a normalised payload — support both payload shapes
        const payload = {
            url,
            title:     title    || 'Generated Test Suite',
            scenario:  scenario || description || 'Test the page',
            selectors: selectors || {},
        };
 
        // 1. Create metadata (generates testId)
        const metadata = await createTestMetadata(payload);
        const { testId } = metadata;
 
        logInfo(`testId: ${testId}`);
 
        // 2. Generate script via Azure AI
        const scriptContent = await generateTestScript(payload, testId);
 
        // 3. Persist to disk  (uses PATHS.GENERATED_TESTS constant)
        const file = await writeTestFile(testId, scriptContent);
        logInfo(`Test script saved: ${file.filePath}`);
 
        // 4. ✅ Auto-run Playwright immediately after generation
        logInfo(`Auto-running Playwright for testId: ${testId}`);
        const result = await runTestWorkflow(file.filePath, testId);
 
        // 5. Cache execution logs for /api/test/report
        executionLogs.set(testId, {
            report: result.report,
            stdout: result.execution?.stdout || '',
            stderr: result.execution?.stderr || '',
        });
 
        return res.status(200).json(
            successResponse('Test generated and executed', {
                testId,
                status:  metadata.status,
                file,
                report:  result.report,
                git:     result.git,
            })
        );
    } catch (err) {
        logError(`createTest error: ${err.message}`);
        next(err);
    }
}

export const runTest = async (req, res, next) => {
    try {
        const { filePath, testId } = req.body;

        if(!filePath || !testId) {
            return res.status(400).json({ 
                success: false,
                message: 'FilePath and testId are required'
            });
        }

        const result = await runTestWorkflow(filePath, testId);

        executionLogs.set(testId, {
            report: result.report,
            stdout: result.execution?.stdout || '',
            stderr: result.execution?.stderr || ''
        });

        return res.status(200).json(
            successResponse('Test execution completed', result)
        );
    }catch(error){
        logError(`runTest error: ${error.message}`);
        next(error);
    }
};

export const getReport = async (req, res, next) => {
    try {
        const { testId } = req.body;
 
        if (!testId) {
            return res.status(400).json({ success: false, message: 'testId is required' });
        }
 
        const log = executionLogs.get(testId);
 
        if (!log) {
            return res.status(404).json({
                success: false,
                message: `No execution log found for testId: ${testId}`,
            });
        }
 
         const text = [
            `=== Report for ${testId} ===`,
            `Status:  ${log.report?.status ?? 'UNKNOWN'}`,
            `Total:   ${log.report?.totalTests ?? 0}`,
            `Failed:  ${log.report?.failedTests ?? 0}`,
            `Skipped: ${log.report?.skippedTests ?? 0}`,
            ``,
            `=== STDOUT ===`,
            log.stdout || '(empty)',
            ``,
            `=== STDERR ===`,
            log.stderr || '(empty)',
        ].join('\n');
 
        return res.status(200).json(successResponse('Report fetched', text));
    } catch (error) {
        next(error);
    }
};