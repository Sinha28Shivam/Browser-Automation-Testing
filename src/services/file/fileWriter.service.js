import fs from 'fs/promises';
import path from 'path';
import { PATHS } from '../../constants/paths.constant.js';

export const writeTestFile = async (testId, content) => {
    const fileName = `${testId}.spec.js`;
    
    const absolutePath = path.resolve(process.cwd(), PATHS.GENERATED_TESTS);
    const filePath = path.join(absolutePath, fileName);

    await fs.mkdir(absolutePath, { recursive: true });
    await fs.writeFile(filePath, content);

    return {
        fileName,
        filePath
    };
};
