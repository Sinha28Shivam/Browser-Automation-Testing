import fs from 'fs';
import path from 'path';

export const createArtifactFolder = (testId) => {
    const folderPath = path.join('runtime', 'artifacts', testId);

    if(!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }
    return folderPath;
}