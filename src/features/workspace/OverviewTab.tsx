import { DataTable } from "@/components/DataTable";
import type { Dataset } from "@/services/store";

export function OverviewTab({ dataset }: { dataset: Dataset }) {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-medium text-foreground mb-2">Column metadata</h3>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr>
                <th className="text-left px-3 py-2 font-medium border-b border-border">Name</th>
                <th className="text-left px-3 py-2 font-medium border-b border-border">Type</th>
                <th className="text-left px-3 py-2 font-medium border-b border-border">Missing</th>
              </tr>
            </thead>
            <tbody>
              {dataset.columns.map((c) => (
                <tr key={c.name}>
                  <td className="px-3 py-2 border-b border-border text-foreground">{c.name}</td>
                  <td className="px-3 py-2 border-b border-border text-muted-foreground">{c.type}</td>
                  <td className="px-3 py-2 border-b border-border text-muted-foreground">
                    {c.missing > 0 ? (
                      <span className="text-destructive">{c.missing}</span>
                    ) : (
                      <span>0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-medium text-foreground mb-2">Preview</h3>
        <DataTable columns={dataset.columns} rows={dataset.rows} maxRows={50} />
      </section>
    </div>
  );
}
