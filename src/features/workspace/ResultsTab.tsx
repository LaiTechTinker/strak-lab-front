import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { useStoreSnapshot } from "@/hooks/useStore";
import type { Dataset } from "@/services/store";
import { MetricCard } from "@/components/MetricCard";

export function ResultsTab({ dataset }: { dataset: Dataset }) {
  const jobs = useStoreSnapshot((s) =>
    s.jobs.filter((j) => j.datasetId === dataset.id && j.status === "completed"),
  );
  const job = jobs[0];

  if (!job || !job.results) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-sm text-muted-foreground text-center">
        No completed training runs yet. Start a job from the AutoML tab to see results here.
      </div>
    );
  }

  const {
    featureImportance,
    confusionMatrix,
    modelSummary,
    problemType,
    bestModel,
    metrics,
  } = job.results as any;

  const allModels: any[] = metrics?.all_models ?? [];

  // Choose metric row from backend best model
  const bestRow =
    allModels.find((r) => r?.Model === bestModel) ??
    allModels[0] ??
    {};

  const classificationMetricCards: Array<{ label: string; key: string }> = [
    { label: "Accuracy", key: "Accuracy" },
    { label: "Balanced Accuracy", key: "Balanced Accuracy" },
    { label: "ROC AUC", key: "ROC AUC" },
    { label: "F1 Score", key: "F1 Score" },
    { label: "Precision", key: "Precision" },
    { label: "Recall", key: "Recall" },
  ];

  const regressionMetricCards: Array<{ label: string; key: string; fallbackKeys?: string[] }> = [
    { label: "R squared", key: "R-Squared", fallbackKeys: ["R²", "R squared"] },
    { label: "rmse", key: "RMSE", fallbackKeys: ["rmse"] },
    { label: "MAE", key: "MAE", fallbackKeys: ["mae"] },
  ];

  const metricCards =
    problemType === "regression"
      ? regressionMetricCards.map((m) => {
          const raw =
            bestRow?.[m.key] ?? (m.fallbackKeys ? m.fallbackKeys.map((k) => bestRow?.[k]).find((v) => v !== undefined) : undefined);
          const num = typeof raw === "number" ? raw : Number(raw);
          return { key: m.label, value: Number.isFinite(num) ? num : undefined };
        })
      : classificationMetricCards.map((m) => {
          const raw = bestRow?.[m.key];
          const num = typeof raw === "number" ? raw : Number(raw);
          return { key: m.label, value: Number.isFinite(num) ? num : undefined };
        });

  const showConfusion = problemType === "classification" && confusionMatrix && confusionMatrix.length > 0;

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div
        className={
          problemType === "regression"
            ? "grid gap-4 grid-cols-1 sm:grid-cols-3"
            : "grid gap-4 grid-cols-2 md:grid-cols-3"
        }
      >
        {metricCards.map((m) => (
          <MetricCard
            key={m.key}
            label={m.key}
            value={m.value !== undefined ? m.value.toFixed(3) : "-"}
          />
        ))}
      </div>

      {/* Header cards */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="text-sm text-muted-foreground">Problem type</div>
          <div className="font-medium mt-1">{problemType ?? "-"}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="text-sm text-muted-foreground">Best model</div>
          <div className="font-medium mt-1">{bestModel ?? "-"}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="text-sm text-muted-foreground">Metric columns</div>
          <div className="font-medium mt-1">
            {metrics?.metric_columns?.length ? metrics.metric_columns.join(", ") : "-"}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Feature importance */}
        <section className="bg-card border border-border rounded-lg p-5">
          <h3 className="font-medium mb-3">Feature importance</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureImportance} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="feature" tick={{ fontSize: 12 }} width={100} />
                <Tooltip />
                <Bar dataKey="importance" fill="oklch(0.546 0.215 262)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Confusion matrix / model summary */}
        <section className="bg-card border border-border rounded-lg p-5">
          <h3 className="font-medium mb-3">
            {problemType === "classification" ? "Confusion matrix" : "Model summary"}
          </h3>

          {showConfusion ? (
            <>
              <div className="mb-3">
                {/* placeholder to keep spacing consistent */}
              </div>
              <div className="overflow-auto">
                <table className="text-sm border border-border">
                  <thead>
                    <tr className="bg-muted/60">
                      <th className="px-3 py-2 border-b border-border"></th>
                      {confusionMatrix[0].map((_: unknown, i: number) => (
                        <th key={i} className="px-3 py-2 border-b border-border font-medium">
                          Pred {i}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {confusionMatrix.map((row: unknown[], i: number) => (
                      <tr key={i}>
                        <th className="px-3 py-2 border-b border-border bg-muted/40 font-medium text-left">
                          Actual {i}
                        </th>
                        {row.map((v, j) => (
                          <td key={j} className="px-4 py-2 border-b border-border text-center font-mono">
                            {v as any}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}

          <p className="text-sm text-muted-foreground mt-4">{modelSummary}</p>
        </section>
      </div>
    </div>
  );
}
