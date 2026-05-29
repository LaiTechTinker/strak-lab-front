// empty file
import { useEffect, useRef } from "react";

export function LogConsole({ logs }: { logs: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [logs.length]);
  return (
    <div
      ref={ref}
      className="bg-foreground text-background font-mono text-xs rounded-lg p-3 h-64 overflow-auto border border-border"
    >
      {logs.length === 0 ? (
        <div className="text-muted-foreground">Waiting for logs…</div>
      ) : (
        logs.map((l, i) => (
          <div key={i} className="whitespace-pre-wrap leading-relaxed">
            {l}
          </div>
        ))
      )}
    </div>
  );
}
