import { useEffect, useState } from "react";
import { useStoreSnapshot } from "@/hooks/useStore";
import { startTraining, subscribeJob } from "@/services/api";
import type { Dataset, TrainingJob } from "@/services/store";
import { ProgressBar } from "@/components/ProgressBar";
import { LogConsole } from "@/components/LogConsole";

type Props = {
  dataset: Dataset;
  onJobStarted: (jobId: string) => void;
  activeJobId: string | null;
};

export function AutoMLTab({ dataset, onJobStarted, activeJobId }: Props) {
  const [target, setTarget] = useState(dataset.columns[dataset.columns.length - 1]?.name ?? "");
  const [problemType, setProblemType] = useState<"classification" | "regression">("classification");
  const [testSize, setTestSize] = useState(0.2);
  const [randomState, setRandomState] = useState(42);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const jobs = useStoreSnapshot((s) => s.jobs.filter((j) => j.datasetId === dataset.id));
  const activeJob = jobs.find((j) => j.id === activeJobId) ?? jobs[0];
  const [liveJob, setLiveJob] = useState<TrainingJob | null>(activeJob ?? null);

  useEffect(() => {
    setLiveJob(activeJob ?? null);
    if (!activeJob) return;
    const unsub = subscribeJob(activeJob.id, (j) => setLiveJob(j));
    return () => {
      unsub();
      console.log("Unsubscribed from job", activeJob.id);
    };
  }, [activeJob?.id]);

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!target) {
      setError("Select a target column.");
      return;
    }
    setStarting(true);
    try {
      const job = await startTraining({ datasetId: dataset.id, target, problemType, testSize, randomState });
      onJobStarted(job.id);
      console.log("Started training job", job);
      
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start training");
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="bg-card border border-border rounded-lg p-5">
        <h3 className="font-medium mb-4">Training configuration</h3>
        <form onSubmit={handleStart} className="space-y-4">
          <Field label="Target column">
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
            >
              {dataset.columns.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Problem type">
            <select
              value={problemType}
              onChange={(e) => setProblemType(e.target.value as "classification" | "regression")}
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
            >
              <option value="classification">Classification</option>
              <option value="regression">Regression</option>
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Test size">
              <input
                type="number"
                min={0.05}
                max={0.5}
                step={0.05}
                value={testSize}
                onChange={(e) => setTestSize(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
              />
            </Field>
            <Field label="Random state">
              <input
                type="number"
                value={randomState}
                onChange={(e) => setRandomState(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
              />
            </Field>
          </div>
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={starting}
            className="w-full px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
          >
            {starting ? "Starting…" : "Start training"}
          </button>
        </form>
      </section>

      <section className="bg-card border border-border rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Training status</h3>
          {liveJob && <StatusBadge status={liveJob.status} />}
        </div>
        {!liveJob ? (
          <p className="text-sm text-muted-foreground">
            No training jobs yet. Configure parameters and start a training run.
          </p>
        ) : (
          <>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{liveJob.progress}%</span>
              </div>
              <ProgressBar value={liveJob.progress} status={liveJob.status} />
            </div>
            <LogConsole logs={liveJob.logs} />
          </>
        )}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function StatusBadge({ status }: { status: TrainingJob["status"] }) {
  const map: Record<TrainingJob["status"], string> = {
    queued: "bg-muted text-muted-foreground",
    running: "bg-primary/10 text-primary",
    completed: "bg-success/10 text-success",
    failed: "bg-destructive/10 text-destructive",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status]}`}>{status}</span>
  );
}
