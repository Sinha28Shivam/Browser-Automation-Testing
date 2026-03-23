import { spawn } from 'child_process';
import { logInfo, logError } from '../../utils/logger.js';



function runCommand(command, args = []) {
    return new Promise((resolve, reject) => {
        logInfo(`Git: ${command} ${args.join(' ')}`);
 
        const proc = spawn(command, args, {
            shell: true,
            env: { ...process.env },
        });
 
        let stdout = '';
        let stderr = '';
 
        proc.stdout.on('data', (d) => { stdout += d.toString(); });
        proc.stderr.on('data', (d) => { stderr += d.toString(); });
 
        proc.on('close', (code) => {
            resolve({ code, stdout: stdout.trim(), stderr: stderr.trim() });
        });
 
        proc.on('error', reject);
    });
}
 


export const commitGeneratedTest = async (filePath, testId) => {
    try {
        // 1. Stage the generated test file
        const add = await runCommand('git', ['add', filePath]);
        if (add.code !== 0) {
            logError(`git add failed: ${add.stderr}`);
            return {
                success: false,
                message: `git add failed: ${add.stderr}`,
                stdout: add.stdout,
                stderr: add.stderr,
            };
        }
 
        // 2. Commit
        const message = `test: add generated Playwright test ${testId}`;
        const commit = await runCommand('git', ['commit', '-m', `"${message}"`]);
 
        // exit code 1 with "nothing to commit" is not a real error
        const nothingToCommit = commit.stdout.includes('nothing to commit')
            || commit.stderr.includes('nothing to commit');
 
        if (commit.code !== 0 && !nothingToCommit) {
            logError(`git commit failed: ${commit.stderr}`);
            return {
                success: false,
                message: `git commit failed: ${commit.stderr}`,
                stdout: commit.stdout,
                stderr: commit.stderr,
            };
        }
 
        if (nothingToCommit) {
            logInfo('Nothing new to commit — file already committed.');
            return {
                success: true,
                message: 'Nothing to commit (already up to date)',
                stdout: commit.stdout,
                stderr: commit.stderr,
            };
        }
 
        // 3. Push
        const push = await runCommand('git', ['push']);
        if (push.code !== 0) {
            logError(`git push failed: ${push.stderr}`);
            return {
                success: false,
                message: `Committed but push failed: ${push.stderr}`,
                stdout: push.stdout,
                stderr: push.stderr,
            };
        }
 
        logInfo(`Successfully committed and pushed test ${testId}`);
        return {
            success: true,
            message: `Committed and pushed: "${message}"`,
            stdout: push.stdout,
            stderr: push.stderr,
        };
 
    } catch (err) {
        logError(`Git operation threw: ${err.message}`);
        return {
            success: false,
            message: err.message,
            stdout: '',
            stderr: '',
        };
    }
};
