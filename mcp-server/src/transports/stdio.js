/**
 * stdio transport — used by Claude Desktop.
 * Claude Desktop launches this process directly and communicates over stdin/stdout.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerTools } from '../tooldefinitions.js';

export async function startStdio() {
    const server = new McpServer({
        name: 'playwright-test-server',
        version: '2.0.0',
    });

    registerTools(server);

    const transport = new StdioServerTransport();
    await server.connect(transport);

    // Write to stderr so it doesn't pollute the stdio MCP channel
    console.error('[MCP] stdio transport ready — waiting for Claude Desktop');
}