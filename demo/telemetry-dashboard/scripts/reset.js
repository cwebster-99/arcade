import { DASHBOARD_PATH, resetDashboard } from "../lib/store.js";

resetDashboard();
console.log(`Dashboard reset to pre-demo state: ${DASHBOARD_PATH}`);
console.log("Cleared ingested events (data/ingested.jsonl).");
