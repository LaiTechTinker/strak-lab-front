// empty file
import { createFileRoute, Link } from "@tanstack/react-router";
import { Database, FileText, Cpu, BarChart3, MessagesSquare, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DataLab — AI-powered data science platform" },
      {
        name: "description",
        content:
          "Upload datasets, generate AI reports, chat with your data, visualize insights, and train ML models — all in one place.",
      },
      { property: "og:title", content: "DataLab — AI-powered data science platform" },
      {
        property: "og:description",
        content: "Upload, explore, and model your data with AI-assisted reports and AutoML.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="h-14 px-6 flex items-center justify-between border-b border-border">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground grid place-items-center text-xs font-bold">
            D
          </div>
          <span className="font-semibold tracking-tight">DataLab</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            to="/login"
            className="px-3 py-1.5 rounded-md text-foreground hover:bg-muted"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90"
          >
            Sign up
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
            Your data. Understood, visualized, and modeled.
          </h1>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload a CSV or Excel file and get AI-powered insights, interactive
            charts, and trained ML models in minutes.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              to="/signup"
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
            >
              Get started
            </Link>
            <Link
              to="/app"
              className="px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-muted"
            >
              Open app
            </Link>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 pb-24 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="bg-card border border-border rounded-lg p-5">
              <div className="w-8 h-8 rounded-md bg-muted grid place-items-center text-foreground">
                {f.icon}
              </div>
              <h3 className="mt-3 font-medium">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border px-6 py-4 text-xs text-muted-foreground flex justify-between">
        <span>© {new Date().getFullYear()} DataLab</span>
        <span>MVP preview</span>
      </footer>
    </div>
  );
}

const features = [
  { title: "Dataset uploads", desc: "Drop in CSV or XLSX files and start exploring instantly.", icon: <Database className="w-4 h-4" /> },
  { title: "AI reports", desc: "Auto-generated summaries, insights, and quality checks.", icon: <FileText className="w-4 h-4" /> },
  { title: "Chat with data", desc: "Ask questions about your dataset in plain English.", icon: <MessagesSquare className="w-4 h-4" /> },
  { title: "Visualizations", desc: "Smart chart suggestions powered by your data shape.", icon: <BarChart3 className="w-4 h-4" /> },
  { title: "AutoML training", desc: "Train and compare models with a few clicks.", icon: <Cpu className="w-4 h-4" /> },
  { title: "Insightful results", desc: "Metrics, feature importance, and confusion matrices.", icon: <Sparkles className="w-4 h-4" /> },
];
