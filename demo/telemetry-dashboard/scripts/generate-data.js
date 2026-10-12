// Regenerates data/events.json with deterministic synthetic telemetry.
// Three event tables share one file:
//   session_start, error  -> legacy pipeline, version stored in `version`
//   ttff_ms               -> new pipeline (shipped in 1.4.0 instrumentation), version stored in `app_version`
import fs from "node:fs";
import { EVENTS_PATH } from "../lib/store.js";

let seed = 1337;
function rand() {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}
function gauss() {
  return Math.sqrt(-2 * Math.log(rand() || 1e-9)) * Math.cos(2 * Math.PI * rand());
}
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

const GAMES = ["snake", "2048", "tetris", "flappy", "minesweeper"];
const GAME_WEIGHTS = { snake: 0.3, "2048": 0.2, tetris: 0.22, flappy: 0.18, minesweeper: 0.1 };
const BASE_TTFF = { snake: 170, "2048": 140, tetris: 230, flappy: 290, minesweeper: 190 };
const DAYS = 14;
const END = Date.parse("2026-01-14T00:00:00.000Z");

function versionForDay(day) {
  // Staged rollout: 1.2.0 -> 1.3.0 -> 1.4.0, with overlap while clients update.
  const r = rand();
  if (day < 4) return r < 0.85 ? "1.2.0" : "1.3.0";
  if (day < 9) return day < 6 && r < 0.25 ? "1.2.0" : "1.3.0";
  if (day < 11) return r < 0.55 ? "1.4.0" : "1.3.0";
  return r < 0.9 ? "1.4.0" : "1.3.0";
}

function pickGame() {
  let r = rand();
  for (const g of GAMES) {
    r -= GAME_WEIGHTS[g];
    if (r <= 0) return g;
  }
  return GAMES[0];
}

const ERROR_TYPES = {
  snake: ["TypeError", "RangeError"],
  "2048": ["TypeError"],
  tetris: ["TypeError", "InvalidStateError"],
  flappy: ["TypeError", "SecurityError"],
  minesweeper: ["RangeError"],
};

function ttffValue(game, version, platform) {
  let v = BASE_TTFF[game];
  if (platform === "mobile") v *= 1.7;
  if (version === "1.2.0") v *= 1.08;
  if (version === "1.4.0") v *= platform === "mobile" ? 3.4 : 1.06;
  return Math.max(40, Math.round(v * (1 + 0.18 * gauss())));
}

const events = [];
for (let day = 0; day < DAYS; day++) {
  const dayStart = END - (DAYS - 1 - day) * 86400000;
  const sessions = 55 + Math.round(rand() * 30) + day * 2;
  for (let i = 0; i < sessions; i++) {
    const ts = new Date(dayStart + Math.floor(rand() * 86400000)).toISOString();
    const game = pickGame();
    const version = versionForDay(day);
    const platform = rand() < 0.42 ? "mobile" : "desktop";
    const browser = platform === "mobile" ? pick(["mobile_safari", "chrome_android"]) : pick(["chrome", "edge", "firefox", "safari"]);

    events.push({ metric: "session_start", ts, game, version, platform, browser });

    // ttff instrumentation was back-filled for older clients via the new pipeline
    events.push({ metric: "ttff_ms", ts, game, app_version: version, platform, value: ttffValue(game, version, platform) });

    let errorRate = 0.025;
    if (version === "1.4.0" && game === "snake" && platform === "mobile") errorRate = 0.65;
    if (rand() < errorRate) {
      events.push({
        metric: "error",
        ts,
        game,
        version,
        platform,
        error_type: version === "1.4.0" && game === "snake" && platform === "mobile" ? "TypeError" : pick(ERROR_TYPES[game]),
      });
    }
  }
}

events.sort((a, b) => a.ts.localeCompare(b.ts));
fs.writeFileSync(EVENTS_PATH, `${JSON.stringify(events)}\n`);
const counts = events.reduce((acc, e) => ({ ...acc, [e.metric]: (acc[e.metric] || 0) + 1 }), {});
console.log(`Wrote ${events.length} events to ${EVENTS_PATH}`, counts);
