import type { DashboardMetric } from "./dashboard.js";

// --- small helpers -------------------------------------------------------------

function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function humanize(key: string): string {
  return key
    .replace(/_/gu, " ")
    .replace(/\bpct\b/giu, "%")
    .replace(/^\w/u, (char) => char.toUpperCase());
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Postgres returns count()/numeric as strings, so treat numeric-looking strings
// as numbers too.
function asNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

// Real rows are objects that are not the SQL "is_placeholder" empty-state marker.
function realRows(rows: unknown[]): Record<string, unknown>[] {
  return rows.filter(
    (row): row is Record<string, unknown> => isRecord(row) && row.is_placeholder !== true
  );
}

function displayKeys(row: Record<string, unknown>): string[] {
  return Object.keys(row).filter((key) => key !== "is_placeholder");
}

type Series = { labelKey: string; valueKey: string; points: { label: string; value: number }[] };

// Generic label/value extraction: first non-numeric column is the label, first
// numeric column is the value. Good enough for the ported aggregations.
function pickSeries(rows: Record<string, unknown>[]): Series | null {
  const [first] = rows;
  if (!first) {
    return null;
  }

  const keys = displayKeys(first);
  const labelKey = keys.find((key) => asNumber(first[key]) === null) ?? keys[0];
  const valueKey = keys.find((key) => key !== labelKey && asNumber(first[key]) !== null);
  if (!labelKey || !valueKey) {
    return null;
  }

  const points = rows.map((row) => ({
    label: String(row[labelKey] ?? ""),
    value: asNumber(row[valueKey]) ?? 0
  }));

  return { labelKey, valueKey, points };
}

// --- per display-type renderers ------------------------------------------------

function renderEmpty(message: string): string {
  return `<p class="empty">${escapeHtml(message)}</p>`;
}

function renderStatCards(rows: Record<string, unknown>[]): string {
  const [row] = rows;
  if (!row) {
    return renderEmpty("No data yet.");
  }

  const cards = displayKeys(row)
    .map(
      (key) =>
        `<div class="stat"><span class="stat-value">${escapeHtml(row[key])}</span>` +
        `<span class="stat-label">${escapeHtml(humanize(key))}</span></div>`
    )
    .join("");

  return `<div class="stats">${cards}</div>`;
}

function renderBars(series: Series): string {
  const max = Math.max(...series.points.map((point) => point.value), 0);
  const rows = series.points
    .map((point) => {
      const width = max > 0 ? Math.max((point.value / max) * 100, 1) : 0;
      return (
        `<div class="bar-row"><span class="bar-label" title="${escapeHtml(point.label)}">` +
        `${escapeHtml(point.label)}</span>` +
        `<span class="bar-track"><span class="bar-fill" style="width:${width.toFixed(1)}%"></span></span>` +
        `<span class="bar-value">${escapeHtml(point.value)}</span></div>`
      );
    })
    .join("");

  return `<div class="bars">${rows}</div>`;
}

function renderLine(series: Series): string {
  const { points } = series;
  if (points.length < 2) {
    return renderBars(series);
  }

  const width = 100;
  const height = 32;
  const max = Math.max(...points.map((point) => point.value), 0);
  const stepX = width / (points.length - 1);
  const coords = points
    .map((point, index) => {
      const x = index * stepX;
      const y = max > 0 ? height - (point.value / max) * height : height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const first = points[0]?.label ?? "";
  const last = points[points.length - 1]?.label ?? "";

  return (
    `<svg class="spark" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" ` +
    `aria-label="${escapeHtml(series.valueKey)} over time">` +
    `<polyline points="${coords}" fill="none" stroke="currentColor" stroke-width="1.5" ` +
    `vector-effect="non-scaling-stroke" /></svg>` +
    `<div class="axis"><span>${escapeHtml(first)}</span><span>${escapeHtml(last)}</span></div>`
  );
}

function renderTable(rows: Record<string, unknown>[]): string {
  const [first] = rows;
  if (!first) {
    return renderEmpty("No data yet.");
  }

  const keys = displayKeys(first);
  const head = keys.map((key) => `<th>${escapeHtml(humanize(key))}</th>`).join("");
  const body = rows
    .map(
      (row) => `<tr>${keys.map((key) => `<td>${escapeHtml(row[key] ?? "")}</td>`).join("")}</tr>`
    )
    .join("");

  return `<table class="grid"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function renderBody(metric: DashboardMetric): string {
  if (metric.error) {
    return `<p class="error">Query failed: ${escapeHtml(metric.error)}</p>`;
  }

  if (metric.generatedAt === null) {
    return renderEmpty("Not collected yet.");
  }

  const rows = realRows(metric.rows);
  if (rows.length === 0) {
    return renderEmpty("No data yet.");
  }

  switch (metric.display) {
    case "value":
      return renderStatCards(rows);
    case "table":
      return renderTable(rows);
    case "line": {
      const series = pickSeries(rows);
      return series ? renderLine(series) : renderTable(rows);
    }
    case "bar": {
      const series = pickSeries(rows);
      return series ? renderBars(series) : renderTable(rows);
    }
    default:
      return renderTable(rows);
  }
}

function renderMeta(metric: DashboardMetric): string {
  const stamp = metric.generatedAt
    ? `Updated ${escapeHtml(metric.generatedAt)}`
    : "Awaiting first run";
  return `<span class="meta">${stamp}</span>`;
}

function renderCard(metric: DashboardMetric): string {
  return (
    `<section class="card" data-display="${escapeHtml(metric.display)}">` +
    `<header><h2>${escapeHtml(metric.title)}</h2>${renderMeta(metric)}</header>` +
    `<div class="body">${renderBody(metric)}</div></section>`
  );
}

const STYLES = `
  :root { color-scheme: light dark; --bg:#0f1115; --panel:#171a21; --ink:#e7e9ee;
    --muted:#8b909c; --rule:#272b34; --accent:#6aa7ff; --bar:#3a6ee0; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--ink);
    font:15px/1.5 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif; }
  header.top { padding:1.5rem 2rem; border-bottom:1px solid var(--rule); }
  header.top h1 { margin:0; font-size:1.15rem; font-weight:600; letter-spacing:-0.01em; }
  header.top p { margin:.25rem 0 0; color:var(--muted); font-size:.85rem; }
  main { display:grid; gap:1rem; grid-template-columns:repeat(auto-fill,minmax(20rem,1fr));
    padding:1.5rem 2rem; align-items:start; }
  .card { background:var(--panel); border:1px solid var(--rule); border-radius:.75rem;
    padding:1rem 1.1rem; }
  .card header { display:flex; justify-content:space-between; align-items:baseline; gap:.5rem;
    margin-bottom:.85rem; }
  .card h2 { margin:0; font-size:.92rem; font-weight:600; }
  .meta { color:var(--muted); font-size:.7rem; white-space:nowrap; }
  .stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(7rem,1fr)); gap:.75rem; }
  .stat { display:flex; flex-direction:column; gap:.15rem; }
  .stat-value { font-size:1.5rem; font-weight:650; letter-spacing:-0.02em; }
  .stat-label { color:var(--muted); font-size:.72rem; }
  .bars { display:grid; gap:.4rem; }
  .bar-row { display:grid; grid-template-columns:8rem 1fr auto; align-items:center; gap:.6rem;
    font-size:.8rem; }
  .bar-label { color:var(--muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .bar-track { background:var(--rule); border-radius:999px; height:.55rem; overflow:hidden; }
  .bar-fill { display:block; height:100%; background:var(--bar); border-radius:999px; }
  .bar-value { font-variant-numeric:tabular-nums; }
  .spark { width:100%; height:4rem; color:var(--accent); display:block; }
  .axis { display:flex; justify-content:space-between; color:var(--muted); font-size:.68rem;
    margin-top:.3rem; }
  table.grid { width:100%; border-collapse:collapse; font-size:.78rem; }
  table.grid th, table.grid td { text-align:left; padding:.35rem .5rem;
    border-bottom:1px solid var(--rule); }
  table.grid th { color:var(--muted); font-weight:600; }
  .empty, .error { color:var(--muted); font-size:.82rem; margin:.25rem 0; }
  .error { color:#f0a08a; }
`;

// Full server-rendered dashboard page. Pure function of the metric list so it is
// trivially testable and needs no client framework.
export function renderDashboard(metrics: DashboardMetric[]): string {
  const cards = metrics.map(renderCard).join("");
  const body = metrics.length > 0 ? cards : renderEmpty("No metrics configured.");

  return (
    `<!doctype html><html lang="en"><head><meta charset="utf-8" />` +
    `<meta name="viewport" content="width=device-width, initial-scale=1" />` +
    `<meta name="robots" content="noindex, nofollow" />` +
    `<title>femi monitoring</title><style>${STYLES}</style></head>` +
    `<body><header class="top"><h1>femi monitoring</h1>` +
    `<p>Internal product metrics. Snapshots are refreshed by the worker.</p></header>` +
    `<main>${body}</main></body></html>`
  );
}
