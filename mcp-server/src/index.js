/**
 * Dual-transport MCP server
 *
 * Usage:
 *   node src/index.js --transport=stdio    <- Claude Desktop
 *   node src/index.js --transport=http     <- Web claude.ai via ngrok
 *
 * The transport flag can also be set via the TRANSPORT env var.
 */

import dotenv from 'dotenv';
dotenv.config();

const argTransport = process.argv.find(a => a.startsWith('--transport='))?.split('=')[1];
const TRANSPORT    = argTransport || process.env.TRANSPORT || 'stdio';

if (TRANSPORT === 'stdio') {
    const { startStdio } = await import('./transports/stdio.js');
    await startStdio();
} else if (TRANSPORT === 'http') {
    const { startHttp } = await import('./transports/http.js');
    await startHttp();
} else {
    console.error(`[MCP] Unknown transport: "${TRANSPORT}". Use --transport=stdio or --transport=http`);
    process.exit(1);
}