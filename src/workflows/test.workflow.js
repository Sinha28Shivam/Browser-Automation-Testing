import { createTestMetadata } from '../services/testMetadata.service.js';
import { generateTestScript } from '../services/ai/generateTest.service.js';
import { writeTestFile } from '../services/file/fileWriter.service.js';
// import { runPlaywrightTest } from '../services/execution/playwrightRunner.service.js';


export const createTestWorkflow = async (payload) => {
    const metadata = await createTestMetadata(payload);
    const script = await generateTestScript(payload, metadata.testId);
    const file = await writeTestFile(metadata.testId, script);
    // const execution = await runPlaywrightTest(file.filePath);


    return {
        ...metadata,
        file
    };
}
