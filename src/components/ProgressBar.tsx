// empty file
type Props = { value: number; status?: "queued" | "running" | "completed" | "failed" };

export function ProgressBar({ value, status = "running" }: Props) {
  const color =
    status === "failed"
      ? "bg-destructive"
      : status === "completed"
        ? "bg-success"
        : "bg-primary";
  return (
    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
      <div
        className={`h-full ${color} transition-all duration-300`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
