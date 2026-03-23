/**
 * HTTP transport — used by web claude.ai via ngrok.
 *
 * Endpoint layout:
 *   POST /mcp    <- MCP messages from Claude
 *   GET  /mcp    <- SSE stream for server-push
 *   GET  /health <- uptime check
 */

import express from 'express';
import { randomUUID } from 'crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { registerTools } from '../tooldefinitions.js';

const PORT = parseInt(process.env.MCP_HTTP_PORT || '3100', 10);

export async function startHttp() {
    const app = express();
    app.use(express.json());

    // Maps sessionId -> { mcpServer, transport }
    const sessions = new Map();

    function createMcpServer() {
        const mcpServer = new McpServer({
            name: 'playwright-test-server',
            version: '2.0.0',
        });
        registerTools(mcpServer);
        return mcpServer;
    }

    // Health check
    app.get('/health', (_req, res) => {
        res.json({ ok: true, transport: 'http', sessions: sessions.size });
    });

    // MCP endpoint
    app.all('/mcp', async (req, res) => {
        try {
            const sessionId = req.headers['mcp-session-id'];

            // New session — only POST allowed for init
            if (!sessionId || !sessions.has(sessionId)) {
                if (req.method !== 'POST') {
                    res.status(400).json({ error: 'Send a POST request to initialise a session first' });
                    return;
                }

                const newSessionId = randomUUID();

                // Declare mcpServer BEFORE transport so the onsessioninitialized
                // closure can reference it safely (fixes TDZ error)
                const mcpServer = createMcpServer();

                const transport = new StreamableHTTPServerTransport({
                    sessionIdGenerator: () => newSessionId,
                    onsessioninitialized: (sid) => {
                        console.log(`[MCP HTTP] Session initialised: ${sid}`);
                        sessions.set(sid, { mcpServer, transport });
                    },
                });

                transport.onclose = () => {
                    console.log(`[MCP HTTP] Session closed: ${newSessionId}`);
                    sessions.delete(newSessionId);
                };

                await mcpServer.connect(transport);
                await transport.handleRequest(req, res, req.body);
                return;
            }

            // Existing session
            const { transport } = sessions.get(sessionId);
            await transport.handleRequest(req, res, req.body);

        } catch (err) {
            console.error('[MCP HTTP] Error:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: err.message });
            }
        }
    });

    // Start listening — wrapped in a Promise so startHttp() does NOT return
    // until the server is closed (keeps the process alive)
    await new Promise((resolve, reject) => {
        const httpServer = app.listen(PORT, () => {
            console.log(`[MCP HTTP] Server listening on http://localhost:${PORT}/mcp`);
            console.log(`[MCP HTTP] Health check:      http://localhost:${PORT}/health`);
        });
        httpServer.on('error', reject);
        // Never calls resolve() — intentionally blocks here to keep process alive
    });
}