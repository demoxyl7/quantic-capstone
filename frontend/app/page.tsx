"use client";

import { useState } from "react";
import { Sparkles, Zap, AlertCircle } from "lucide-react";
import { UploadZone } from "@/components/UploadZone";
import { JobDescriptionInput } from "@/components/JobDescriptionInput";
import { ComparisonView } from "@/components/ComparisonView";
import { ResultsDashboard } from "@/components/ResultsDashboard";

const API_BASE = typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://127.0.0.1:8000"
    : "https://quantic-capstone.onrender.com";

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
    
    setAnalyzing(true); // Disables the button immediately
    setShowResults(false);
    setError(null);

    try {
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
        // Specifically catch the 429 quota error to show a helpful message
        if (response.status === 429) {
            setError("Google AI limit reached. Please wait 60 seconds and try again.");
        } else {
            setError(data.detail || "The AI brain tripped. Please try again.");
        }
      }
    } catch (error) {
      setError("Cannot reach backend server. Ensure it's running.");
    } finally {
      // Keep the button disabled for 2 extra seconds to prevent accidental double-clicks
      setTimeout(() => setAnalyzing(false), 2000);
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
              <UploadZone
                apiBase={API_BASE}
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
                analyzing 
                  ? "bg-gray-400 cursor-not-allowed text-white" 
                  : "bg-primary text-primary-foreground hover:scale-105"
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