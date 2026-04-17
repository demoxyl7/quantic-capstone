"use client";

import { useState } from "react";
import { Sparkles, Zap, AlertCircle, Copy, Check } from "lucide-react";
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
  
  // Cover Letter States
  const [coverLetter, setCoverLetter] = useState<string>("");
  const [isGeneratingLetter, setIsGeneratingLetter] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleAnalyze = async () => {
    if (!cvContent || !jobDescription) return;
    
    setAnalyzing(true);
    setShowResults(false);
    setError(null);
    setCoverLetter(""); // Reset letter for new analysis

    try {
      const response = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        if (response.status === 429) {
          setError("AI limit reached. Please wait 60 seconds and try again.");
        } else {
          setError(data.detail || "The AI brain tripped. Please try again.");
        }
      }
    } catch (error) {
      setError("Cannot reach backend server. Ensure it's running.");
    } finally {
      setTimeout(() => setAnalyzing(false), 2000);
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (!cvContent || !jobDescription) return;
    
    setIsGeneratingLetter(true);
    try {
      const response = await fetch(`${API_BASE}/generate-cover-letter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cv_text: cvContent,
          job_description: jobDescription,
        }),
      });

      if (!response.ok) throw new Error("Generation failed");
      
      const data = await response.json();
      setCoverLetter(data.cover_letter);
    } catch (err) {
      console.error("Cover Letter Error:", err);
      alert("Could not generate cover letter. Please try again.");
    } finally {
      setIsGeneratingLetter(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
              
              {/* New Cover Letter Section */}
              <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  AI Cover Letter Generator
                </h3>
                
                {!coverLetter ? (
                  <button
                    onClick={handleGenerateCoverLetter}
                    disabled={isGeneratingLetter}
                    className="bg-secondary text-secondary-foreground px-6 py-2 rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isGeneratingLetter ? (
                      <>
                        <div className="h-4 w-4 border-2 border-current border-t-transparent animate-spin rounded-full" />
                        Drafting Letter...
                      </>
                    ) : "Generate Customized Cover Letter"}
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="p-5 bg-muted/50 rounded-lg whitespace-pre-wrap text-sm leading-relaxed border border-border italic text-muted-foreground">
                      {coverLetter}
                    </div>
                    <button 
                      onClick={copyToClipboard}
                      className="flex items-center gap-2 text-xs bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copied ? "Copied!" : "Copy to Clipboard"}
                    </button>
                  </div>
                )}
              </div>

              <ComparisonView cvContent={cvContent} jobDescription={jobDescription} visible={showResults} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}