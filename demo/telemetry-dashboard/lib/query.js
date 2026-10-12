// Tiny query language for the Copilot App Telemetry dashboard.
//
//   metric=<name> [| where <field> (=|!=) <value|$var|"quoted"> [and ...]] [| <agg>[(field)] [by <field>]]
//
// agg: count | avg | sum | min | max | p50 | p90 | p95 (default: count). Numeric aggs read `value`.
// `day` is a derived field (YYYY-MM-DD from `ts`) available on every metric.

const AGGS = new Set(["count", "avg", "sum", "min", "max", "p50", "p90", "p95"]);
const DERIVED_FIELDS = new Set(["day"]);
export const ALL_VALUE = "All";

export class QueryError extends Error {}

function parseValue(raw) {
  const v = raw.trim();
  if (v.startsWith("$")) return { kind: "var", name: v.slice(1) };
  const quoted = v.match(/^"(.*)"$|^'(.*)'$/);
  if (quoted) return { kind: "literal", value: quoted[1] ?? quoted[2] };
  return { kind: "literal", value: v };
}

export function parseQuery(query) {
  if (typeof query !== "string" || !query.trim()) {
    throw new QueryError("empty query");
  }
  const stages = query.split("|").map((s) => s.trim()).filter(Boolean);
  const head = stages.shift();
  const metricMatch = head.match(/^metric\s*=\s*([\w.:-]+)$/i);
  if (!metricMatch) {
    throw new QueryError(`query must start with 'metric=<name>' (got '${head}')`);
  }

  const parsed = { metric: metricMatch[1], filters: [], agg: "count", aggField: "value", by: null };

  for (const stage of stages) {
    const where = stage.match(/^where\s+(.+)$/i);
    if (where) {
      for (const clause of where[1].split(/\s+and\s+/i)) {
        const m = clause.match(/^([\w.]+)\s*(!=|=)\s*(.+)$/);
        if (!m) throw new QueryError(`cannot parse where clause '${clause}'`);
        parsed.filters.push({ field: m[1], op: m[2], value: parseValue(m[3]) });
      }
      continue;
    }

    const agg = stage.match(/^(\w+)(?:\(\s*([\w.]+)\s*\))?(?:\s+by\s+([\w.]+))?$/i);
    if (agg && AGGS.has(agg[1].toLowerCase())) {
      parsed.agg = agg[1].toLowerCase();
      if (agg[2]) parsed.aggField = agg[2];
      parsed.by = agg[3] ?? null;
      continue;
    }

    throw new QueryError(`unknown stage '${stage}'`);
  }

  return parsed;
}

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return dp[a.length][b.length];
}

function suggest(field, known) {
  let best = null;
  let bestScore = Infinity;
  for (const k of known) {
    const score = k.includes(field) || field.includes(k) ? 0 : levenshtein(field, k);
    if (score < bestScore) {
      best = k;
      bestScore = score;
    }
  }
  return bestScore <= 3 ? best : null;
}

/** Map of metric name -> Set of field names, derived from the events. */
export function buildSchema(events) {
  const schema = new Map();
  for (const e of events) {
    if (!e || typeof e.metric !== "string") continue;
    if (!schema.has(e.metric)) schema.set(e.metric, new Set());
    const fields = schema.get(e.metric);
    for (const key of Object.keys(e)) if (key !== "metric") fields.add(key);
  }
  return schema;
}

function percentile(sorted, p) {
  if (!sorted.length) return null;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

function aggregate(rows, agg, field) {
  if (agg === "count") return rows.length;
  const nums = rows.map((r) => Number(r[field])).filter((n) => Number.isFinite(n));
  if (!nums.length) return null;
  switch (agg) {
    case "sum":
      return nums.reduce((a, b) => a + b, 0);
    case "avg":
      return nums.reduce((a, b) => a + b, 0) / nums.length;
    case "min":
      return Math.min(...nums);
    case "max":
      return Math.max(...nums);
    default: {
      const sorted = nums.slice().sort((a, b) => a - b);
      return percentile(sorted, Number(agg.slice(1)));
    }
  }
}

function fieldValue(event, field) {
  if (field === "day") return typeof event.ts === "string" ? event.ts.slice(0, 10) : undefined;
  return event[field];
}

/**
 * Run a query against events. Throws QueryError with a user-facing message on failure.
 * Returns { metric, agg, by, rows: [{ key, value }], value, count }.
 */
export function runQuery(query, events, variables = {}, schema = buildSchema(events)) {
  const q = parseQuery(query);
  const fields = schema.get(q.metric);
  if (!fields) {
    const metrics = [...schema.keys()];
    const hint = suggest(q.metric, metrics);
    throw new QueryError(
      `unknown metric '${q.metric}'${hint ? ` (did you mean ${hint}?)` : ""}`,
    );
  }

  const referenced = [
    ...q.filters.map((f) => f.field),
    ...(q.by ? [q.by] : []),
    ...(q.agg !== "count" ? [q.aggField] : []),
  ];
  for (const f of referenced) {
    if (!fields.has(f) && !DERIVED_FIELDS.has(f)) {
      const hint = suggest(f, [...fields]);
      throw new QueryError(
        `unknown field '${f}' for metric ${q.metric}${hint ? ` (did you mean ${hint}?)` : ""}`,
      );
    }
  }

  const filters = [];
  for (const f of q.filters) {
    let value = f.value.value;
    if (f.value.kind === "var") {
      if (!(f.value.name in variables)) {
        throw new QueryError(`unknown dashboard variable '$${f.value.name}'`);
      }
      value = variables[f.value.name];
      if (value === ALL_VALUE || value === "" || value == null) continue;
    }
    filters.push({ ...f, value: String(value) });
  }

  const matched = events.filter(
    (e) =>
      e.metric === q.metric &&
      filters.every((f) => {
        const eq = String(fieldValue(e, f.field)) === f.value;
        return f.op === "=" ? eq : !eq;
      }),
  );

  const result = { metric: q.metric, agg: q.agg, by: q.by, count: matched.length, rows: [], value: null };

  if (q.by) {
    const groups = new Map();
    for (const e of matched) {
      const key = fieldValue(e, q.by);
      if (key === undefined) continue;
      const k = String(key);
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(e);
    }
    result.rows = [...groups.entries()]
      .map(([key, rows]) => ({ key, value: aggregate(rows, q.agg, q.aggField) }))
      .sort((a, b) => (q.by === "day" ? a.key.localeCompare(b.key) : a.key.localeCompare(b.key, undefined, { numeric: true })));
  } else {
    result.value = aggregate(matched, q.agg, q.aggField);
  }

  return result;
}
