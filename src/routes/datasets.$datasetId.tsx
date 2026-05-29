import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useStoreSnapshot } from "@/hooks/useStore";
import { getDataset, isBackendEnabled } from "@/services/api";
import { requireAuth } from "@/services/authGuard";

import { OverviewTab } from "@/features/workspace/OverviewTab";
import { VisualizationsTab } from "@/features/workspace/VisualizationsTab";
import { ReportsTab } from "@/features/workspace/ReportsTab";
import { AutoMLTab } from "@/features/workspace/AutoMLTab";
import { ResultsTab } from "@/features/workspace/ResultsTab";
import { ChevronLeft } from "lucide-react";

const TABS = ["overview", "visualizations", "reports", "automl", "results"] as const;
type Tab = (typeof TABS)[number];
const LABELS: Record<Tab, string> = {
  overview: "Overview",
  visualizations: "Visualizations",
  reports: "Reports",
  automl: "AutoML",
  results: "Results",
};

export const Route = createFileRoute("/datasets/$datasetId")({
  beforeLoad: requireAuth(),
  head: () => ({

    meta: [
      { title: "Dataset workspace — DataLab" },
      { name: "description", content: "Explore, visualize, and model your dataset." },
    ],
  }),
  component: WorkspacePage,
  notFoundComponent: () => (
    <AppLayout>
      <div className="p-10 text-sm text-muted-foreground">Dataset not found.</div>
    </AppLayout>
  ),
});

function WorkspacePage() {
  const { datasetId } = Route.useParams();
  const dataset = useStoreSnapshot((s) => s.datasets.find((d) => d.id === datasetId));
  const [tab, setTab] = useState<Tab>("overview");
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  useEffect(() => {
    if (!isBackendEnabled) return;
    if (!dataset || dataset.rows.length === 0) {
      getDataset(datasetId).catch(() => {});
    }
  }, [datasetId, dataset]);

  if (!dataset) {
    // Dataset not in memory (page refresh wipes state). Show empty-state.
    return (
      <AppLayout>
        <header className="h-14 px-6 flex items-center border-b border-border bg-card">
          <Link to="/datasets" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> Datasets
          </Link>
        </header>
        <div className="p-10">
          <div className="bg-card border border-border rounded-lg p-8 text-sm text-muted-foreground text-center">
            This dataset isn't loaded. The mock backend keeps data in memory only — please re-upload it.
            <div className="mt-4">
              <Link to="/datasets" className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium">
                Go to Datasets
              </Link>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <header className="px-6 pt-4 pb-0 border-b border-border bg-card">
        <Link to="/datasets" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ChevronLeft className="w-3.5 h-3.5" /> Datasets
        </Link>
        <h1 className="mt-1 text-lg font-semibold tracking-tight truncate">{dataset.name}</h1>
        <p className="text-xs text-muted-foreground">
          {dataset.rows.length.toLocaleString()} rows · {dataset.columns.length} columns
        </p>
        <nav className="mt-3 flex gap-1 -mb-px">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-sm border-b-2 transition-colors ${
                tab === t
                  ? "border-primary text-foreground font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {LABELS[t]}
            </button>
          ))}
        </nav>
      </header>

      <div className="p-6">
        {tab === "overview" && <OverviewTab dataset={dataset} />}
        {tab === "visualizations" && <VisualizationsTab dataset={dataset} />}
        {tab === "reports" && <ReportsTab dataset={dataset} />}
        {tab === "automl" && (
          <AutoMLTab dataset={dataset} onJobStarted={setActiveJobId} activeJobId={activeJobId} />
        )}
        {tab === "results" && <ResultsTab dataset={dataset} />}
      </div>
    </AppLayout>
  );
}
