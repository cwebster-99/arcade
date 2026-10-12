import assert from "node:assert/strict";
import { test } from "node:test";
import { loadSeedEvents } from "../lib/store.js";
import { QueryError, runQuery } from "../lib/query.js";

const events = loadSeedEvents();
const vars = { app_version: "1.1.28" };

test("legacy panels filter on `version`", () => {
  const r = runQuery("metric=session_start | where version = $app_version | count by operation", events, vars);
  assert.deepEqual(r.rows.map((row) => row.key), ["create", "resume"]);
  assert.ok(r.rows.every((row) => row.value > 0));
  const errors = runQuery("metric=startup_error | where version = $app_version | count by reason", events, vars);
  assert.ok(errors.rows.find((row) => row.key === "timeout").value > 0);
});

test("session_ready_ms with legacy `version` field fails with a did-you-mean hint", () => {
  assert.throws(
    () => runQuery("metric=session_ready_ms | where version = $app_version | p95 by operation", events, vars),
    (err) =>
      err instanceof QueryError &&
      err.message === "unknown field 'version' for metric session_ready_ms (did you mean app_version?)",
  );
});

test("session_ready_ms with `app_version` returns data, and the error is reported even for 'All'", () => {
  const r = runQuery("metric=session_ready_ms | where app_version = $app_version | p95 by operation", events, vars);
  assert.equal(r.rows.length, 2);
  assert.throws(() =>
    runQuery("metric=session_ready_ms | where version = $app_version | p95 by operation", events, { app_version: "All" }),
  );
});

test("1.1.28 shows a Windows resume regression (p50, p95, and timeouts)", () => {
  const q = (agg, v, op, os) =>
    runQuery(
      `metric=session_ready_ms | where app_version = ${v} and operation = ${op} and os_platform = ${os} | ${agg}`,
      events,
      {},
    ).value;
  assert.ok(q("p50", "1.1.28", "resume", "windows") > 2 * q("p50", "1.1.27", "resume", "windows"));
  assert.ok(q("p95", "1.1.28", "resume", "windows") > 2 * q("p95", "1.1.27", "resume", "windows"));
  assert.ok(q("p50", "1.1.28", "resume", "macos") < 1.2 * q("p50", "1.1.27", "resume", "macos"));
  assert.ok(q("p50", "1.1.28", "create", "windows") < 1.2 * q("p50", "1.1.27", "create", "windows"));
  const timeouts = (v) =>
    runQuery(`metric=startup_error | where version = ${v} and reason = timeout and operation = resume and os_platform = windows | count`, events, {}).value;
  assert.ok(timeouts("1.1.28") > 5 * Math.max(1, timeouts("1.1.27")));
});

test("unknown metric and bad syntax are QueryErrors", () => {
  assert.throws(() => runQuery("metric=nope | count", events), QueryError);
  assert.throws(() => runQuery("select * from events", events), QueryError);
});
