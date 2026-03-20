import { successResponse } from "../utils/responseFormatter.js";
import { logInfo } from "../utils/logger.js";
import { createTestWorkflow  } from "../workflows/test.workflow.js";
import { runTestWorkflow } from "../workflows/run.workflow.js";

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
        const { filePath, testId } = req.body;

        const result = await runTestWorkflow(filePath, testId);

        return res.status(200).json(
            successResponse('Test execution completed', result)
        )
    }catch(error){
        next(error);
    }
}