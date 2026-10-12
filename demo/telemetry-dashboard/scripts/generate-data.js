// Regenerates data/events.json with deterministic, fully synthetic Copilot App startup telemetry.
// Three event tables share one file:
//   session_start, startup_error -> legacy pipeline, version stored in `version`
//   session_ready_ms             -> new pipeline, version stored in `app_version`
import fs from "node:fs";
import { EVENTS_PATH } from "../lib/store.js";

let seed = 4242;
function rand() {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}
function gauss() {
  return Math.sqrt(-2 * Math.log(rand() || 1e-9)) * Math.cos(2 * Math.PI * rand());
}
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

const DAYS = 14;
const END = Date.parse("2026-01-14T00:00:00.000Z");
const TIMEOUT_MS = 30000;
// Median time-to-ready (ms) per operation and OS on a healthy build.
const BASE_READY = {
  create: { windows: 2400, macos: 1900 },
  resume: { windows: 1300, macos: 1050 },
};

function versionForDay(day) {
  // Staged rollout: 1.1.26 -> 1.1.27 -> 1.1.28, with overlap while clients auto-update.
  const r = rand();
  if (day < 4) return r < 0.85 ? "1.1.26" : "1.1.27";
  if (day < 9) return day < 6 && r < 0.25 ? "1.1.26" : "1.1.27";
  if (day < 11) return r < 0.55 ? "1.1.28" : "1.1.27";
  return r < 0.9 ? "1.1.28" : "1.1.27";
}

function timeoutRate(version, operation, os) {
  if (version === "1.1.28" && operation === "resume" && os === "windows") return 0.14;
  if (operation === "create") return 0.008;
  return 0.004;
}

function readyValue(version, operation, os) {
  let v = BASE_READY[operation][os];
  if (version === "1.1.26") v *= 1.05;
  if (version === "1.1.28" && operation === "resume" && os === "windows") v *= 2.9;
  // Log-normal-ish spread gives a realistic long tail for p95.
  return Math.min(TIMEOUT_MS - 500, Math.max(250, Math.round(v * Math.exp(0.35 * gauss()))));
}

const OTHER_REASONS = ["runtime_rpc", "auth", "spawn_failed"];

const events = [];
for (let day = 0; day < DAYS; day++) {
  const dayStart = END - (DAYS - 1 - day) * 86400000;
  const sessions = 110 + Math.round(rand() * 40) + day * 3;
  for (let i = 0; i < sessions; i++) {
    const ts = new Date(dayStart + Math.floor(rand() * 86400000)).toISOString();
    const version = versionForDay(day);
    const operation = rand() < 0.55 ? "resume" : "create";
    const os = rand() < 0.62 ? "windows" : "macos";
    const base = { ts, operation, os_platform: os, session_type: "local" };

    events.push({ metric: "session_start", ...base, version });

    if (rand() < timeoutRate(version, operation, os)) {
      events.push({ metric: "session_ready_ms", ...base, app_version: version, outcome: "timeout", value: TIMEOUT_MS });
      events.push({ metric: "startup_error", ...base, version, reason: "timeout" });
      continue;
    }

    if (rand() < (operation === "create" ? 0.012 : 0.005)) {
      events.push({ metric: "startup_error", ...base, version, reason: pick(OTHER_REASONS) });
      continue;
    }

    events.push({
      metric: "session_ready_ms",
      ...base,
      app_version: version,
      outcome: "ready",
      value: readyValue(version, operation, os),
    });
  }
}

events.sort((a, b) => a.ts.localeCompare(b.ts));
fs.writeFileSync(EVENTS_PATH, `${JSON.stringify(events)}\n`);
const counts = events.reduce((acc, e) => ({ ...acc, [e.metric]: (acc[e.metric] || 0) + 1 }), {});
console.log(`Wrote ${events.length} events to ${EVENTS_PATH}`, counts);
