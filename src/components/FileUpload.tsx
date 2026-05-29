// empty file
import { useRef, useState } from "react";
import { Upload } from "lucide-react";

type Props = {
  onFile: (file: File) => void | Promise<void>;
  loading?: boolean;
  accept?: string;
};

export function FileUpload({ onFile, loading, accept = ".csv,.xlsx,.xls" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        drag ? "border-primary bg-accent" : "border-border bg-card"
      }`}
    >
      <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
      <div className="mt-3 text-sm text-foreground">
        Drag &amp; drop a CSV or XLSX file here
      </div>
      <div className="mt-1 text-xs text-muted-foreground">or</div>
      <button
        type="button"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
        className="mt-3 inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
      >
        {loading ? "Uploading…" : "Choose file"}
      </button>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
