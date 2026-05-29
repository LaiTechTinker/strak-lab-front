// empty file
import type { ColumnMeta } from "@/services/store";

type Props = {
  columns: ColumnMeta[];
  rows: Record<string, unknown>[];
  maxRows?: number;
};

export function DataTable({ columns, rows, maxRows = 50 }: Props) {
  const display = rows.slice(0, maxRows);
  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <div className="overflow-auto max-h-[60vh]">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 sticky top-0">
            <tr>
              {columns.map((c) => (
                <th key={c.name} className="text-left px-3 py-2 font-medium text-foreground border-b border-border whitespace-nowrap">
                  <div className="flex flex-col">
                    <span>{c.name}</span>
                    <span className="text-xs text-muted-foreground font-normal">{c.type}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {display.map((r, i) => (
              <tr key={i} className="hover:bg-accent/40">
                {columns.map((c) => {
                  const v = r[c.name];
                  return (
                    <td key={c.name} className="px-3 py-2 border-b border-border text-foreground whitespace-nowrap">
                      {v === null || v === undefined || v === "" ? (
                        <span className="text-muted-foreground italic">null</span>
                      ) : (
                        String(v)
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-3 py-2 text-xs text-muted-foreground border-t border-border bg-muted/30">
        Showing {display.length} of {rows.length.toLocaleString()} rows
      </div>
    </div>
  );
}
