// In-memory mock backend store. Persists across navigations within the session.
export type ColumnMeta = {
  name: string;
  type: "number" | "string" | "boolean" | "date";
  missing: number;
};

export type Dataset = {
  id: string;
  name: string;
  rows: Record<string, unknown>[];
  columns: ColumnMeta[];
  createdAt: number;
};

export type ChatMessage = { id: string; role: "user" | "assistant"; content: string; ts: number };

export type Report = {
  id: string;
  datasetId: string;
  summary: string;
  insights: string[];
  issues: string[];
  createdAt: number;
  chat: ChatMessage[];
};

export type TrainingJob = {
  id: string;
  datasetId: string;
  target: string;
  problemType: "classification" | "regression";
  testSize: number;
  randomState: number;
  status: "queued" | "running" | "completed" | "failed";
  progress: number;
  logs: string[];
  results?: TrainingResults;
  createdAt: number;
};

export type TrainingResults = {
  metrics: Record<string, number>;
  featureImportance: { feature: string; importance: number }[];
  confusionMatrix?: number[][];
  modelSummary: string;
  // additional metadata (not numeric)
  problemType?: "classification" | "regression";
  bestModel?: string | null;
  bestModelMetrics?: unknown;
};

type Listener = () => void;

class Store {
  datasets: Dataset[] = [];
  reports: Report[] = [];
  jobs: TrainingJob[] = [];
  private listeners = new Set<Listener>();

  subscribe(l: Listener) {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }
  emit() {
    this.listeners.forEach((l) => l());
  }
}

export const store = new Store();

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}
