#!/usr/bin/env node
// Arcade Telemetry MCP connector (stdio).
// Lets an agent read and edit the local dashboard definition (dashboard.json).
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  DASHBOARD_URL,
  VIZ_TYPES,
  loadEvents,
  readDashboard,
  uniquePanelId,
  writeDashboard,
} from "../lib/store.js";

const METRIC_DESCRIPTIONS = {
  session_start: "A player started a game session.",
  error: "An uncaught client-side error was reported.",
  ttff_ms: "Time-to-first-frame in milliseconds, measured from game mount to the first rendered frame.",
};

const QUERY_HELP =
  "Query syntax: `metric=<name> | where <field> = <value or $variable> | <agg> by <field>`, " +
  "where <agg> is one of count, avg, sum, min, max, p50, p90, p95 (numeric aggs use the event's `value`). " +
  "Use dashboard variables (e.g. $app_version) so panels follow the dashboard's version picker. " +
  "Call get_dashboard to see existing panels for examples.";

const json = (value) => ({ content: [{ type: "text", text: JSON.stringify(value, null, 2) }] });
const text = (value) => ({ content: [{ type: "text", text: value }] });
const fail = (message) => ({ content: [{ type: "text", text: message }], isError: true });

const server = new McpServer({ name: "arcade-telemetry", version: "1.0.0" });

server.registerTool(
  "get_dashboard",
  {
    title: "Get dashboard",
    description:
      "Return the Arcade Telemetry 'Game Health' dashboard definition: title, dashboard variables, and every panel (id, title, viz, width, query). " +
      `The live dashboard is served at ${DASHBOARD_URL}.`,
    inputSchema: {},
  },
  async () => json({ url: DASHBOARD_URL, ...readDashboard() }),
);

server.registerTool(
  "list_metrics",
  {
    title: "List metrics",
    description: "List the metric names that can be queried on the Arcade Telemetry dashboard.",
    inputSchema: {},
  },
  async () => {
    const names = [...new Set(loadEvents().map((e) => e.metric))].sort();
    return json(names.map((name) => ({ name, description: METRIC_DESCRIPTIONS[name] ?? "" })));
  },
);

server.registerTool(
  "add_panel",
  {
    title: "Add panel",
    description: `Add a new panel to the Arcade Telemetry dashboard. ${QUERY_HELP}`,
    inputSchema: {
      title: z.string().min(1).describe("Panel title"),
      query: z.string().min(1).describe("Panel query, e.g. metric=session_start | where version = $app_version | count by game"),
      viz: z.enum(VIZ_TYPES).describe("Visualization type"),
      width: z.number().int().min(2).max(12).optional().describe("Grid width in columns out of 12 (default 6, stats default 3)"),
      unit: z.string().optional().describe("Optional display unit, e.g. ms"),
    },
  },
  async ({ title, query, viz, width, unit }) => {
    const dashboard = readDashboard();
    const panel = { id: uniquePanelId(dashboard, title), title, viz, width: width ?? (viz === "stat" ? 3 : 6), query };
    if (unit) panel.unit = unit;
    dashboard.panels.push(panel);
    writeDashboard(dashboard);
    return text(`Added panel '${title}' (id: ${panel.id}) to '${dashboard.title}'. View it at ${DASHBOARD_URL}`);
  },
);

server.registerTool(
  "update_panel",
  {
    title: "Update panel",
    description: `Update an existing panel on the Arcade Telemetry dashboard by id. Only provided fields change. ${QUERY_HELP}`,
    inputSchema: {
      id: z.string().min(1).describe("Panel id (from get_dashboard)"),
      title: z.string().min(1).optional(),
      query: z.string().min(1).optional(),
      viz: z.enum(VIZ_TYPES).optional(),
      width: z.number().int().min(2).max(12).optional(),
      unit: z.string().optional(),
    },
  },
  async ({ id, ...changes }) => {
    const dashboard = readDashboard();
    const panel = dashboard.panels.find((p) => p.id === id);
    if (!panel) return fail(`No panel with id '${id}'. Existing ids: ${dashboard.panels.map((p) => p.id).join(", ")}`);
    for (const [k, v] of Object.entries(changes)) if (v !== undefined) panel[k] = v;
    writeDashboard(dashboard);
    return text(`Updated panel '${panel.title}' (id: ${id}). View it at ${DASHBOARD_URL}`);
  },
);

server.registerTool(
  "remove_panel",
  {
    title: "Remove panel",
    description: "Remove a panel from the Arcade Telemetry dashboard by id.",
    inputSchema: { id: z.string().min(1).describe("Panel id (from get_dashboard)") },
  },
  async ({ id }) => {
    const dashboard = readDashboard();
    const idx = dashboard.panels.findIndex((p) => p.id === id);
    if (idx === -1) return fail(`No panel with id '${id}'.`);
    const [removed] = dashboard.panels.splice(idx, 1);
    writeDashboard(dashboard);
    return text(`Removed panel '${removed.title}' (id: ${id}).`);
  },
);

await server.connect(new StdioServerTransport());
