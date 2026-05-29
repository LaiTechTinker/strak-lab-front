import { useEffect, useState } from "react";
import { useStoreSnapshot } from "@/hooks/useStore";
import { chatWithReport, downloadReportPdf, generateReport, getReportByDataset } from "@/services/api";
import type { Dataset } from "@/services/store";
import { Download, Send, Sparkles } from "lucide-react";

export function ReportsTab({ dataset }: { dataset: Dataset }) {
  const report = useStoreSnapshot((s) => s.reports.find((r) => r.datasetId === dataset.id));

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setError(null);
  }, [dataset.id]);

  async function handleGenerate() {
    setError(null);
    setGenerating(true);
    try {
      await generateReport(dataset.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate report");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const msg = input.trim();
    setInput("");
    setSending(true);

    try {
      if (!(await getReportByDataset(dataset.id))) await generateReport(dataset.id);
      await chatWithReport(dataset.id, msg);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <section className="lg:col-span-3 bg-card border border-border rounded-lg flex flex-col h-[36rem]">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">

          <h3 className="font-medium">Report</h3>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
            >
              <Sparkles className="w-4 h-4" />
              {generating ? "Generating…" : report ? "Regenerate" : "Generate report"}
            </button>

            {report && (
              <button
                onClick={() => downloadReportPdf(report.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted text-foreground text-sm font-medium hover:bg-muted/80"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            )}
          </div>
        </div>

        <div className="p-5 overflow-auto">

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2 mb-4">
              {error}
            </div>
          )}

          {!report ? (
            <p className="text-sm text-muted-foreground">
              No report yet. Click{" "}
              <span className="text-foreground font-medium">Generate report</span> to produce an AI-powered analysis of
              this dataset.
            </p>
          ) : (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-medium mb-1">Summary</h4>
                <p className="text-sm text-foreground leading-relaxed">{report.summary}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-1">Key insights</h4>
                <p>{report.insights}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-1">Data issues</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-foreground">
                  {report.issues.map((i, k) => (
                    <li key={k}>{i}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="lg:col-span-2 bg-card border border-border rounded-lg flex flex-col h-[36rem]">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="font-medium">Chat with report</h3>
          <p className="text-xs text-muted-foreground">Ask anything about this dataset.</p>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          {!report || report.chat.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Try: "Which columns have missing values?" or "What's the average of …?"
            </p>
          ) : (
            report.chat.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  m.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted text-foreground"
                }`}
              >
                {m.content}
              </div>
            ))
          )}

          {sending && <div className="bg-muted text-muted-foreground rounded-lg px-3 py-2 text-sm w-fit">…</div>}
        </div>

        <form onSubmit={handleSend} className="p-3 border-t border-border flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question…"
            className="flex-1 px-3 py-2 rounded-md border border-border bg-background text-sm"
          />

          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            aria-label="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </section>
    </div>
  );
}

