#!/usr/bin/env node
// Seeds a Sentry project with realistic synthetic errors for the Universe demo.
//
//   SENTRY_DSN=https://<key>@o<org>.ingest.sentry.io/<project> node scripts/seed-sentry-crash.mjs [--dry-run]
//
// Sends ~30 events for the 1.4.0 mobile-only Snake touch crash (stack frames point at the real
// file/line in src/components/SnakeGame.tsx) plus a few unrelated low-volume errors on 1.3.0.
// Uses the Sentry envelope HTTP API directly, no SDK required.
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
const DRY_RUN = process.argv.includes("--dry-run");
const CRASH_COUNT = Number(process.env.SEED_CRASH_COUNT || 30);
const APP_URL = process.env.SEED_APP_URL || "https://arcade.example.com/";
const SDK = { name: "sentry.javascript.react", version: "8.55.0" };

const dsnRaw = process.env.SENTRY_DSN || process.env.VITE_SENTRY_DSN;
if (!dsnRaw && !DRY_RUN) {
  console.error("Missing SENTRY_DSN (or VITE_SENTRY_DSN). Copy .env.example to .env and set it, or pass --dry-run.");
  process.exit(1);
}

function parseDsn(raw) {
  const url = new URL(raw);
  const segments = url.pathname.split("/").filter(Boolean);
  const projectId = segments.pop();
  const prefix = segments.length ? `/${segments.join("/")}` : "";
  return {
    raw,
    publicKey: url.username,
    projectId,
    host: url.host,
    envelopeUrl: `${url.protocol}//${url.host}${prefix}/api/${projectId}/envelope/`,
  };
}

const dsn = dsnRaw ? parseDsn(dsnRaw) : { raw: "https://public@example.ingest.sentry.io/0", publicKey: "public", projectId: "0" };

// ---------------------------------------------------------------------------
// Source helpers: locate real lines so stack frames match the code.
// ---------------------------------------------------------------------------
function sourceFrame(relPath, functionName, lineMatcher, { after = 0, column } = {}) {
  const lines = fs.readFileSync(path.join(ROOT, relPath), "utf8").split(/\r?\n/);
  let start = 0;
  if (after) {
    start = lines.findIndex((l) => l.includes(after));
    if (start === -1) throw new Error(`Could not find '${after}' in ${relPath}`);
  }
  const idx = lines.findIndex((l, i) => i >= start && l.includes(lineMatcher));
  if (idx === -1) throw new Error(`Could not find '${lineMatcher}' in ${relPath}`);
  const col = column ?? lines[idx].indexOf(lineMatcher) + 1;
  return {
    filename: `app:///${relPath.replace(/\\/g, "/")}`,
    abs_path: `app:///${relPath.replace(/\\/g, "/")}`,
    module: relPath.replace(/\\/g, "/").replace(/\.(t|j)sx?$/, "").replace(/^src\//, ""),
    function: functionName,
    lineno: idx + 1,
    colno: col,
    in_app: true,
    pre_context: lines.slice(Math.max(0, idx - 5), idx),
    context_line: lines[idx],
    post_context: lines.slice(idx + 1, idx + 4),
  };
}

const reactFrames = [
  ["dispatchDiscreteEvent", 6352],
  ["dispatchEvent", 6403],
  ["batchedUpdates$1", 9142],
  ["dispatchEventForPluginEventSystem", 9287],
  ["processDispatchQueue", 9104],
  ["executeDispatch", 9081],
  ["invokeGuardedCallbackAndCatchFirstError", 4291],
  ["callCallback", 4164],
].map(([fn, lineno]) => ({
  filename: "app:///node_modules/react-dom/cjs/react-dom.production.min.js",
  abs_path: "app:///node_modules/react-dom/cjs/react-dom.production.min.js",
  module: "react-dom/cjs/react-dom.production.min",
  function: fn,
  lineno,
  colno: 12,
  in_app: false,
}));

const touchCrashFrame = sourceFrame("src/components/SnakeGame.tsx", "handleTouchEnd", "touch.clientX", {
  after: "const handleTouchEnd",
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const MOBILE_CLIENTS = [
  {
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
    message: "undefined is not an object (evaluating 'touch.clientX')",
  },
  {
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
    message: "undefined is not an object (evaluating 'touch.clientX')",
  },
  {
    ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.6478.71 Mobile Safari/537.36",
    message: "Cannot read properties of undefined (reading 'clientX')",
  },
  {
    ua: "Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.165 Mobile Safari/537.36",
    message: "Cannot read properties of undefined (reading 'clientX')",
  },
  {
    ua: "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
    message: "undefined is not an object (evaluating 'touch.clientX')",
  },
];
const DESKTOP_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0";

const USERS = [
  { id: "u_4f1a92", username: "pixelpilot" },
  { id: "u_77c0de", username: "snakecharmer" },
  { id: "u_a19b33", username: "tetromino_tess" },
  { id: "u_c3e5f8", username: "highscore_hank" },
  { id: "u_0d2b6e", username: "arcade_ana" },
  { id: "u_9e8f71", username: "joystick_jo" },
];

const pick = (arr, i) => arr[i % arr.length];
const nowSec = () => Date.now() / 1000;

function baseEvent({ release, timestamp, ua, user, tags }) {
  return {
    event_id: randomUUID().replace(/-/g, ""),
    timestamp,
    platform: "javascript",
    level: "error",
    logger: "javascript",
    release,
    environment: "production",
    sdk: SDK,
    request: { url: `${APP_URL}#${tags.game}`, headers: { "User-Agent": ua } },
    user: { ...user, ip_address: "{{auto}}" },
    tags,
  };
}

function touchCrashEvent(i) {
  const client = pick(MOBILE_CLIENTS, i);
  const user = pick(USERS, i * 7 + (i >> 2));
  const timestamp = nowSec() - (i / CRASH_COUNT) * 18 * 3600 - Math.random() * 600;
  const version = pkg.version;
  return {
    ...baseEvent({
      release: `${pkg.name}@${version}`,
      timestamp,
      ua: client.ua,
      user,
      tags: { app_version: version, game: "snake", input: "touch" },
    }),
    exception: {
      values: [
        {
          type: "TypeError",
          value: client.message,
          mechanism: { type: "auto.browser.browserapierrors.addEventListener", handled: false },
          stacktrace: { frames: [...reactFrames, touchCrashFrame] },
        },
      ],
    },
    breadcrumbs: {
      values: [
        { timestamp: timestamp - 9, category: "ui.click", message: "div.arcade-cabinet > button" },
        { timestamp: timestamp - 7, category: "navigation", data: { from: "/", to: "/#snake" } },
        { timestamp: timestamp - 6.5, category: "ui.render", message: "ttff snake", data: { ttff_ms: 980 + Math.round(Math.random() * 600) } },
        { timestamp: timestamp - 0.4, category: "ui.input", message: "touchstart div[aria-label=\"Snake board\"]" },
        { timestamp: timestamp - 0.05, category: "ui.input", message: "touchend div[aria-label=\"Snake board\"]" },
      ],
    },
  };
}

function noiseEvents() {
  const release = `${pkg.name}@1.3.0`;
  const events = [];
  const collision = sourceFrame("src/components/TetrisGame.tsx", "canPlace", "board[boardY][boardX]", {
    after: "function canPlace",
  });
  const rotateCaller = { ...sourceFrame("src/components/TetrisGame.tsx", "onKey", "function onKey"), function: "onKey" };
  for (let i = 0; i < 3; i++) {
    events.push({
      ...baseEvent({
        release,
        timestamp: nowSec() - (2 + i * 9) * 3600,
        ua: DESKTOP_UA,
        user: pick(USERS, i + 2),
        tags: { app_version: "1.3.0", game: "tetris", input: "keyboard" },
      }),
      exception: {
        values: [
          {
            type: "TypeError",
            value: "Cannot read properties of undefined (reading '10')",
            mechanism: { type: "auto.browser.browserapierrors.addEventListener", handled: false },
            stacktrace: { frames: [rotateCaller, collision] },
          },
        ],
      },
    });
  }
  for (let i = 0; i < 3; i++) {
    events.push({
      ...baseEvent({
        release,
        timestamp: nowSec() - (5 + i * 7) * 3600,
        ua: i === 1 ? pick(MOBILE_CLIENTS, 0).ua : DESKTOP_UA,
        user: pick(USERS, i + 4),
        tags: { app_version: "1.3.0", game: "2048" },
      }),
      exception: {
        values: [
          {
            type: "Error",
            value: "ResizeObserver loop completed with undelivered notifications.",
            mechanism: { type: "onerror", handled: false },
          },
        ],
      },
    });
  }
  return events;
}

// ---------------------------------------------------------------------------
// Envelope transport
// ---------------------------------------------------------------------------
function envelope(event) {
  return [
    JSON.stringify({ event_id: event.event_id, sent_at: new Date().toISOString(), dsn: dsn.raw, sdk: SDK }),
    JSON.stringify({ type: "event" }),
    JSON.stringify(event),
  ].join("\n");
}

async function send(event) {
  const res = await fetch(dsn.envelopeUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-sentry-envelope",
      "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${dsn.publicKey}, sentry_client=arcade-demo-seed/1.0`,
    },
    body: envelope(event),
  });
  if (!res.ok) {
    throw new Error(`Sentry responded ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
}

const crashes = Array.from({ length: CRASH_COUNT }, (_, i) => touchCrashEvent(i));
const noise = noiseEvents();
const all = [...crashes, ...noise];

console.log(
  `Crash frame: ${touchCrashFrame.filename}:${touchCrashFrame.lineno}:${touchCrashFrame.colno} (${touchCrashFrame.function})`,
);
console.log(`  > ${touchCrashFrame.context_line.trim()}`);

if (DRY_RUN) {
  console.log(`\n[dry-run] Would send ${crashes.length} touch-crash events + ${noise.length} noise events.`);
  console.log("[dry-run] Sample envelope:\n");
  console.log(envelope(crashes[0]));
  process.exit(0);
}

console.log(`\nSending ${all.length} events to project ${dsn.projectId} on ${dsn.host}…`);
let sent = 0;
for (const event of all) {
  await send(event);
  sent++;
  process.stdout.write(`\r  ${sent}/${all.length}`);
  await new Promise((r) => setTimeout(r, 120));
}
console.log("\n✅ Done.");

const query = encodeURIComponent(`is:unresolved release:${pkg.name}@${pkg.version}`);
const org = process.env.SENTRY_ORG;
const issuesUrl = org
  ? `https://${org}.sentry.io/issues/?project=${dsn.projectId}&query=${query}&statsPeriod=24h`
  : `https://sentry.io/issues/?project=${dsn.projectId}&query=${query}&statsPeriod=24h`;
console.log(`\nIssue should appear within ~1 minute as "TypeError: … clientX" in handleTouchEnd:`);
console.log(`  ${issuesUrl}`);
console.log("Open the issue and copy its URL — that's the link you paste into Copilot in Act 1.");
