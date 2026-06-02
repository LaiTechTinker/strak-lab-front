// empty file
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { requireAuth } from "@/services/authGuard";

import { MetricCard } from "@/components/MetricCard";
import { Database, FileText, Cpu, Plus } from "lucide-react";
import { useStoreSnapshot } from "@/hooks/useStore";

export const Route = createFileRoute("/app")({
  beforeLoad: requireAuth(),
  head: () => ({

    meta: [
      { title: "Dashboard — DataLab" },
      { name: "description", content: "Overview of your datasets, reports, and trained models." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const datasets = useStoreSnapshot((s) => s.datasets);
  const reports = useStoreSnapshot((s) => s.reports);
  const jobs = useStoreSnapshot((s) => s.jobs);
  const completedJobs = jobs.filter((j) => j.status === "completed");

  const recent = [
    ...datasets.slice(0, 3).map((d) => ({ ts: d.createdAt, text: `Uploaded dataset "${d.name}"` })),
    ...reports.slice(0, 3).map((r) => {
      const ds = datasets.find((d) => d.id === r.datasetId);
      return { ts: r.createdAt, text: `Generated report for "${ds?.name ?? r.datasetId}"` };
    }),
    ...jobs.slice(0, 3).map((j) => {
      const ds = datasets.find((d) => d.id === j.datasetId);
      return { ts: j.createdAt, text: `Training job (${j.status}) on "${ds?.name ?? j.datasetId}"` };
    }),
  ]
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 6);

  return (
    <AppLayout>
      <header className="h-14 px-6 flex items-center justify-between border-b border-border bg-card">
        <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
        <Link
          to="/datasets"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" /> Upload dataset
        </Link>
      </header>

      <div className="p-4 sm:p-6 space-y-6">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard label="Total datasets" value={datasets.length} icon={<Database className="w-4 h-4" />} />
          <MetricCard label="Reports generated" value={reports.length} icon={<FileText className="w-4 h-4" />} />
          <MetricCard
            label="Models trained"
            value={completedJobs.length}
            hint={`${jobs.length - completedJobs.length} in progress or failed`}
            icon={<Cpu className="w-4 h-4" />}
          />
        </div>

        <section className="bg-card border border-border rounded-lg">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="font-medium">Recent activity</h2>
          </div>
          {recent.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No activity yet. Upload your first dataset to get started.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((r, i) => (
                <li key={i} className="px-5 py-3 flex items-center justify-between text-sm">
                  <span className="text-foreground">{r.text}</span>
                  <span className="text-muted-foreground text-xs">{new Date(r.ts).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
