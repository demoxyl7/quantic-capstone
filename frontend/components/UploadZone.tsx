"use client";

import { Upload, FileText, CheckCircle2, X } from "lucide-react";
import { useState, useCallback, useRef } from "react";

interface UploadZoneProps {
  onFileContent: (content: string) => void;
  apiBase: string;
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
      setProgress(30);

      try {
        let docxBlob: Blob = f;
        const isPdf = f.name.toLowerCase().endsWith(".pdf");

        // 1. If PDF, send to backend for conversion to DOCX
        if (isPdf) {
          const formData = new FormData();
          formData.append("file", f);
          
          const response = await fetch(`${apiBase}/convert-pdf-to-docx`, {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error("Failed to convert PDF to DOCX");
          }
          
          // Get the converted DOCX as a Blob
          docxBlob = await response.blob();
        }

        setProgress(60);

        // 2. Save original original DOCX binary directly to IndexedDB
        const { set } = await import("idb-keyval");
        await set("cv_raw", docxBlob);
        await set("cv_filename", f.name);

        setProgress(80);

        // 3. Extract text from the DOCX for AI analysis using Mammoth
        const mammoth = await import("mammoth");
        const arrayBuffer = await docxBlob.arrayBuffer();
        
        const result = await mammoth.extractRawText({ arrayBuffer });
        const extractedText = result.value;

        if (!extractedText.trim()) {
           throw new Error("Could not extract text from the document");
        }

        setProgress(100);
        setUploading(false);
        onFileContent(extractedText);
        
      } catch (error) {
        console.error("Upload failed:", error);
        alert(error instanceof Error ? error.message : "Error connecting to backend or unsupported file format.");
        setFile(null);
        setUploading(false);
        setProgress(0);
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
    onFileContent("");
  };

  return (
    <div
      className={`surface-card border-2 border-dashed p-8 text-center transition-all duration-200 cursor-pointer ${
        dragOver
          ? "border-primary bg-primary/3"
          : "border-border hover:border-primary/30 hover:bg-secondary/30"
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
        accept=".pdf,.docx"
        className="hidden"
        onChange={handleChange}
      />

      {!file ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 animate-fade-in">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">
              Drop your CV here or{" "}
              <span className="text-primary underline underline-offset-2">
                browse
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF or DOCX, up to 10MB
            </p>
          </div>
        </div>
      ) : (
        <div className="w-full space-y-3 animate-fade-in">
          <div className="flex items-center gap-3 bg-secondary p-3 rounded-lg">
            <div className="h-9 w-9 flex items-center justify-center bg-card rounded-lg shadow-sm">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="truncate text-sm font-semibold">{file.name}</p>
              <p className="text-[10px] text-muted-foreground">{file.size}</p>
            </div>
            {!uploading && progress === 100 && (
              <div className="flex items-center gap-1 text-success text-xs font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Ready</span>
              </div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                clear();
              }}
              className="p-1.5 hover:bg-destructive/8 hover:text-destructive rounded-md transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-primary transition-all duration-700 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}