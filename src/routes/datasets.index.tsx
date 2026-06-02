import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { FileUpload } from "@/components/FileUpload";
import { useStoreSnapshot } from "@/hooks/useStore";
import { uploadDataset, deleteDataset, listDatasets, isBackendEnabled } from "@/services/api";
import { requireAuth } from "@/services/authGuard";

import { Trash2, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/datasets/")({
  beforeLoad: requireAuth(),
  head: () => ({

    meta: [
      { title: "Datasets — DataLab" },
      { name: "description", content: "Upload and manage your datasets." },
    ],
  }),
  component: DatasetsPage,
});

function DatasetsPage() {
  const datasets = useStoreSnapshot((s) => s.datasets);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isBackendEnabled) return;
    listDatasets().catch((e) => setError(e instanceof Error ? e.message : "Failed to load datasets"));
  }, []);

  async function handleUpload(file: File) {
    setError(null);
    setLoading(true);
    try {
      await uploadDataset(file);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this dataset? Reports and jobs will be removed too.")) return;
    await deleteDataset(id);
  }

  return (
    <AppLayout>
      <header className="h-14 px-6 flex items-center border-b border-border bg-card">
        <h1 className="text-lg font-semibold tracking-tight">Datasets</h1>
      </header>

      <div className="p-4 sm:p-6 space-y-6 max-w-5xl">
        <FileUpload onFile={handleUpload} loading={loading} />
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <section className="bg-card border border-border rounded-lg">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="font-medium">Your datasets</h2>
          </div>
          {datasets.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No datasets yet. Upload a CSV or XLSX file above.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {datasets.map((d) => (
                <li key={d.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{d.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {d.rows.length.toLocaleString()} rows · {d.columns.length} columns ·{" "}
                      {new Date(d.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to="/datasets/$datasetId"
                      params={{ datasetId: d.id }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
                    >
                      Open <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="inline-flex items-center px-2.5 py-1.5 rounded-md border border-border text-sm text-muted-foreground hover:text-destructive hover:border-destructive/40"
                      aria-label="Delete dataset"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
