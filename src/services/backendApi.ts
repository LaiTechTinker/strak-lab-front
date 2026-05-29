// Real backend API client. Talks to the Flask backend in /backend.
// Activated when VITE_API_URL is set. Otherwise the app uses the mock in mockApi.ts.
import { io, type Socket } from "socket.io-client";
import {
  store,
  uid,
  type ColumnMeta,
  type Dataset,
  type Report,
  type TrainingJob,
  type TrainingResults,
} from "./store";

export const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "";
console.log("API_URL =", API_URL);
const TOKEN_KEY = "datalab_token";

export function getToken(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t: string | null) {
  if (typeof localStorage === "undefined") return;
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {});
  if (!(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${API_URL}/api${path}`, { ...init, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
  return data as T;
}

// ---------- Auth ----------
export async function signup(email: string, password: string) {
  const data = await request<{ token: string; user: { id: string; email: string } }>(`/auth/signup`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  return data.user;
}
export async function login(email: string, password: string) {
  const data = await request<{ token: string; user: { id: string; email: string } }>(`/auth/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  return data.user;
}
export function logout() {
  setToken(null);
}

// ---------- Datasets ----------
type BackendDataset = {
  id: string;
  name: string;
  rows?: Record<string, unknown>[];
  row_count?: number;
  columns: ColumnMeta[];
  created_at?: number;
};

function toDataset(d: BackendDataset): Dataset {
  return {
    id: d.id,
    name: d.name,
    rows: d.rows ?? [],
    columns: d.columns ?? [],
    createdAt: d.created_at ?? Date.now(),
  };
}

export async function uploadDataset(file: File): Promise<Dataset> {
  const fd = new FormData();
  fd.append("file", file);
  const data = await request<{ dataset: BackendDataset }>(`/datasets/upload`, {
    method: "POST",
    body: fd,
  });
  const ds = toDataset(data.dataset);
  store.datasets = [ds, ...store.datasets.filter((x) => x.id !== ds.id)];
  store.emit();
  return ds;
}

export async function listDatasets(): Promise<Dataset[]> {
  const data = await request<{ datasets: BackendDataset[] }>(`/datasets`);
  const list = data.datasets.map(toDataset);
  store.datasets = list;
  store.emit();
  return list;
}

export async function getDataset(id: string): Promise<Dataset | undefined> {
  const data = await request<{ dataset: BackendDataset }>(`/datasets/${id}`);
  const ds = toDataset(data.dataset);
  store.datasets = [ds, ...store.datasets.filter((x) => x.id !== ds.id)];
  store.emit();
  return ds;
}

export async function deleteDataset(id: string): Promise<void> {
  await request(`/datasets/${id}`, { method: "DELETE" });
  store.datasets = store.datasets.filter((d) => d.id !== id);
  store.reports = store.reports.filter((r) => r.datasetId !== id);
  store.jobs = store.jobs.filter((j) => j.datasetId !== id);
  store.emit();
}

// ---------- Reports ----------
type BackendReport = {
  id: string;
  datasetId: string;
  summary: string;
  insights: string[];
  issues: string[];
  chat?: { id: string; role: "user" | "assistant"; content: string; ts: number }[];
  created_at?: number;
};

function toReport(r: BackendReport): Report {
  return {
    id: r.id,
    datasetId: r.datasetId ,
    summary: r.summary,
    insights: r.insights || [],
    issues: r.issues || [],
    chat: r.chat || [],
    createdAt: r.created_at ?? Date.now(),
  };
}

export async function generateReport(datasetId: string): Promise<Report> {
  const data = await request<{ report: BackendReport }>(`/reports`, {
    method: "POST",
    body: JSON.stringify({ datasetId }),
  });
  const rep = toReport(data.report);
  console.log("response", rep);
  store.reports = [...store.reports.filter((x) => x.datasetId !== datasetId), rep];
  console.log("strore.reports", store.reports)
  store.emit();
  return rep;
}

export async function getReportByDataset(datasetId: string): Promise<Report | undefined> {
  return store.reports.find((r) => r.datasetId === datasetId);
}

export async function chatWithReport(datasetId: string, message: string): Promise<string> {
  const report = store.reports.find((r) => r.datasetId === datasetId);
  if (!report) throw new Error("Generate the report first.");
  const data = await request<{ messages: { id: string; role: "user" | "assistant"; content: string; ts: number }[] }>(
    `/reports/${report.id}/chat`,
   
    { method: "POST", body: JSON.stringify({ message }) },
  );
  for (const m of data.messages) report.chat.push(m);
  store.emit();
  const reply = data.messages.find((m) => m.role === "assistant");
  return reply?.content ?? "";
}

export async function downloadReportPdf(reportId: string): Promise<void> {
  const token = getToken();
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_URL}/api/reports/${reportId}/pdf`, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `report_${reportId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}


// ---------- AutoML ----------
type BackendJob = {
  id: string;
  dataset_id: string;
  target: string;
  problem_type: "classification" | "regression";
  test_size: number;
  random_state: number;
  status: TrainingJob["status"];
  progress: number;
  logs?: string[];
  results?: TrainingResults;
  created_at?: number;
};

type BackendJobAny = BackendJob & {
  datasetId?: string;
  problemType?: "classification" | "regression";
  testSize?: number;
  randomState?: number;
  createdAt?: number;
};

function toJob(j: BackendJob): TrainingJob {
  const x = j as BackendJobAny;
  return {
    id: j.id,
    datasetId: x.datasetId ?? j.dataset_id,
    target: j.target,
    problemType: x.problemType ?? j.problem_type,
    testSize: x.testSize ?? j.test_size,
    randomState: x.randomState ?? j.random_state,
    status: j.status,
    progress: j.progress ?? 0,
    logs: j.logs ?? [],
    results: j.results,
    createdAt: x.createdAt ?? j.created_at ?? Date.now(),
  };
}



let _socket: Socket | null = null;
function getSocket(): Socket {
  if (_socket && _socket.connected) return _socket;
  _socket = io(`${API_URL}/training`, {
    auth: { token: getToken() },
    transports: ["websocket", "polling"],
  });
  return _socket;
}

type JobListener = (job: TrainingJob) => void;
const jobListeners = new Map<string, Set<JobListener>>();

function emitJob(job: TrainingJob) {
  jobListeners.get(job.id)?.forEach((l) => l({ ...job, logs: [...job.logs] }));
  store.emit();
}

function patchJob(jobId: string, patch: Partial<TrainingJob> & { log?: string }) {
  const idx = store.jobs.findIndex((j) => j.id === jobId);
  if (idx === -1) return;
  const j = store.jobs[idx];
  if (patch.log) j.logs.push(patch.log);
  if (patch.status) j.status = patch.status;
  if (typeof patch.progress === "number") j.progress = patch.progress;
  if (patch.results) j.results = patch.results;
  emitJob(j);
}

export function subscribeJob(jobId: string, l: JobListener) {
  if (!jobListeners.has(jobId)) jobListeners.set(jobId, new Set());
  jobListeners.get(jobId)!.add(l);

  const sock = getSocket();
  const onUpdate = (p: { jobId: string; log?: string; status?: TrainingJob["status"]; progress?: number }) => {
    if (p.jobId === jobId) patchJob(jobId, p);
  };
  const onDone = (p: { jobId: string; results: TrainingResults }) => {
    if (p.jobId === jobId) patchJob(jobId, { results: p.results, status: "completed", progress: 100 });
  };
  sock.on("job:update", onUpdate);
  sock.on("job:done", onDone);

  const subscribe = () => sock.emit("subscribe", { jobId });
  if (sock.connected) subscribe();
  else sock.once("connect", subscribe);


  return () => {
    jobListeners.get(jobId)?.delete(l);
    sock.off("job:update", onUpdate);
    sock.off("job:done", onDone);
  };
}

export async function startTraining(params: {
  datasetId: string;
  target: string;
  problemType: "classification" | "regression";
  testSize: number;
  randomState: number;
}): Promise<TrainingJob> {
  const data = await request<{ job: BackendJob }>(`/automl/jobs`, {
    method: "POST",
    body: JSON.stringify(params),
  });
  const job = toJob(data.job);
  // Ensure logs array exists
  if (!job.logs.length) job.logs = [`[${new Date().toLocaleTimeString()}] Job ${uid("queued")}`];
  store.jobs = [job, ...store.jobs.filter((j) => j.id !== job.id)];
  store.emit();
  return job;
}

export function getJob(id: string) {
  return store.jobs.find((j) => j.id === id);
}
export function getJobsByDataset(datasetId: string) {
  return store.jobs.filter((j) => j.datasetId === datasetId);
}
