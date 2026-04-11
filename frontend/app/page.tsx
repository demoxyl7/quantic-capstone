"use client";

import { useState } from "react";
import { Sparkles, Zap, AlertCircle } from "lucide-react";
import { UploadZone } from "@/components/UploadZone";
import { JobDescriptionInput } from "@/components/JobDescriptionInput";
import { ComparisonView } from "@/components/ComparisonView";
import { ResultsDashboard } from "@/components/ResultsDashboard";

// 1. Define the API base outside or inside the component
const API_BASE = process.env.NODE_ENV === "production"
  ? "https://quantic-capstone.onrender.com"
  : "http://localhost:8000";

interface AnalysisResult {
  score: number;
  match_status: string;
  matched_skills: string[];
  missing_skills: string[];
  suggestions: string[];
}

export default function Home() {
  const [cvContent, setCvContent] = useState("");
  const [cvFileName, setCvFileName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [resultData, setResultData] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!cvContent || !jobDescription) return;
    
    setAnalyzing(true);
    setShowResults(false);
    setError(null);

    try {
      // 2. Use API_BASE here
      const response = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cv_text: cvContent,
          job_description: jobDescription,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResultData(data); 
        setShowResults(true);
      } else {
        setError(data.detail || "The AI brain tripped. Please try again.");
      }
    } catch (error) {
      setError("Cannot reach backend server. Ensure it's running.");
    } finally {
      setAnalyzing(false);
    }
  };

  const canAnalyze = cvContent.length > 0 && jobDescription.length > 0;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <main className="flex-1 overflow-y-auto">
        {/* Header... (omitted for brevity) */}
        <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-lg">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-xl font-bold">Action Center</h1>
              <p className="text-sm text-muted-foreground font-mono">
                {cvFileName ? `Target: ${cvFileName}` : "Upload CV & match with Job Posting"}
              </p>
            </div>
          </div>
        </header>

        <div className="space-y-6 p-6 max-w-5xl mx-auto">
          {error && (
            <div className="flex items-center gap-2 p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 border border-red-200">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Upload CV</label>
              {/* 3. Pass API_BASE to UploadZone if your component handles the fetch internally */}
              <UploadZone
  apiBase={API_BASE} // <--- Add this line!
  onFileContent={(content, name) => {
    setCvContent(content);
    setCvFileName(name);
  }}
/>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Job Posting</label>
              <JobDescriptionInput value={jobDescription} onChange={setJobDescription} />
            </div>
          </div>

          <div className="flex justify-center py-4">
            <button
              onClick={handleAnalyze}
              disabled={!canAnalyze || analyzing}
              className={`glow-button flex items-center gap-2 px-8 py-3 rounded-full font-semibold transition-all ${
                analyzing ? "animate-pulse bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"
              }`}
            >
              <Sparkles className={`h-4 w-4 ${analyzing ? "animate-spin" : ""}`} />
              {analyzing ? "Synthesizing AI Insights..." : "Analyze Match"}
            </button>
          </div>

          {showResults && resultData && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
              <ResultsDashboard visible={showResults} data={resultData} />
              <ComparisonView cvContent={cvContent} jobDescription={jobDescription} visible={showResults} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}