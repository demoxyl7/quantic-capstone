import { Upload, FileText, CheckCircle2, X } from "lucide-react";
import { useState, useCallback, useRef } from "react";

interface UploadZoneProps {
  onFileContent: (content: string, fileName: string) => void;
  apiBase: string; // <--- New prop to receive the URL
}

export function UploadZone({ onFileContent, apiBase }: UploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<{ name: string; size: string } | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const startUpload = useCallback(
    async (f: File) => {
      setFile({ name: f.name, size: `${(f.size / 1024).toFixed(1)} KB` });
      setUploading(true);
      setProgress(20); // Start progress bar

      const formData = new FormData();
      formData.append("file", f);

      try {
        // Use the apiBase prop here!
        const response = await fetch(`${apiBase}/upload-cv`, {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          setProgress(100);
          setUploading(false);
          // Pass the REAL extracted text back to page.tsx
          onFileContent(data.text, data.filename);
        } else {
          throw new Error("Failed to parse PDF");
        }
      } catch (error) {
        console.error("Upload failed:", error);
        alert("Error connecting to backend");
        setFile(null);
        setUploading(false);
      }
    },
    [apiBase, onFileContent]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) startUpload(f);
    },
    [startUpload]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) startUpload(f);
    },
    [startUpload]
  );

  const clear = () => {
    setFile(null);
    setProgress(0);
    setUploading(false);
    onFileContent("", "");
  };

  return (
    <div
      className={`upload-zone border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
        dragOver ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !file && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleChange}
      />

      {!file ? (
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-medium">Drop your CV here or click to browse</p>
          <p className="text-xs text-muted-foreground">PDF up to 10MB</p>
        </div>
      ) : (
        <div className="w-full space-y-3">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <div className="flex-1 min-w-0 text-left">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{file.size}</p>
            </div>
            {!uploading && progress === 100 && (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                clear();
              }}
              className="p-1 hover:bg-secondary rounded-md"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={`h-full bg-primary transition-all duration-500 ${uploading ? "animate-pulse" : ""}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}