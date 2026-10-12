import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import {
  DASHBOARD_PATH,
  INGESTED_PATH,
  PORT,
  ROOT,
  appendIngestedEvents,
  ensureDashboard,
  loadIngestedEvents,
  loadSeedEvents,
  readDashboard,
} from "./lib/store.js";
import { ALL_VALUE, QueryError, buildSchema, runQuery } from "./lib/query.js";

const PUBLIC_DIR = path.join(ROOT, "public");
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
};

ensureDashboard();
const seedEvents = loadSeedEvents();
let ingested = loadIngestedEvents();
const clients = new Set();

function allEvents() {
  return ingested.length ? seedEvents.concat(ingested) : seedEvents;
}

function broadcast(type) {
  for (const res of clients) res.write(`event: ${type}\ndata: ${Date.now()}\n\n`);
}

let lastDashboardRaw = fs.readFileSync(DASHBOARD_PATH, "utf8");
fs.watchFile(DASHBOARD_PATH, { interval: 300 }, () => {
  let raw;
  try {
    raw = fs.readFileSync(DASHBOARD_PATH, "utf8");
  } catch {
    return;
  }
  if (raw === lastDashboardRaw) return;
  lastDashboardRaw = raw;
  console.log(`[dashboard] ${path.basename(DASHBOARD_PATH)} changed — pushing refresh`);
  broadcast("dashboard");
});

fs.watchFile(INGESTED_PATH, { interval: 1000 }, (curr) => {
  if (curr.nlink === 0 && ingested.length) {
    ingested = [];
    broadcast("data");
  }
});

function variableOptions(dashboard, variable) {
  if (Array.isArray(variable.options) && variable.options.length) return variable.options;
  const values = new Set();
  for (const e of allEvents()) {
    if (e[variable.name] != null) values.add(String(e[variable.name]));
  }
  return [ALL_VALUE, ...[...values].sort()];
}

function render(searchParams) {
  const dashboard = readDashboard();
  const events = allEvents();
  const schema = buildSchema(events);
  const variables = {};
  const variableDefs = (dashboard.variables || []).map((v) => {
    const options = variableOptions(dashboard, v);
    const requested = searchParams.get(`var-${v.name}`);
    const value = requested && options.includes(requested) ? requested : v.default ?? options[0];
    variables[v.name] = value;
    return { ...v, options, value };
  });

  const panels = (dashboard.panels || []).map((panel) => {
    try {
      return { ...panel, result: runQuery(panel.query, events, variables, schema) };
    } catch (err) {
      const message = err instanceof QueryError ? err.message : `query failed: ${err.message}`;
      return { ...panel, error: `No data — ${message}` };
    }
  });

  return {
    uid: dashboard.uid,
    title: dashboard.title,
    description: dashboard.description,
    timeRange: dashboard.timeRange,
    variables: variableDefs,
    panels,
    renderedAt: new Date().toISOString(),
  };
}

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function readBody(req, limit = 1_000_000) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > limit) {
        reject(new Error("payload too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function validEvent(e) {
  return (
    e &&
    typeof e === "object" &&
    !Array.isArray(e) &&
    typeof e.metric === "string" &&
    /^[\w.:-]{1,64}$/.test(e.metric)
  );
}

async function handleIngest(req, res) {
  let payload;
  try {
    payload = JSON.parse(await readBody(req));
  } catch (err) {
    return sendJson(res, 400, { error: `invalid JSON: ${err.message}` });
  }
  const items = Array.isArray(payload) ? payload : [payload];
  if (!items.length || !items.every(validEvent)) {
    return sendJson(res, 400, { error: "expected an event object (or array) with a 'metric' string" });
  }
  const now = new Date().toISOString();
  const accepted = items.map((e) => ({ ...e, ts: typeof e.ts === "string" ? e.ts : now }));
  ingested = ingested.concat(accepted);
  appendIngestedEvents(accepted);
  broadcast("data");
  return sendJson(res, 202, { accepted: accepted.length });
}

function serveStatic(pathname, res) {
  const rel = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const file = path.resolve(PUBLIC_DIR, rel);
  if (!file.startsWith(PUBLIC_DIR + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    return res.end("Not found");
  }
  res.writeHead(200, {
    "Content-Type": MIME[path.extname(file)] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  try {
    if (req.method === "POST" && url.pathname === "/ingest") return await handleIngest(req, res);

    if (req.method === "GET" && url.pathname === "/api/render") {
      return sendJson(res, 200, render(url.searchParams));
    }

    if (req.method === "GET" && url.pathname === "/api/dashboard") {
      return sendJson(res, 200, readDashboard());
    }

    if (req.method === "GET" && url.pathname === "/api/stream") {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
      res.write("retry: 2000\n\n");
      clients.add(res);
      const ping = setInterval(() => res.write(": ping\n\n"), 15000);
      req.on("close", () => {
        clearInterval(ping);
        clients.delete(res);
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/healthz") {
      return sendJson(res, 200, { ok: true, events: allEvents().length });
    }

    if (req.method === "GET") return serveStatic(url.pathname, res);

    res.writeHead(405);
    res.end();
  } catch (err) {
    console.error(err);
    sendJson(res, 500, { error: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`Copilot App Telemetry dashboard running at http://localhost:${PORT}/`);
  console.log(`  dashboard definition: ${DASHBOARD_PATH}`);
  console.log(`  ingest endpoint:      POST http://localhost:${PORT}/ingest`);
});
