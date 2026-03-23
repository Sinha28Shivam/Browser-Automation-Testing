import { successResponse } from "../utils/responseFormatter.js";
import { logInfo } from "../utils/logger.js";
import { createTestWorkflow  } from "../workflows/test.workflow.js";
import { runTestWorkflow } from "../workflows/run.workflow.js";
// import { report, stderr, stdout } from "process";

const executionLogs = new Map();

export const createTest = async (req, res, next) => {
    try {

        logInfo('Received test creation request');
        const result = await createTestWorkflow (req.body);

        return res.status(200).json(
            successResponse('Test request received', result)
        );
    }catch(error){
        next(error);
    }
};

export const runTest = async (req, res, next) => {
    try {
        const { filepPath, testId } = req.body;

        if(!filepPath || !testId) {
            return res.status(400).json({ 
                success: false,
                message: 'FIlepath and testId are required'
            });
        }

        const result = await runTestWorkflow(filepPath, testId);

        executionLogs.set(testId, {
            report: result.report,
            stdout: result.execution?.stdout || '';
            stderr: result.execution?.stderr || '';
        });

        return res.status(200).json(
            successResponse('Test execution completed', result)
        );
    }catch(error){
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