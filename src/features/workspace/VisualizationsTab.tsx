import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { Dataset } from "@/services/store";

export function VisualizationsTab({ dataset }: { dataset: Dataset }) {
  const numericCols = dataset.columns.filter((c) => c.type === "number").map((c) => c.name);
  const categoricalCols = dataset.columns.filter((c) => c.type !== "number").map((c) => c.name);

  const [chartType, setChartType] = useState<"bar" | "line" | "pie">("bar");
  const [xCol, setXCol] = useState<string>(categoricalCols[0] || dataset.columns[0]?.name || "");
  const [yCol, setYCol] = useState<string>(numericCols[0] || "");

  const data = useMemo(() => {
    if (!xCol || !yCol) return [];
    // group/aggregate
    const map = new Map<string, { sum: number; count: number }>();
    for (const r of dataset.rows) {
      const k = String(r[xCol] ?? "—");
      const y = Number(r[yCol]);
      if (isNaN(y)) continue;
      const cur = map.get(k) ?? { sum: 0, count: 0 };
      cur.sum += y;
      cur.count += 1;
      map.set(k, cur);
    }
    return Array.from(map.entries())
      .slice(0, 30)
      .map(([k, v]) => ({ x: k, y: Number((v.sum / v.count).toFixed(3)) }));
  }, [dataset.rows, xCol, yCol]);

  const suggestions = numericCols.slice(0, 3).map((y) => ({
    x: categoricalCols[0] || dataset.columns[0]?.name || "",
    y,
  }));

  return (
    <div className="space-y-6">
      <section className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-medium mb-3">Suggestions</h3>
        {suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No numeric columns available for suggestions.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => {
                  setXCol(s.x);
                  setYCol(s.y);
                  setChartType("bar");
                }}
                className="px-3 py-1.5 rounded-md border border-border text-sm hover:bg-accent"
              >
                {s.y} by {s.x}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="bg-card border border-border rounded-lg p-4 space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Chart type">
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as "bar" | "line" | "pie")}
              className="px-2 py-1.5 rounded-md border border-border bg-background text-sm"
            >
              <option value="bar">Bar</option>
              <option value="line">Line</option>
              <option value="pie">Pie</option>
            </select>
          </Field>
          <Field label="X axis">
            <select
              value={xCol}
              onChange={(e) => setXCol(e.target.value)}
              className="px-2 py-1.5 rounded-md border border-border bg-background text-sm"
            >
              {dataset.columns.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Y axis (numeric)">
            <select
              value={yCol}
              onChange={(e) => setYCol(e.target.value)}
              className="px-2 py-1.5 rounded-md border border-border bg-background text-sm"
            >
              {numericCols.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="h-80 w-full">
          {data.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              Select an X and a numeric Y column to render a chart.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "bar" ? (
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="x" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="y" fill="oklch(0.546 0.215 262)" />
                </BarChart>
              ) : chartType === "line" ? (
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="x" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="y" stroke="oklch(0.546 0.215 262)" strokeWidth={2} dot={false} />
                </LineChart>
              ) : (
                <PieChart>
                  <Tooltip />
                  <Pie
                    data={data}
                    dataKey="y"
                    nameKey="x"
                    cx="50%"
                    cy="50%"
                    outerRadius="70%"
                    label={({ name, percent }: { name?: string; percent?: number }) =>
                      `${name ?? "—"}: ${((percent ?? 0) * 100).toFixed(1)}%`
                    }
                    labelLine={false}
                  >
                    {data.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={[
                          "oklch(0.546 0.215 262)", // purple
                          "oklch(0.651 0.246 150)", // green
                          "oklch(0.700 0.204 45)", // yellow
                          "oklch(0.690 0.220 25)", // orange
                          "oklch(0.628 0.189 330)", // pink/red
                          "oklch(0.610 0.170 210)", // blue
                        ][index % 6]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
