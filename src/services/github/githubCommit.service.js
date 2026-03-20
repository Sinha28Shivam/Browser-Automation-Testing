import { spawn } from 'child_process';

export const commitGeneratedTest = (filePath, testId) => {
    return new Promise(( resolve, reject ) => {
        const command = `git add ${filePath} && git commit -m "Add commit passed test ${testId}"`;

        const runner = spawn('cmd', ['/c', command]);

        let stdout = '';
        let stderr = '';

        runner.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        runner.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        runner.on('close', (code) => {
            resolve({
                success: code === 0,
                message: code === 0 ? "Commited successfully" : "Commit Failed or nothing to commit",
                stdout,
                stderr
            });
        });

        runner.on('error', (error) => {
            reject(error);
        });
    });
}