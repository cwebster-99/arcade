import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const DASHBOARD_PATH = path.join(ROOT, "dashboard.json");
export const DASHBOARD_BASE_PATH = path.join(ROOT, "dashboard.base.json");
export const EVENTS_PATH = path.join(ROOT, "data", "events.json");
export const INGESTED_PATH = path.join(ROOT, "data", "ingested.jsonl");
export const PORT = Number(process.env.PORT || 4319);
export const DASHBOARD_URL = `http://localhost:${PORT}/`;

export const VIZ_TYPES = ["stat", "bar", "line", "table"];

const DAY_MS = 24 * 60 * 60 * 1000;

export function ensureDashboard() {
  if (!fs.existsSync(DASHBOARD_PATH)) {
    fs.copyFileSync(DASHBOARD_BASE_PATH, DASHBOARD_PATH);
  }
}

export function readDashboard() {
  ensureDashboard();
  return JSON.parse(fs.readFileSync(DASHBOARD_PATH, "utf8"));
}

export function writeDashboard(dashboard) {
  const tmp = `${DASHBOARD_PATH}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(dashboard, null, 2)}\n`);
  fs.renameSync(tmp, DASHBOARD_PATH);
}

export function resetDashboard() {
  fs.copyFileSync(DASHBOARD_BASE_PATH, DASHBOARD_PATH);
  if (fs.existsSync(INGESTED_PATH)) fs.rmSync(INGESTED_PATH);
}

/**
 * Seeded events are stored with fixed timestamps; shift them so the newest
 * seeded day is "today" and the dashboard always looks current.
 */
function shiftToToday(events) {
  let maxTs = 0;
  for (const e of events) {
    const t = Date.parse(e.ts);
    if (t > maxTs) maxTs = t;
  }
  if (!maxTs) return events;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const latestDay = new Date(maxTs);
  latestDay.setUTCHours(0, 0, 0, 0);
  const offset = Math.round((today - latestDay) / DAY_MS) * DAY_MS;
  return events.map((e) => ({ ...e, ts: new Date(Date.parse(e.ts) + offset).toISOString() }));
}

export function loadSeedEvents() {
  return shiftToToday(JSON.parse(fs.readFileSync(EVENTS_PATH, "utf8")));
}

export function loadIngestedEvents() {
  if (!fs.existsSync(INGESTED_PATH)) return [];
  return fs
    .readFileSync(INGESTED_PATH, "utf8")
    .split("\n")
    .filter(Boolean)
    .flatMap((line) => {
      try {
        return [JSON.parse(line)];
      } catch {
        return [];
      }
    });
}

export function appendIngestedEvents(events) {
  fs.appendFileSync(INGESTED_PATH, events.map((e) => `${JSON.stringify(e)}\n`).join(""));
}

export function loadEvents() {
  return [...loadSeedEvents(), ...loadIngestedEvents()];
}

export function slugify(title) {
  return (
    String(title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "panel"
  );
}

export function uniquePanelId(dashboard, title) {
  const base = slugify(title);
  const ids = new Set(dashboard.panels.map((p) => p.id));
  if (!ids.has(base)) return base;
  let i = 2;
  while (ids.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}
