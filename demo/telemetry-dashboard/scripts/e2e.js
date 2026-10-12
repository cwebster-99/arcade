// End-to-end dry run of the demo flow (requires `npm start` running).
// 1. Adds a session-ready panel via MCP using the legacy `version` field -> panel renders an error.
// 2. Fixes the query to `app_version` -> panel renders data.
// 3. POSTs an /ingest event, then resets the dashboard.
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { DASHBOARD_URL, resetDashboard } from "../lib/store.js";

const serverPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "mcp-server", "server.js");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const render = async () => (await fetch(`${DASHBOARD_URL}api/render?var-app_version=1.1.28`)).json();

const client = new Client({ name: "copilot-app-telemetry-e2e", version: "1.0.0" });
await client.connect(new StdioClientTransport({ command: process.execPath, args: [serverPath] }));

try {
  const added = await client.callTool({
    name: "add_panel",
    arguments: {
      title: "Session ready p95 by operation",
      viz: "bar",
      query: "metric=session_ready_ms | where version = $app_version | p95 by operation",
    },
  });
  assert.ok(!added.isError, "add_panel must not reject the legacy field");
  console.log("add_panel  →", added.content[0].text);
  await sleep(500);

  let panel = (await render()).panels.find((p) => p.id === "session-ready-p95-by-operation");
  assert.equal(panel.error, "No data — unknown field 'version' for metric session_ready_ms (did you mean app_version?)");
  console.log("render     →", panel.error);

  await client.callTool({
    name: "update_panel",
    arguments: { id: "session-ready-p95-by-operation", query: "metric=session_ready_ms | where app_version = $app_version | p95 by operation" },
  });
  await sleep(500);
  panel = (await render()).panels.find((p) => p.id === "session-ready-p95-by-operation");
  assert.ok(!panel.error && panel.result.rows.length === 2);
  console.log("render     →", panel.result.rows.map((r) => `${r.key}=${Math.round(r.value)}ms`).join(", "));

  const ingest = await fetch(`${DASHBOARD_URL}ingest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ metric: "session_ready_ms", operation: "resume", os_platform: "windows", session_type: "local", outcome: "ready", value: 1234, app_version: "1.1.28" }),
  });
  assert.equal(ingest.status, 202);
  console.log("ingest     →", ingest.status, await ingest.json());
  console.log("\n✅ Demo flow verified.");
} finally {
  await client.close();
  resetDashboard();
  console.log("Dashboard reset to pre-demo state.");
}
