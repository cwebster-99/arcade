import assert from "node:assert/strict";
import { test } from "node:test";
import { loadSeedEvents } from "../lib/store.js";
import { QueryError, runQuery } from "../lib/query.js";

const events = loadSeedEvents();
const vars = { app_version: "1.4.0" };

test("legacy panels filter on `version`", () => {
  const r = runQuery("metric=session_start | where version = $app_version | count by game", events, vars);
  assert.ok(r.rows.length >= 4);
  assert.ok(r.rows.every((row) => row.value > 0));
});

test("ttff with legacy `version` field fails with a did-you-mean hint", () => {
  assert.throws(
    () => runQuery("metric=ttff_ms | where version = $app_version | avg by game", events, vars),
    (err) =>
      err instanceof QueryError &&
      err.message === "unknown field 'version' for metric ttff_ms (did you mean app_version?)",
  );
});

test("ttff with `app_version` returns data, and the error is reported even for 'All'", () => {
  const r = runQuery("metric=ttff_ms | where app_version = $app_version | avg by game", events, vars);
  assert.equal(r.rows.length, 5);
  assert.throws(() =>
    runQuery("metric=ttff_ms | where version = $app_version | avg by game", events, { app_version: "All" }),
  );
});

test("1.4.0 shows a mobile TTFF regression", () => {
  const q = (v, p) =>
    runQuery(`metric=ttff_ms | where app_version = ${v} and platform = ${p} | avg`, events, {}).value;
  assert.ok(q("1.4.0", "mobile") > 2 * q("1.3.0", "mobile"));
  assert.ok(q("1.4.0", "desktop") < 1.2 * q("1.3.0", "desktop"));
});

test("unknown metric and bad syntax are QueryErrors", () => {
  assert.throws(() => runQuery("metric=nope | count", events), QueryError);
  assert.throws(() => runQuery("select * from events", events), QueryError);
});
