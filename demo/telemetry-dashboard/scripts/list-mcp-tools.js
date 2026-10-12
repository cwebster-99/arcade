// Spawns the MCP server over stdio and lists its tools (smoke test).
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const serverPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "mcp-server", "server.js");
const client = new Client({ name: "arcade-telemetry-smoke-test", version: "1.0.0" });
await client.connect(new StdioClientTransport({ command: process.execPath, args: [serverPath] }));

const { tools } = await client.listTools();
console.log(`MCP server: ${serverPath}`);
for (const t of tools) console.log(`  - ${t.name}: ${t.description.split(". ")[0]}`);

const metrics = await client.callTool({ name: "list_metrics", arguments: {} });
console.log("\nlist_metrics →", metrics.content[0].text.replace(/\s+/g, " "));

await client.close();
