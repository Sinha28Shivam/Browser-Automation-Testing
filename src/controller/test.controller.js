import { successResponse } from "../utils/responseFormatter.js";
import { logInfo, logError } from "../utils/logger.js";
// import { createTestWorkflow  } from "../workflows/test.workflow.js";
import { runTestWorkflow } from "../workflows/run.workflow.js";
import fs from 'fs';
import { generateTestScript } from "../services/ai/generateTest.service.js";
// import { report, stderr, stdout } from "process";

const executionLogs = new Map();

export async function createTest(req, res) {
    try {
        const { url, description } = req.body;
        if (!url) return res.status(400).json({ error: 'URL is required' });
 
        logInfo('Received test creation request');
 
        const testId = Date.now().toString();
        const filePath = `runtime/generated-tests/${testId}.spec.js`;
 
        // FIX: Pass the arguments as the single object that the service expects
        const payload = {
            url: url,
            scenario: description,
            title: "Generated Test",
            selectors: {} 
        };
        
        const scriptContent = await generateTestScript(payload, testId);
 
        // Now 'fs' will work properly
        fs.mkdirSync('runtime/generated-tests', { recursive: true });
        fs.writeFileSync(filePath, scriptContent);
 
        logInfo(`Test script saved: ${filePath}`);
 
        return res.status(200).json({ testId, filePath, message: 'Test script generated successfully' });
    } catch (err) {
        logError(`createTest error: ${err.message}`);
        return res.status(500).json({ error: err.message });
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