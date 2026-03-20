/**
 * scripts/start-with-ngrok.js
 *
 * Starts the MCP HTTP server and ngrok tunnel together.
 * Auto-detects ngrok, kills any stale process on MCP_HTTP_PORT first.
 */

import { spawn, execSync } from 'child_process';
import { createInterface } from 'readline';
import { existsSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';
dotenv.config();

const PORT         = process.env.MCP_HTTP_PORT || '3100';
const NGROK_DOMAIN = process.env.NGROK_DOMAIN  || '';

let serverProc = null;
let ngrokProc  = null;

// ── Graceful shutdown ─────────────────────────────────────────────────────
function shutdown(signal) {
    console.log(`\n[launcher] ${signal} — shutting down`);
    serverProc?.kill();
    ngrokProc?.kill();
    process.exit(0);
}
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// ── Kill whatever is already on PORT ─────────────────────────────────────
function freePort(port) {
    try {
        if (process.platform === 'win32') {
            // Find PID listening on the port, then kill it
            const result = execSync(
                `netstat -ano | findstr "LISTENING" | findstr ":${port} "`,
                { encoding: 'utf8', stdio: ['pipe','pipe','pipe'] }
            ).trim();

            if (!result) return;

            // Last token on each line is the PID
            const pids = [...new Set(
                result.split('\n')
                      .map(l => l.trim().split(/\s+/).pop())
                      .filter(Boolean)
            )];

            for (const pid of pids) {
                try {
                    execSync(`taskkill /PID ${pid} /F`, { stdio: 'pipe' });
                    console.log(`[launcher] Killed stale process PID ${pid} on port ${port}`);
                } catch { /* already gone */ }
            }
        } else {
            execSync(`lsof -ti tcp:${port} | xargs kill -9`, { stdio: 'pipe' });
            console.log(`[launcher] Freed port ${port}`);
        }
    } catch { /* nothing was running on that port */ }
}

// ── Resolve ngrok binary ──────────────────────────────────────────────────
function resolveNgrok() {
    const isWin = process.platform === 'win32';

    if (process.env.NGROK_PATH && existsSync(process.env.NGROK_PATH)) {
        return process.env.NGROK_PATH;
    }

    try {
        const cmd    = isWin ? 'where ngrok' : 'which ngrok';
        const result = execSync(cmd, { encoding: 'utf8', stdio: ['pipe','pipe','pipe'] }).trim();
        const first  = result.split('\n')[0].trim();
        if (first && existsSync(first)) return first;
    } catch { /* not on PATH */ }

    if (isWin) {
        const home = process.env.USERPROFILE || 'C:\\Users\\Default';
        const candidates = [
            join(home, 'ngrok', 'ngrok.exe'),
            join(home, 'Downloads', 'ngrok-v3-stable-windows-amd64', 'ngrok.exe'),
            join(home, 'AppData', 'Local', 'ngrok', 'ngrok.exe'),
            join(home, 'scoop', 'shims', 'ngrok.exe'),
            'C:\\ngrok\\ngrok.exe',
            'C:\\tools\\ngrok\\ngrok.exe',
            'C:\\ProgramData\\chocolatey\\bin\\ngrok.exe',
        ];
        for (const p of candidates) {
            if (existsSync(p)) return p;
        }
    }

    console.error('\n[launcher] ngrok not found. Set NGROK_PATH in .env, e.g.:');
    console.error('[launcher]   NGROK_PATH=C:\\Users\\sinha\\Downloads\\ngrok-v3-stable-windows-amd64\\ngrok.exe\n');
    process.exit(1);
}

// ── Step 1: Free the port ─────────────────────────────────────────────────
console.log(`[launcher] Freeing port ${PORT} if in use...`);
freePort(PORT);

// Small pause so the OS releases the port before we bind again
await new Promise(r => setTimeout(r, 600));

// ── Step 2: Start MCP HTTP server ─────────────────────────────────────────
console.log(`[launcher] Starting MCP HTTP server on port ${PORT}...`);

serverProc = spawn('node', ['src/index.js', '--transport=http'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
});

serverProc.stdout.on('data', d => process.stdout.write(`[mcp]    ${d}`));
serverProc.stderr.on('data', d => process.stderr.write(`[mcp]    ${d}`));

serverProc.on('exit', (code) => {
    console.error(`[launcher] MCP server exited (code ${code})`);
    ngrokProc?.kill();
    process.exit(code ?? 1);
});

serverProc.on('error', (err) => {
    console.error(`[launcher] Failed to start MCP server: ${err.message}`);
    process.exit(1);
});

// ── Step 3: Wait for server to be ready ──────────────────────────────────
console.log('[launcher] Waiting for MCP server to be ready...');
await waitForHttp(`http://localhost:${PORT}/health`, 15_000);
console.log('[launcher] MCP server is up!');

// ── Step 4: Start ngrok ───────────────────────────────────────────────────
const ngrokBin = resolveNgrok();
console.log(`[launcher] ngrok binary: ${ngrokBin}`);

const ngrokArgs = ['http', PORT, '--log=stdout'];
if (NGROK_DOMAIN) ngrokArgs.push(`--domain=${NGROK_DOMAIN}`);

ngrokProc = spawn(ngrokBin, ngrokArgs, {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
});

ngrokProc.stderr.on('data', d => process.stderr.write(`[ngrok]  ${d}`));

ngrokProc.on('error', (err) => {
    console.error(`[launcher] Failed to start ngrok: ${err.message}`);
    serverProc?.kill();
    process.exit(1);
});

ngrokProc.on('exit', (code) => {
    if (code !== 0) {
        console.error(`[launcher] ngrok exited (code ${code})`);
        serverProc?.kill();
        process.exit(code ?? 1);
    }
});

// ── Step 5: Parse ngrok stdout for public URL ─────────────────────────────
let urlPrinted = false;

const rl = createInterface({ input: ngrokProc.stdout });
rl.on('line', (line) => {
    try {
        const entry = JSON.parse(line);
        const url   = entry.url || entry.Url;
        if (!urlPrinted && url?.startsWith('https://')) {
            urlPrinted = true;
            printBanner(`${url}/mcp`);
        }
    } catch {
        if (line.trim()) process.stdout.write(`[ngrok]  ${line}\n`);
    }
});

// ── Step 6: Fallback — poll ngrok local API ───────────────────────────────
setTimeout(async () => {
    if (urlPrinted) return;
    try {
        const res  = await fetch('http://localhost:4040/api/tunnels');
        const data = await res.json();
        const tun  = data.tunnels?.find(t => t.proto === 'https');
        if (tun?.public_url) {
            urlPrinted = true;
            printBanner(`${tun.public_url}/mcp`);
            return;
        }
    } catch { /* ignore */ }

    console.log('[launcher] Could not auto-detect ngrok URL.');
    console.log('[launcher] Open http://localhost:4040 in your browser,');
    console.log('[launcher] copy the https URL, append /mcp, paste into claude.ai.');
}, 6_000);

// ── Helpers ───────────────────────────────────────────────────────────────
async function waitForHttp(url, timeoutMs) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        try {
            const r = await fetch(url);
            if (r.ok) return;
        } catch { /* not ready yet */ }
        await new Promise(r => setTimeout(r, 400));
    }
    throw new Error(`[launcher] Timed out waiting for ${url}`);
}

function printBanner(mcpUrl) {
    const line = '─'.repeat(62);
    console.log(`\n${line}`);
    console.log('  MCP server is LIVE via ngrok');
    console.log(line);
    console.log(`  MCP URL ->  ${mcpUrl}`);
    console.log(line);
    console.log('  To connect on claude.ai:');
    console.log('  1. Open claude.ai -> Settings -> Integrations');
    console.log('  2. Click "Add integration" / "Connect more tools"');
    console.log(`  3. Paste:  ${mcpUrl}`);
    console.log('  4. Name it "Playwright Tests" -> Save');
    console.log(`${line}\n`);
}