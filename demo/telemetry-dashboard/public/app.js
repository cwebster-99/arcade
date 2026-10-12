const PALETTE = ["#7c5cff", "#3dd6c6", "#f5a524", "#ff5c7a", "#4ea8ff", "#3ecf8e", "#c084fc"];
const params = new URLSearchParams(location.search);
const panelsEl = document.getElementById("panels");
const variablesEl = document.getElementById("variables");
const statusEl = document.getElementById("status");
const liveEl = document.getElementById("live-indicator");
const tooltip = document.createElement("div");
tooltip.className = "tooltip";
document.body.appendChild(tooltip);

let lastData = null;
let knownPanelIds = null;

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function formatNumber(v) {
  if (v == null || Number.isNaN(v)) return "–";
  if (Math.abs(v) >= 10000) return `${(v / 1000).toFixed(1)}k`;
  if (Number.isInteger(v)) return v.toLocaleString();
  return v.toLocaleString(undefined, { maximumFractionDigits: v < 10 ? 2 : 0 });
}

function unitFor(panel) {
  if (panel.unit) return panel.unit;
  const r = panel.result;
  if (r && r.agg !== "count" && /_ms$/.test(r.metric)) return "ms";
  return "";
}

function niceMax(v) {
  if (!v || v <= 0) return 4;
  const raw = v / 4;
  const exp = 10 ** Math.floor(Math.log10(raw));
  const n = raw / exp;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return step * exp * 4;
}

function colorFor(key) {
  let h = 0;
  for (const ch of String(key)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

function axis(width, height, pad, max, unit) {
  let out = "";
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + ((height - pad.top - pad.bottom) * i) / 4;
    const val = max - (max * i) / 4;
    out += `<line class="gridline" x1="${pad.left}" x2="${width - pad.right}" y1="${y}" y2="${y}" />`;
    out += `<text x="${pad.left - 8}" y="${y + 4}" text-anchor="end">${esc(formatNumber(val))}${i === 0 && unit ? ` ${esc(unit)}` : ""}</text>`;
  }
  return out;
}

function barChart(panel, width) {
  const rows = panel.result.rows;
  const unit = unitFor(panel);
  const height = 200;
  const pad = { top: 16, right: 10, bottom: 26, left: 56 };
  const max = niceMax(Math.max(...rows.map((r) => r.value ?? 0)));
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const slot = innerW / rows.length;
  const barW = Math.min(64, slot * 0.62);
  let bars = "";
  rows.forEach((r, i) => {
    const h = ((r.value ?? 0) / max) * innerH;
    const x = pad.left + slot * i + (slot - barW) / 2;
    const y = pad.top + innerH - h;
    const color = colorFor(r.key);
    bars += `<rect x="${x}" y="${y}" width="${barW}" height="${Math.max(h, 1)}" rx="3" fill="${color}" fill-opacity="0.85"
      data-tip="${esc(`${r.key}: ${formatNumber(r.value)}${unit ? ` ${unit}` : ""}`)}" />`;
    bars += `<text class="value-label" x="${x + barW / 2}" y="${y - 5}" text-anchor="middle">${esc(formatNumber(r.value))}</text>`;
    bars += `<text x="${x + barW / 2}" y="${height - 8}" text-anchor="middle">${esc(r.key)}</text>`;
  });
  return `<svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(panel.title)} bar chart">${axis(width, height, pad, max, unit)}${bars}</svg>`;
}

function lineChart(panel, width) {
  const rows = panel.result.rows;
  const unit = unitFor(panel);
  const height = 200;
  const pad = { top: 16, right: 14, bottom: 26, left: 56 };
  const max = niceMax(Math.max(...rows.map((r) => r.value ?? 0)));
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const pts = rows.map((r, i) => [
    pad.left + (rows.length === 1 ? innerW / 2 : (innerW * i) / (rows.length - 1)),
    pad.top + innerH - ((r.value ?? 0) / max) * innerH,
  ]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("");
  const area = `${line}L${pts[pts.length - 1][0]},${pad.top + innerH}L${pts[0][0]},${pad.top + innerH}Z`;
  const gid = `g-${panel.id}`;
  const labelEvery = Math.max(1, Math.ceil(rows.length / 7));
  let labels = "";
  let dots = "";
  rows.forEach((r, i) => {
    if (i % labelEvery === 0) {
      labels += `<text x="${pts[i][0]}" y="${height - 8}" text-anchor="middle">${esc(String(r.key).slice(5) || r.key)}</text>`;
    }
    dots += `<circle cx="${pts[i][0]}" cy="${pts[i][1]}" r="3.2" fill="#141821" stroke="${PALETTE[1]}" stroke-width="2"
      data-tip="${esc(`${r.key}: ${formatNumber(r.value)}${unit ? ` ${unit}` : ""}`)}" />`;
  });
  return `<svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(panel.title)} line chart">
    <defs><linearGradient id="${gid}" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="${PALETTE[1]}" stop-opacity="0.35"/><stop offset="100%" stop-color="${PALETTE[1]}" stop-opacity="0"/></linearGradient></defs>
    ${axis(width, height, pad, max, unit)}
    <path d="${area}" fill="url(#${gid})" />
    <path d="${line}" fill="none" stroke="${PALETTE[1]}" stroke-width="2" />
    ${dots}${labels}</svg>`;
}

function table(panel) {
  const unit = unitFor(panel);
  const r = panel.result;
  const rows = r.by ? r.rows : [{ key: "value", value: r.value }];
  return `<table class="data"><thead><tr><th>${esc(r.by || "")}</th><th style="text-align:right">${esc(r.agg)}${unit ? ` (${esc(unit)})` : ""}</th></tr></thead><tbody>
    ${rows.map((row) => `<tr><td>${esc(row.key)}</td><td class="num">${esc(formatNumber(row.value))}</td></tr>`).join("")}
  </tbody></table>`;
}

function stat(panel) {
  const r = panel.result;
  let value = r.value;
  if (r.by) value = r.rows.reduce((a, b) => a + (b.value ?? 0), 0) / (r.agg === "count" || r.agg === "sum" ? 1 : r.rows.length || 1);
  const unit = unitFor(panel);
  return `<div class="stat-value">${esc(formatNumber(value))}${unit ? `<span class="unit">${esc(unit)}</span>` : ""}</div>`;
}

function errorState(message) {
  return `<div class="error-state" role="alert">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l10 18H2z" stroke-linejoin="round"/><path d="M12 10v5M12 18v.01" stroke-linecap="round"/></svg>
    <div class="msg">${esc(message)}</div>
  </div>`;
}

function panelBody(panel, width) {
  if (panel.error) return errorState(panel.error);
  const r = panel.result;
  const empty = r.by ? !r.rows.length : r.value == null || (r.agg === "count" && r.value === 0 && panel.viz !== "stat");
  if (empty && panel.viz !== "stat") return `<div class="empty-state">No data for the selected filters</div>`;
  switch (panel.viz) {
    case "stat":
      return stat(panel);
    case "line":
      return r.by ? lineChart(panel, width) : stat(panel);
    case "table":
      return table(panel);
    case "bar":
    default:
      return r.by ? barChart(panel, width) : stat(panel);
  }
}

function renderVariables(data) {
  variablesEl.innerHTML = "";
  for (const v of data.variables) {
    const wrap = document.createElement("div");
    wrap.className = "variable";
    const id = `var-${v.name}`;
    wrap.innerHTML = `<label for="${esc(id)}">${esc(v.label || v.name)} <code>$${esc(v.name)}</code></label>
      <select class="var-select" id="${esc(id)}" name="${esc(v.name)}">
        ${v.options.map((o) => `<option value="${esc(o)}" ${o === v.value ? "selected" : ""}>${esc(o)}</option>`).join("")}
      </select>`;
    wrap.querySelector("select").addEventListener("change", (e) => {
      params.set(`var-${v.name}`, e.target.value);
      history.replaceState(null, "", `?${params}`);
      load();
    });
    variablesEl.appendChild(wrap);
  }
}

function renderPanels(data) {
  const ids = new Set(data.panels.map((p) => p.id));
  panelsEl.innerHTML = "";
  for (const panel of data.panels) {
    const span = Math.min(12, Math.max(2, Number(panel.width) || (panel.viz === "stat" ? 3 : 6)));
    const el = document.createElement("section");
    el.className = `panel ${panel.viz}${panel.error ? " has-error" : ""}`;
    if (knownPanelIds && !knownPanelIds.has(panel.id)) el.classList.add("is-new");
    el.style.gridColumn = `span ${span}`;
    el.dataset.panelId = panel.id;
    el.setAttribute("aria-label", `${panel.title} panel`);
    el.innerHTML = `<div class="panel-header"><h2 class="panel-title">${esc(panel.title)}</h2>
        ${panel.error ? `<span class="panel-error-badge" title="${esc(panel.error)}">!</span>` : `<span class="panel-badge">${esc(panel.viz)}</span>`}</div>
      <div class="panel-body"></div>
      <div class="panel-footer" title="${esc(panel.query)}">${esc(panel.query)}</div>`;
    panelsEl.appendChild(el);
    const body = el.querySelector(".panel-body");
    body.innerHTML = panelBody(panel, Math.max(260, body.clientWidth - 28));
  }
  knownPanelIds = ids;
}

function render(data) {
  lastData = data;
  document.title = `${data.title} · Copilot App Telemetry`;
  document.getElementById("dashboard-title").textContent = data.title;
  document.getElementById("time-range-label").textContent = data.timeRange || "Last 14 days";
  renderVariables(data);
  renderPanels(data);
  const errors = data.panels.filter((p) => p.error).length;
  statusEl.textContent = `${data.panels.length} panels · ${errors ? `${errors} with errors · ` : ""}updated ${new Date(data.renderedAt).toLocaleTimeString()}`;
}

async function load() {
  try {
    const res = await fetch(`/api/render?${params}`, { cache: "no-store" });
    render(await res.json());
  } catch (err) {
    statusEl.textContent = `Failed to load dashboard: ${err.message}`;
  }
}

panelsEl.addEventListener("mousemove", (e) => {
  const tip = e.target.closest("[data-tip]");
  if (!tip) {
    tooltip.style.display = "none";
    return;
  }
  tooltip.textContent = tip.dataset.tip;
  tooltip.style.display = "block";
  tooltip.style.left = `${e.clientX + 12}px`;
  tooltip.style.top = `${e.clientY + 12}px`;
});
panelsEl.addEventListener("mouseleave", () => (tooltip.style.display = "none"));

document.getElementById("refresh-btn").addEventListener("click", load);

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => lastData && renderPanels(lastData), 150);
});

function connect() {
  const es = new EventSource("/api/stream");
  es.addEventListener("open", () => liveEl.classList.remove("offline"));
  es.addEventListener("dashboard", load);
  es.addEventListener("data", load);
  es.addEventListener("error", () => liveEl.classList.add("offline"));
}

load();
connect();
setInterval(load, 30000);
