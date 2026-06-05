#!/usr/bin/env node
/**
 * Creates a Redash dashboard comparing AB vs AB2 by platform.
 *
 * Requires:
 *   REDASH_URL       e.g. https://redash.visable.com/
 *   REDASH_API_KEY   your Redash user API key
 *
 * Usage:
 *   node scripts/create_ab_ab2_platform_dashboard.mjs
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DATA_SOURCE_ID = 1;
const TAGS = ["pm-self-service", "active-buyers", "ab-ab2"];

const REDASH_URL = process.env.REDASH_URL?.replace(/\/$/, "");
const REDASH_API_KEY = process.env.REDASH_API_KEY;

if (!REDASH_URL || !REDASH_API_KEY) {
  console.error(
    "Missing REDASH_URL or REDASH_API_KEY. Export both before running this script."
  );
  process.exit(1);
}

function loadSql(filename) {
  return readFileSync(join(ROOT, "redash", "queries", filename), "utf8");
}

async function redash(path, { method = "GET", body } = {}) {
  const response = await fetch(`${REDASH_URL}${path}`, {
    method,
    headers: {
      Authorization: `Key ${REDASH_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(
      `Redash ${method} ${path} failed (${response.status}): ${JSON.stringify(data)}`
    );
  }

  return data;
}

async function createQuery({ name, description, query, tags = TAGS }) {
  const created = await redash("/api/queries", {
    method: "POST",
    body: {
      name,
      description,
      query,
      data_source_id: DATA_SOURCE_ID,
      tags,
      options: { apply_auto_limit: true },
    },
  });
  return created;
}

async function executeQuery(queryId) {
  const result = await redash(`/api/queries/${queryId}/results`, {
    method: "POST",
    body: { max_age: 0 },
  });

  let job = result.job;
  while (job && job.status !== 3 && job.status !== 4) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    job = await redash(`/api/jobs/${job.id}`);
  }

  if (!job || job.status === 4) {
    throw new Error(`Query ${queryId} failed: ${job?.error ?? "unknown error"}`);
  }

  return redash(`/api/queries/${queryId}/results/${job.query_result_id}.json`);
}

async function createVisualization({ queryId, type, name, options }) {
  return redash("/api/visualizations", {
    method: "POST",
    body: {
      query_id: queryId,
      type,
      name,
      options,
    },
  });
}

async function createDashboard(name) {
  return redash("/api/dashboards", {
    method: "POST",
    body: { name, tags: TAGS },
  });
}

async function createWidget({ dashboardId, visualizationId, width, row, col, sizeY = 8 }) {
  return redash("/api/widgets", {
    method: "POST",
    body: {
      dashboard_id: dashboardId,
      visualization_id: visualizationId,
      width,
      options: {
        position: {
          autoHeight: false,
          sizeX: width,
          sizeY,
          col,
          row,
        },
        isHidden: false,
      },
    },
  });
}

function chartOptions({ x, yColumns, seriesType = "line", globalSeriesType = "line" }) {
  const columnMapping = { [x]: "x" };
  const seriesOptions = {};

  for (const column of yColumns) {
    columnMapping[column] = "y";
    seriesOptions[column] = {
      name: column.toUpperCase(),
      type: seriesType,
      yAxis: 0,
    };
  }

  return {
    globalSeriesType,
    sortX: true,
    legend: { enabled: true, placement: "auto", traceorder: "normal" },
    xAxis: { type: "datetime", labels: { enabled: true } },
    yAxis: [{ type: "linear" }, { type: "linear", opposite: true }],
    alignYAxesAtZero: true,
    series: { stacking: null, error_y: { type: "data", visible: true } },
    seriesOptions,
    columnMapping,
    valuesOptions: {},
    numberFormat: "0,0",
    percentFormat: "0[.]00%",
    textFormat: "",
    missingValuesAsZero: true,
    showDataLabels: false,
    dateTimeFormat: "YYYY-MM",
  };
}

function counterOptions(label, column) {
  return {
    counterLabel: label,
    counterColName: column,
    rowNumber: 1,
    targetRowNumber: 1,
    stringDecimal: 0,
    stringDecChar: ".",
    stringThouSep: ",",
  };
}

function tableOptions() {
  return {
    itemsPerPage: 25,
    columns: [
      { numberFormat: "0,0", name: "month", type: "date", displayAs: "datetime", dateTimeFormat: "YYYY-MM-DD" },
      { name: "platform", type: "string" },
      { numberFormat: "0,0", name: "ab", type: "integer" },
      { numberFormat: "0,0", name: "ab2", type: "integer" },
      { numberFormat: "0,0.0", name: "ab2_rate_pct", type: "float" },
    ],
  };
}

async function main() {
  console.log("Creating Redash dashboard: AB vs AB2 by Platform");

  const monthlySql = loadSql("ab-ab2-by-platform-monthly.sql");
  const latestSql = loadSql("ab-ab2-by-platform-latest-month.sql");
  const kpiSql = loadSql("ab-ab2-by-platform-kpis.sql");

  const monthlyQuery = await createQuery({
    name: "Monthly AB vs AB2 by Platform",
    description: "Monthly distinct active buyers (AB) and positive-reply buyers (AB2) split by platform.",
    query: monthlySql,
  });
  console.log(`Created monthly query: ${monthlyQuery.id}`);

  const latestQuery = await createQuery({
    name: "Latest Month AB vs AB2 by Platform",
    description: "Most recent month AB and AB2 counts by platform for bar comparison.",
    query: latestSql,
  });
  console.log(`Created latest-month query: ${latestQuery.id}`);

  const kpiQuery = await createQuery({
    name: "Latest Month AB vs AB2 KPIs by Platform",
    description: "Single-row KPI snapshot for AB and AB2 counters by platform.",
    query: kpiSql,
  });
  console.log(`Created KPI query: ${kpiQuery.id}`);

  console.log("Validating queries...");
  await executeQuery(monthlyQuery.id);
  const latestResults = await executeQuery(latestQuery.id);
  const kpiResults = await executeQuery(kpiQuery.id);
  console.log(`Latest month preview: ${JSON.stringify(latestResults.query_result?.data?.rows ?? [])}`);
  console.log(`KPI preview: ${JSON.stringify(kpiResults.query_result?.data?.rows ?? [])}`);

  const monthlyTable = await createVisualization({
    queryId: monthlyQuery.id,
    type: "TABLE",
    name: "Monthly AB vs AB2 Table",
    options: tableOptions(),
  });

  const abTrendByPlatform = await createVisualization({
    queryId: monthlyQuery.id,
    type: "CHART",
    name: "Monthly AB by Platform",
    options: {
      ...chartOptions({ x: "month", yColumns: ["ab"], seriesType: "line" }),
      columnMapping: { month: "x", platform: "series", ab: "y" },
      seriesOptions: { ab: { name: "AB", type: "line", yAxis: 0 } },
    },
  });

  const ab2TrendByPlatform = await createVisualization({
    queryId: monthlyQuery.id,
    type: "CHART",
    name: "Monthly AB2 by Platform",
    options: {
      ...chartOptions({ x: "month", yColumns: ["ab2"], seriesType: "line" }),
      columnMapping: { month: "x", platform: "series", ab2: "y" },
      seriesOptions: { ab2: { name: "AB2", type: "line", yAxis: 0 } },
    },
  });

  const ab2RateTrend = await createVisualization({
    queryId: monthlyQuery.id,
    type: "CHART",
    name: "AB2 Rate (%) by Platform",
    options: {
      ...chartOptions({ x: "month", yColumns: ["ab2_rate_pct"], seriesType: "line" }),
      columnMapping: { month: "x", platform: "series", ab2_rate_pct: "y" },
      seriesOptions: { ab2_rate_pct: { name: "AB2 Rate %", type: "line", yAxis: 0 } },
      numberFormat: "0,0.0",
    },
  });

  const platformBar = await createVisualization({
    queryId: latestQuery.id,
    type: "CHART",
    name: "Latest Month AB vs AB2 by Platform",
    options: {
      ...chartOptions({
        x: "platform",
        yColumns: ["ab", "ab2"],
        seriesType: "column",
        globalSeriesType: "column",
      }),
      xAxis: { type: "-", labels: { enabled: true } },
    },
  });

  const kpiCounters = [
    { label: "EP AB", column: "ep_ab" },
    { label: "EP AB2", column: "ep_ab2" },
    { label: "WLW AB", column: "wlw_ab" },
    { label: "WLW AB2", column: "wlw_ab2" },
    { label: "Total AB", column: "total_ab" },
    { label: "Total AB2", column: "total_ab2" },
  ];

  const counterVisualizations = [];
  for (const { label, column } of kpiCounters) {
    const viz = await createVisualization({
      queryId: kpiQuery.id,
      type: "COUNTER",
      name: label,
      options: counterOptions(label, column),
    });
    counterVisualizations.push({ label, viz });
  }

  const dashboard = await createDashboard("AB vs AB2 by Platform");
  console.log(`Created dashboard: ${dashboard.id}`);

  let row = 0;
  let col = 0;

  for (const { viz } of counterVisualizations) {
    await createWidget({
      dashboardId: dashboard.id,
      visualizationId: viz.id,
      width: 2,
      row,
      col,
      sizeY: 4,
    });
    col += 2;
    if (col >= 6) {
      col = 0;
      row += 4;
    }
  }

  if (col !== 0) {
    row += 4;
  }

  await createWidget({
    dashboardId: dashboard.id,
    visualizationId: abTrendByPlatform.id,
    width: 6,
    row,
    col: 0,
    sizeY: 10,
  });
  row += 10;

  await createWidget({
    dashboardId: dashboard.id,
    visualizationId: ab2TrendByPlatform.id,
    width: 6,
    row,
    col: 0,
    sizeY: 10,
  });
  row += 10;

  await createWidget({
    dashboardId: dashboard.id,
    visualizationId: platformBar.id,
    width: 6,
    row,
    col: 0,
    sizeY: 10,
  });
  row += 10;

  await createWidget({
    dashboardId: dashboard.id,
    visualizationId: ab2RateTrend.id,
    width: 6,
    row,
    col: 0,
    sizeY: 10,
  });
  row += 10;

  await createWidget({
    dashboardId: dashboard.id,
    visualizationId: monthlyTable.id,
    width: 6,
    row,
    col: 0,
    sizeY: 12,
  });

  const dashboardUrl = `${REDASH_URL}/dashboards/${dashboard.id}`;
  console.log("\nDashboard created successfully.");
  console.log(`URL: ${dashboardUrl}`);
  console.log(`Monthly query ID: ${monthlyQuery.id}`);
  console.log(`Latest-month query ID: ${latestQuery.id}`);
  console.log(`KPI query ID: ${kpiQuery.id}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
