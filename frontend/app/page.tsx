"use client"; // Required for Next.js interactive components

import { useState } from "react";
import { Sparkles, Zap, AlertCircle } from "lucide-react";
import { UploadZone } from "@/components/UploadZone";
import { JobDescriptionInput } from "@/components/JobDescriptionInput";
import { ComparisonView } from "@/components/ComparisonView";
import { ResultsDashboard } from "@/components/ResultsDashboard";

// Updated Interface to match the Brain structure
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
      const response = await fetch("http://localhost:8000/analyze", {
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
        console.log("Backend Response:", data);
        setResultData(data); 
        setShowResults(true);
      } else {
        if (response.status === 429 || data.detail?.includes("exhausted")) {
          setError("AI Quota exceeded. Please wait 60 seconds.");
        } else {
          setError(data.detail || "The AI brain tripped. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error connecting to backend:", error);
      setError("Cannot reach backend server. Ensure it's running on port 8000.");
    } finally {
      setAnalyzing(false);
    }
  };

  const canAnalyze = cvContent.length > 0 && jobDescription.length > 0;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-lg">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-xl font-bold">Action Center</h1>
              <p className="text-sm text-muted-foreground font-mono">
                {cvFileName ? `Target: ${cvFileName}` : "Upload CV & match with Job Posting"}
              </p>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Zap className="h-3 w-3" />
              AI-Powered (Sprint 1)
            </span>
          </div>
        </header>

        <div className="space-y-6 p-6 max-w-5xl mx-auto">
          {error && (
            <div className="flex items-center gap-2 p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 border border-red-200 animate-in fade-in zoom-in duration-300">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Upload CV</label>
              <UploadZone
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
              className={`glow-button flex items-center gap-2 px-8 py-3 rounded-full font-semibold transition-all shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale ${
                analyzing ? "animate-pulse bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"
              }`}
            >
              <Sparkles className={`h-4 w-4 ${analyzing ? "animate-spin" : ""}`} />
              {analyzing ? "Synthesizing AI Insights..." : "Analyze Match"}
            </button>
          </div>

          {showResults && resultData && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700 fill-mode-forwards">
              <ResultsDashboard 
                visible={showResults} 
                data={resultData} 
              />
              
              <ComparisonView
                cvContent={cvContent}
                jobDescription={jobDescription}
                visible={showResults}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}