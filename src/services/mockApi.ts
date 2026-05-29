import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  store,
  uid,
  type ColumnMeta,
  type Dataset,
  type Report,
  type TrainingJob,
  type TrainingResults,
} from "./store";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function inferColumns(rows: Record<string, unknown>[]): ColumnMeta[] {
  if (rows.length === 0) return [];
  const keys = Object.keys(rows[0]);
  return keys.map((name) => {
    let missing = 0;
    let numCount = 0;
    let boolCount = 0;
    let dateCount = 0;
    for (const r of rows) {
      const v = r[name];
      if (v === null || v === undefined || v === "") {
        missing++;
        continue;
      }
      if (typeof v === "number" || (!isNaN(Number(v)) && typeof v !== "boolean")) numCount++;
      else if (typeof v === "boolean" || v === "true" || v === "false") boolCount++;
      else if (!isNaN(Date.parse(String(v)))) dateCount++;
    }
    const nonMissing = rows.length - missing;
    let type: ColumnMeta["type"] = "string";
    if (numCount / Math.max(1, nonMissing) > 0.8) type = "number";
    else if (boolCount / Math.max(1, nonMissing) > 0.8) type = "boolean";
    else if (dateCount / Math.max(1, nonMissing) > 0.8) type = "date";
    return { name, type, missing };
  });
}

function coerceRows(rows: Record<string, unknown>[], cols: ColumnMeta[]) {
  return rows.map((r) => {
    const out: Record<string, unknown> = {};
    for (const c of cols) {
      const v = r[c.name];
      if (v === null || v === undefined || v === "") {
        out[c.name] = null;
      } else if (c.type === "number") {
        const n = Number(v);
        out[c.name] = isNaN(n) ? null : n;
      } else {
        out[c.name] = v;
      }
    }
    return out;
  });
}

export async function uploadDataset(file: File): Promise<Dataset> {
  await delay(300);
  let rows: Record<string, unknown>[] = [];
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "csv") {
    const text = await file.text();
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true, dynamicTyping: true });
    rows = parsed.data as Record<string, unknown>[];
  } else if (ext === "xlsx" || ext === "xls") {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(sheet);
  } else {
    throw new Error("Unsupported file type. Use CSV or XLSX.");
  }
  if (rows.length === 0) throw new Error("File contains no rows.");
  const columns = inferColumns(rows);
  const ds: Dataset = {
    id: uid("ds"),
    name: file.name,
    rows: coerceRows(rows, columns),
    columns,
    createdAt: Date.now(),
  };
  store.datasets.unshift(ds);
  store.emit();
  return ds;
}

export async function listDatasets(): Promise<Dataset[]> {
  await delay(80);
  return store.datasets;
}

export async function getDataset(id: string): Promise<Dataset | undefined> {
  await delay(80);
  return store.datasets.find((d) => d.id === id);
}

export async function deleteDataset(id: string): Promise<void> {
  await delay(120);
  store.datasets = store.datasets.filter((d) => d.id !== id);
  store.reports = store.reports.filter((r) => r.datasetId !== id);
  store.jobs = store.jobs.filter((j) => j.datasetId !== id);
  store.emit();
}

export async function generateReport(datasetId: string): Promise<Report> {
  await delay(900);
  const ds = store.datasets.find((d) => d.id === datasetId);
  if (!ds) throw new Error("Dataset not found");
  const numCols = ds.columns.filter((c) => c.type === "number");
  const totalMissing = ds.columns.reduce((s, c) => s + c.missing, 0);
  const issues: string[] = [];
  if (totalMissing > 0) issues.push(`${totalMissing} missing values across ${ds.columns.filter((c) => c.missing > 0).length} columns.`);
  const dupCount = ds.rows.length - new Set(ds.rows.map((r) => JSON.stringify(r))).size;
  if (dupCount > 0) issues.push(`${dupCount} duplicate rows detected.`);
  if (numCols.length === 0) issues.push("No numeric columns detected — limited analytical power.");

  const insights: string[] = [
    `Dataset contains ${ds.rows.length.toLocaleString()} rows and ${ds.columns.length} columns.`,
    `Numeric columns: ${numCols.map((c) => c.name).join(", ") || "none"}.`,
  ];
  if (numCols[0]) {
    const vals = ds.rows.map((r) => Number(r[numCols[0].name])).filter((n) => !isNaN(n));
    const avg = vals.reduce((a, b) => a + b, 0) / Math.max(1, vals.length);
    insights.push(`Mean of "${numCols[0].name}" is ${avg.toFixed(2)}.`);
  }
  const r: Report = {
    id: uid("rep"),
    datasetId,
    summary: `This dataset "${ds.name}" has ${ds.rows.length} records with ${ds.columns.length} attributes. The structure looks ${
      issues.length === 0 ? "clean and analysis-ready" : "usable but requires light cleaning"
    }.`,
    insights,
    issues: issues.length ? issues : ["No major data quality issues detected."],
    createdAt: Date.now(),
    chat: [],
  };
  store.reports = store.reports.filter((x) => x.datasetId !== datasetId);
  store.reports.push(r);
  store.emit();
  return r;
}

export async function getReportByDataset(datasetId: string): Promise<Report | undefined> {
  return store.reports.find((r) => r.datasetId === datasetId);
}

export async function downloadReportPdf(_reportId: string): Promise<void> {
  // Mock backend doesn't generate real PDFs.
  return Promise.resolve();
}

export async function chatWithReport(datasetId: string, message: string): Promise<string> {


  await delay(700 + Math.random() * 600);
  const ds = store.datasets.find((d) => d.id === datasetId);

  if (!ds) throw new Error("Dataset not found");
  const lower = message.toLowerCase();
  const numCols = ds.columns.filter((c) => c.type === "number");

  let reply = "";
  if (lower.includes("missing") || lower.includes("null")) {
    const missing = ds.columns.filter((c) => c.missing > 0);
    reply = missing.length
      ? `Columns with missing values: ${missing.map((c) => `${c.name} (${c.missing})`).join(", ")}.`
      : "No missing values were detected in this dataset.";
  } else if (lower.includes("column") || lower.includes("schema")) {
    reply = `The dataset has ${ds.columns.length} columns: ${ds.columns.map((c) => `${c.name} (${c.type})`).join(", ")}.`;
  } else if (lower.includes("row") || lower.includes("size")) {
    reply = `It contains ${ds.rows.length.toLocaleString()} rows.`;
  } else if (lower.includes("mean") || lower.includes("average") || lower.includes("avg")) {
    const stats = numCols.slice(0, 5).map((c) => {
      const vals = ds.rows.map((r) => Number(r[c.name])).filter((n) => !isNaN(n));
      const avg = vals.reduce((a, b) => a + b, 0) / Math.max(1, vals.length);
      return `${c.name}: ${avg.toFixed(2)}`;
    });
    reply = stats.length ? `Average values — ${stats.join("; ")}.` : "There are no numeric columns to average.";
  } else {
    reply = `Based on the dataset, ${ds.rows.length} records across ${ds.columns.length} fields are available. Try asking about missing values, column types, averages, or row count.`;
  }
  const report = store.reports.find((r) => r.datasetId === datasetId);
  if (report) {
    report.chat.push(
      { id: uid("m"), role: "user", content: message, ts: Date.now() },
      { id: uid("m"), role: "assistant", content: reply, ts: Date.now() + 1 },
    );
    store.emit();
  }
  return reply;
}

// ----- AutoML mock with socket-like emitter -----
type JobListener = (job: TrainingJob) => void;
const jobListeners = new Map<string, Set<JobListener>>();

export function subscribeJob(jobId: string, l: JobListener) {
  if (!jobListeners.has(jobId)) jobListeners.set(jobId, new Set());
  jobListeners.get(jobId)!.add(l);
  return () => jobListeners.get(jobId)?.delete(l);
}
function emitJob(job: TrainingJob) {
  jobListeners.get(job.id)?.forEach((l) => l({ ...job, logs: [...job.logs] }));
  store.emit();
}

export async function startTraining(params: {
  datasetId: string;
  target: string;
  problemType: "classification" | "regression";
  testSize: number;
  randomState: number;
}): Promise<TrainingJob> {
  await delay(150);
  const ds = store.datasets.find((d) => d.id === params.datasetId);
  if (!ds) throw new Error("Dataset not found");
  const job: TrainingJob = {
    id: uid("job"),
    ...params,
    status: "queued",
    progress: 0,
    logs: [`[${new Date().toLocaleTimeString()}] Job queued for dataset ${ds.name}`],
    createdAt: Date.now(),
  };
  store.jobs.unshift(job);
  emitJob(job);
  // simulate run
  runMockTraining(job, ds);
  return job;
}

function runMockTraining(job: TrainingJob, ds: { rows: unknown[]; columns: ColumnMeta[] }) {
  const steps = [
    "Loading dataset...",
    "Splitting train/test...",
    "Encoding categorical features...",
    "Imputing missing values...",
    "Training candidate model 1/3 (GradientBoosting)...",
    "Training candidate model 2/3 (RandomForest)...",
    "Training candidate model 3/3 (LogisticRegression)...",
    "Evaluating on test set...",
    "Selecting best model...",
    "Finalizing pipeline...",
  ];
  let i = 0;
  job.status = "running";
  job.logs.push(`[${new Date().toLocaleTimeString()}] Training started (${job.problemType}) on target "${job.target}"`);
  emitJob(job);

  const tick = () => {
    if (i >= steps.length) {
      // results
      const isClassification = job.problemType === "classification";
      const metrics: Record<string, number> = isClassification
        ? {
            accuracy: 0.82 + Math.random() * 0.13,
            precision: 0.78 + Math.random() * 0.15,
            recall: 0.76 + Math.random() * 0.17,
            f1: 0.78 + Math.random() * 0.15,
          }
        : {
            r2: 0.7 + Math.random() * 0.25,
            rmse: 0.2 + Math.random() * 0.4,
            mae: 0.15 + Math.random() * 0.3,
          };
      const features = ds.columns.filter((c) => c.name !== job.target).slice(0, 8);
      const featureImportance = features
        .map((c) => ({ feature: c.name, importance: Number(Math.random().toFixed(3)) }))
        .sort((a, b) => b.importance - a.importance);
      const results: TrainingResults = {
        metrics,
        featureImportance,
        confusionMatrix: isClassification
          ? [
              [Math.floor(40 + Math.random() * 30), Math.floor(2 + Math.random() * 8)],
              [Math.floor(3 + Math.random() * 8), Math.floor(40 + Math.random() * 30)],
            ]
          : undefined,
        modelSummary: isClassification
          ? "GradientBoostingClassifier (n_estimators=200, max_depth=4) selected as best model."
          : "GradientBoostingRegressor (n_estimators=200, max_depth=4) selected as best model.",
      };
      job.results = results;
      job.status = "completed";
      job.progress = 100;
      job.logs.push(`[${new Date().toLocaleTimeString()}] Training complete`);
      emitJob(job);
      return;
    }
    job.progress = Math.round(((i + 1) / steps.length) * 100);
    job.logs.push(`[${new Date().toLocaleTimeString()}] ${steps[i]}`);
    emitJob(job);
    i++;
    setTimeout(tick, 700 + Math.random() * 500);
  };
  setTimeout(tick, 500);
}

export function getJob(id: string) {
  return store.jobs.find((j) => j.id === id);
}
export function getJobsByDataset(datasetId: string) {
  return store.jobs.filter((j) => j.datasetId === datasetId);
}
