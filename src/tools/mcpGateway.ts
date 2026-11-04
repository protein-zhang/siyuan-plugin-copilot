import { AVAILABLE_TOOLS, TOOL_DISPLAY_NAMES, executeToolCall, type ToolCall } from './index';
import { filterSelectedTool, type ToolConfig } from './toolSelection';
import { settingsStore } from '../stores/settings';
import { get } from 'svelte/store';

const MCP_PORT = 17331;
const MCP_PATH = '/mcp';
const MCP_PROTOCOL_VERSION = '2025-06-18';
const MAX_REQUEST_BYTES = 1024 * 1024;

interface GatewayHost {
    loadSettings: () => Promise<any>;
    saveSettings: (settings: any) => Promise<any>;
}

interface JsonRpcRequest {
    jsonrpc?: string;
    id?: string | number | null;
    method?: string;
    params?: any;
}

function getNodeRequire(): ((name: string) => any) | null {
    try {
        const nodeRequire = (window as any)?.require;
        return typeof nodeRequire === 'function' ? nodeRequire : null;
    } catch {
        return null;
    }
}

function asText(value: unknown): string {
    if (typeof value === 'string') return value;
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
}

function rpcError(id: JsonRpcRequest['id'], code: number, message: string) {
    return { jsonrpc: '2.0', id: id ?? null, error: { code, message } };
}

/**
 * Desktop-only, loopback-bound Streamable HTTP MCP server. The bearer token and
 * allow-list live in the regular plugin settings; the server never binds to LAN.
 */
export class CopilotMcpGateway {
    private server: any = null;
    private status = 'stopped';
    private error = '';

    getStatus() {
        return { status: this.status, error: this.error, port: MCP_PORT };
    }

    getLocalEndpoint() {
        return `http://127.0.0.1:${MCP_PORT}${MCP_PATH}`;
    }

    async start(host: GatewayHost): Promise<void> {
        if (this.server) return;

        const nodeRequire = getNodeRequire();
        if (!nodeRequire) {
            this.status = 'unsupported';
            this.error = 'The MCP listener requires SiYuan Desktop (Electron).';
            return;
        }

        try {
            const settings = await host.loadSettings();
            if (!settings.mcpAuthToken) {
                settings.mcpAuthToken = nodeRequire('crypto').randomBytes(32).toString('hex');
                await host.saveSettings(settings);
            }

            const http = nodeRequire('http');
            const server = http.createServer((req: any, res: any) => {
                void this.handleRequest(req, res);
            });
            this.server = server;
            this.status = 'starting';
            this.error = '';

            await new Promise<void>((resolve) => {
                let settled = false;
                const finish = () => {
                    if (settled) return;
                    settled = true;
                    resolve();
                };

                server.on('error', (error: any) => {
                    this.server = null;
                    this.status = 'error';
                    this.error = error?.code === 'EADDRINUSE'
                        ? `Port ${MCP_PORT} is already in use.`
                        : String(error?.message || error);
                    console.error('[Copilot MCP] HTTP server error:', error);
                    finish();
                });
                server.listen(MCP_PORT, '127.0.0.1', () => {
                    this.status = 'listening';
                    this.error = '';
                    console.info(`[Copilot MCP] Listening on ${this.getLocalEndpoint()}`);
                    finish();
                });
            });
        } catch (error) {
            this.server = null;
            this.status = 'error';
            this.error = error instanceof Error ? error.message : String(error);
            console.error('[Copilot MCP] Failed to start:', error);
        }
    }

    stop(): Promise<void> {
        const server = this.server;
        this.server = null;
        this.status = 'stopped';
        if (!server) return Promise.resolve();

        return new Promise<void>((resolve) => {
            const timer = setTimeout(resolve, 2000);
            try {
                if (typeof server.closeAllConnections === 'function') {
                    server.closeAllConnections();
                }
                server.close(() => {
                    clearTimeout(timer);
                    resolve();
                });
            } catch (error) {
                console.warn('[Copilot MCP] Failed to close server:', error);
                clearTimeout(timer);
                resolve();
            }
        });
    }

    async restart(host: GatewayHost): Promise<void> {
        await this.stop();
        await this.start(host);
    }

    private writeJson(res: any, statusCode: number, body: any, protocolVersion?: string) {
        res.statusCode = statusCode;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, MCP-Protocol-Version');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        if (protocolVersion) res.setHeader('MCP-Protocol-Version', protocolVersion);
        res.end(JSON.stringify(body));
    }

    private async readBody(req: any): Promise<any> {
        return await new Promise((resolve, reject) => {
            let raw = '';
            let size = 0;
            let oversized = false;
            req.on('data', (chunk: any) => {
                size += chunk.length;
                if (size > MAX_REQUEST_BYTES) {
                    oversized = true;
                    return;
                }
                if (!oversized) raw += chunk.toString('utf8');
            });
            req.on('end', () => {
                if (oversized) {
                    reject(new Error('Request body exceeds 1 MiB.'));
                    return;
                }
                try { resolve(JSON.parse(raw || '{}')); }
                catch { reject(new Error('Invalid JSON request body.')); }
            });
            req.on('error', reject);
        });
    }

    private async handleRequest(req: any, res: any): Promise<void> {
        if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, MCP-Protocol-Version');
            res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
            res.end();
            return;
        }
        if (req.url?.split('?')[0] !== MCP_PATH) {
            this.writeJson(res, 404, { error: 'Not found' });
            return;
        }
        if (req.method !== 'POST') {
            res.setHeader('Allow', 'POST, OPTIONS');
            this.writeJson(res, 405, { error: 'Use MCP Streamable HTTP POST.' });
            return;
        }

        const settings = get(settingsStore) || {};
        const token = String(settings.mcpAuthToken || '');
        const authorization = String(req.headers?.authorization || '');
        const suppliedToken = authorization.startsWith('Bearer ')
            ? authorization.slice(7).trim()
            : '';
        let authorized = false;
        try {
            const crypto = getNodeRequire()?.('crypto');
            const left = Buffer.from(token);
            const right = Buffer.from(suppliedToken);
            authorized = !!token && left.length === right.length && crypto.timingSafeEqual(left, right);
        } catch {
            authorized = false;
        }
        if (!authorized) {
            this.writeJson(res, 401, { error: 'Unauthorized. Supply the configured Bearer token.' });
            return;
        }

        let payload: any;
        try {
            payload = await this.readBody(req);
        } catch (error) {
            this.writeJson(res, 400, { error: error instanceof Error ? error.message : String(error) });
            return;
        }

        const requestedVersion = String(req.headers?.['mcp-protocol-version'] || '');
        const processOne = async (message: JsonRpcRequest) => {
            if (!message || message.jsonrpc !== '2.0' || typeof message.method !== 'string') {
                return rpcError(message?.id, -32600, 'Invalid JSON-RPC request.');
            }
            const id = message.id;
            const isNotification = id === undefined;
            const currentSettings = get(settingsStore) || {};
            const isEnabled = currentSettings.mcpModeEnabled === true;

            if (message.method === 'notifications/initialized' || message.method.startsWith('notifications/')) {
                return null;
            }
            if (message.method === 'ping') {
                return { jsonrpc: '2.0', id, result: {} };
            }
            if (message.method === 'initialize') {
                const clientVersion = String(message.params?.protocolVersion || MCP_PROTOCOL_VERSION);
                const supported = new Set([MCP_PROTOCOL_VERSION, '2025-03-26', '2024-11-05']);
                if (!supported.has(clientVersion)) {
                    return rpcError(id, -32602, `Unsupported protocol version: ${clientVersion}`);
                }
                return {
                    jsonrpc: '2.0',
                    id,
                    result: {
                        protocolVersion: clientVersion,
                        capabilities: { tools: { listChanged: false }, resources: {} },
                        serverInfo: { name: 'siyuan-plugin-copilot', version: '2.9.0' },
                        instructions: 'Read mcp-gateway://about first. Only the tools returned by tools/list are authorized for this connection.',
                    },
                };
            }
            if (message.method === 'resources/list') {
                return {
                    jsonrpc: '2.0', id,
                    result: {
                        resources: [{
                            uri: 'mcp-gateway://about',
                            name: 'Copilot MCP usage and safety guide',
                            description: 'How to use the currently exposed SiYuan Copilot tools safely.',
                            mimeType: 'text/markdown',
                        }],
                    },
                };
            }
            if (message.method === 'resources/read') {
                if (message.params?.uri !== 'mcp-gateway://about') {
                    return rpcError(id, -32602, 'Unknown resource URI.');
                }
                return {
                    jsonrpc: '2.0', id,
                    result: { contents: [{
                        uri: 'mcp-gateway://about',
                        mimeType: 'text/markdown',
                        text: [
                            '# SiYuan Copilot MCP gateway',
                            '',
                            '- `tools/list` is the authoritative allow-list. Do not call tools that are not listed.',
                            '- Tool arguments and action choices are restricted by the owner’s MCP tool selector.',
                            '- Before writing, deleting, moving, or executing code/commands, explain the intended change and obtain the user’s confirmation in your host agent UI.',
                            '- Do not infer note contents or identifiers; use the exposed read/search tools first.',
                            '- The `question` tool needs the Copilot UI and is not suitable for external MCP calls.',
                        ].join('\n'),
                    }] },
                };
            }
            if (message.method === 'tools/list') {
                if (!isEnabled) return { jsonrpc: '2.0', id, result: { tools: [] } };
                const selected: ToolConfig[] = Array.isArray(currentSettings.mcpSelectedTools)
                    ? currentSettings.mcpSelectedTools
                    : [];
                const selectedByName = new Map(selected.map(item => [item.name, item]));
                const tools = AVAILABLE_TOOLS.flatMap(tool => {
                    const config = selectedByName.get(tool.function.name);
                    if (!config) return [];
                    if (tool.function.name === 'question') return [];
                    const filtered = filterSelectedTool(tool, config);
                    if (!filtered) return [];
                    const name = filtered.function.name;
                    return [{
                        name,
                        title: TOOL_DISPLAY_NAMES[name] || name,
                        description: filtered.function.description,
                        inputSchema: filtered.function.parameters,
                    }];
                });
                return { jsonrpc: '2.0', id, result: { tools } };
            }
            if (message.method === 'tools/call') {
                if (!isEnabled) return rpcError(id, -32003, 'Switch Copilot to MCP mode before calling tools.');
                const name = String(message.params?.name || '');
                const args = message.params?.arguments ?? {};
                const selected: ToolConfig[] = Array.isArray(currentSettings.mcpSelectedTools)
                    ? currentSettings.mcpSelectedTools
                    : [];
                const allowed = new Set(selected.map(item => item.name));
                if (!allowed.has(name) || name === 'question') {
                    return rpcError(id, -32001, 'Tool is not enabled for MCP exposure.');
                }
                const call: ToolCall = {
                    id: `mcp_${Date.now()}`,
                    type: 'function',
                    function: { name, arguments: JSON.stringify(args) },
                };
                const result = await executeToolCall(call, allowed, undefined, selected);
                return {
                    jsonrpc: '2.0', id,
                    result: { content: [{ type: 'text', text: asText(result) }], isError: false },
                };
            }
            if (isNotification) return null;
            return rpcError(id, -32601, `Method not found: ${message.method}`);
        };

        const version = requestedVersion || MCP_PROTOCOL_VERSION;
        try {
            if (Array.isArray(payload)) {
                const results = (await Promise.all(payload.map(processOne))).filter(Boolean);
                if (results.length === 0) {
                    res.statusCode = 202;
                    res.end();
                } else {
                    this.writeJson(res, 200, results, version);
                }
                return;
            }
            const result = await processOne(payload);
            if (result === null) {
                res.statusCode = 202;
                res.end();
            } else {
                this.writeJson(res, 200, result, version);
            }
        } catch (error) {
            this.writeJson(res, 200, rpcError(payload?.id, -32603, error instanceof Error ? error.message : String(error)), version);
        }
    }
}

export const copilotMcpGateway = new CopilotMcpGateway();
