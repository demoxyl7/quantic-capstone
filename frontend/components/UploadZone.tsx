import { Upload, FileText, CheckCircle2, X } from "lucide-react";
import { useState, useCallback, useRef } from "react";

interface UploadZoneProps {
  onFileContent: (content: string, fileName: string) => void;
}

export function UploadZone({ onFileContent }: UploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<{ name: string; size: string } | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const simulateUpload = useCallback(
    (f: File) => {
      setFile({ name: f.name, size: `${(f.size / 1024).toFixed(1)} KB` });
      setUploading(true);
      setProgress(0);

      let p = 0;
      const interval = setInterval(() => {
        p += Math.random() * 25 + 10;
        if (p >= 100) {
          p = 100;
          clearInterval(interval);
          setUploading(false);
        }
        setProgress(Math.min(p, 100));
      }, 200);

      // Read file text (simulated for PDF)
      const reader = new FileReader();
      reader.onload = () => {
        onFileContent(
          `Parsed CV content from "${f.name}":\n\n• Full-stack Developer with 5+ years of experience\n• Proficient in React, TypeScript, Node.js, Python\n• Bachelor's in Computer Science\n• Led team of 8 engineers at previous company\n• AWS Certified Solutions Architect`,
          f.name
        );
      };
      reader.readAsText(f);
    },
    [onFileContent]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) simulateUpload(f);
    },
    [simulateUpload]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) simulateUpload(f);
    },
    [simulateUpload]
  );
  const handleFileChange = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("http://localhost:8000/upload-cv", {
      method: "POST",
      body: formData, // Send as FormData, not JSON
    });

    if (response.ok) {
      const data = await response.json();
      // Pass the extracted text and filename back to Home page
      onFileContent(data.text, data.filename); 
    }
  } catch (error) {
    console.error("Upload failed:", error);
    alert("Error uploading PDF");
  }
};

  const clear = () => {
    setFile(null);
    setProgress(0);
    setUploading(false);
    onFileContent("", "");
  };

  return (
    <div
      className={`upload-zone ${dragOver ? "drag-over" : ""}`}
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
        accept=".pdf,.doc,.docx,.txt"
        className="hidden"
        onChange={handleChange}
      />

      {!file ? (
        <>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-medium">Drop your CV here or click to browse</p>
          <p className="text-xs text-muted-foreground">PDF, DOC, DOCX up to 10MB</p>
        </>
      ) : (
        <div className="w-full space-y-3">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{file.size}</p>
            </div>
            {!uploading && progress === 100 && (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            )}
            <button onClick={(e) => { e.stopPropagation(); clear(); }} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );

}
