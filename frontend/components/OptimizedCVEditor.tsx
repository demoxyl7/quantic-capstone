"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Sparkles,
  Check,
  CheckCircle2,
  Download,
  ArrowDown,
  X,
  Wand2,
} from "lucide-react";

interface Suggestion {
  id: string;
  section: string;
  type: string;
  issue: string;
  xml_target: string;
  replacement: string;
  reason: string;
}

interface OptimizedCVEditorProps {
  suggestions: Suggestion[];
}

export function OptimizedCVEditor({
  suggestions,
}: OptimizedCVEditorProps) {
  const [htmlPreview, setHtmlPreview] = useState<string>("");
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());

  // 1. Initial Load: Read DOCX array buffer, extract XML, and render mammoth HTML
  useEffect(() => {
    async function loadInitialDocx() {
      try {
        const { get, set } = await import("idb-keyval");
        const JSZip = (await import("jszip")).default;
        const mammoth = await import("mammoth");

        const rawBlob = await get("cv_raw");
        if (!rawBlob) return;

        const arrayBuffer = await rawBlob.arrayBuffer();

        // Save XML state
        const zip = await JSZip.loadAsync(arrayBuffer);
        const xmlText = await zip.file("word/document.xml")?.async("string");
        if (xmlText) await set("cv_state", xmlText);

        // Options to instruct Mammoth to map our custom highlight to a span
        const options = {
          styleMap: [
            "r[highlight='green'] => span.bg-success/20.text-success.font-semibold.px-1.rounded",
          ],
        };

        const result = await mammoth.convertToHtml({ arrayBuffer }, options);
        setHtmlPreview(result.value);
      } catch (err) {
        console.error("Failed to load DOCX preview:", err);
      }
    }
    loadInitialDocx();
  }, []);

  // 2. Apply Suggestion: Parse XML, locate text, run granular XML replacement
  const handleApply = useCallback(async (suggestion: Suggestion) => {
    try {
      const { get, set } = await import("idb-keyval");
      const JSZip = (await import("jszip")).default;
      const mammoth = await import("mammoth");

      const xmlState = await get("cv_state");
      if (!xmlState) return;

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlState, "application/xml");
      const paragraphs = xmlDoc.getElementsByTagName("w:p");

      let applied = false;
      const targetText = suggestion.xml_target.trim();

      // XML Manipulation
      for (let i = 0; i < paragraphs.length; i++) {
        const p = paragraphs[i];
        const runs = p.getElementsByTagName("w:r");
        
        let pText = "";
        const textNodes: Element[] = [];

        for (let j = 0; j < runs.length; j++) {
          const tTags = runs[j].getElementsByTagName("w:t");
          for (let k = 0; k < tTags.length; k++) {
             const t = tTags[k];
             pText += t.textContent || "";
             textNodes.push(t);
          }
        }

        const startIdx = pText.indexOf(targetText);
        if (startIdx !== -1) {
          // Found matching paragraph
          let currIdx = 0;
          let matchStartRun = -1;
          let matchEndRun = -1;
          let startOffset = 0;
          let endOffset = 0;

          // Map string indices to particular w:t nodes
          for (let r = 0; r < textNodes.length; r++) {
            const t = textNodes[r];
            const len = (t.textContent || "").length;
            if (matchStartRun === -1 && currIdx + len > startIdx) {
              matchStartRun = r;
              startOffset = startIdx - currIdx;
            }
            if (matchEndRun === -1 && currIdx + len >= startIdx + targetText.length) {
              matchEndRun = r;
              endOffset = startIdx + targetText.length - currIdx;
              break;
            }
            currIdx += len;
          }

          if (matchStartRun !== -1 && matchEndRun !== -1) {
            // Reconstruct the new run
            const firstRunNode = textNodes[matchStartRun].parentNode as Element;
            const rPrContent = firstRunNode.getElementsByTagName("w:rPr")[0]?.cloneNode(true) || null;

            const newRun = xmlDoc.createElement("w:r");
            if (rPrContent) newRun.appendChild(rPrContent);

            const newT = xmlDoc.createElement("w:t");
            newT.setAttribute("xml:space", "preserve");
            
            // Add custom highlight for mammoth parsing
            let newRPr = rPrContent as Element;
            if (!newRPr) {
              newRPr = xmlDoc.createElement("w:rPr");
              newRun.appendChild(newRPr);
            }
            const highlight = xmlDoc.createElement("w:highlight");
            highlight.setAttribute("w:val", "green");
            newRPr.appendChild(highlight);
            
            newT.textContent = suggestion.replacement;
            newRun.appendChild(newT);

            // Splice original nodes
            const textBefore = textNodes[matchStartRun].textContent!.substring(0, startOffset);
            const textAfter = textNodes[matchEndRun].textContent!.substring(endOffset);

            textNodes[matchStartRun].textContent = textBefore;
            textNodes[matchEndRun].textContent = textAfter;

            // Empty out intermediate nodes completely
            for (let r = matchStartRun + 1; r < matchEndRun; r++) {
              textNodes[r].textContent = "";
            }

            // Insert new run
            firstRunNode.parentNode!.insertBefore(newRun, firstRunNode.nextSibling);

            applied = true;
            break;
          }
        }
      }

      if (applied) {
        const serializer = new XMLSerializer();
        const newXmlState = serializer.serializeToString(xmlDoc);
        await set("cv_state", newXmlState);

        const rawBlob = await get("cv_raw");
        const zip = await JSZip.loadAsync(rawBlob);
        zip.file("word/document.xml", newXmlState);
        
        // Save modified file back to storage for download to pick up
        const modifiedBlob = await zip.generateAsync({ type: "blob" });
        await set("cv_raw", modifiedBlob);

        const newDocxBuffer = await modifiedBlob.arrayBuffer();

        const options = {
          styleMap: [
            "r[highlight='green'] => span.bg-success.bg-opacity-20.text-success.px-1.rounded",
          ],
        };
        const result = await mammoth.convertToHtml({ arrayBuffer: newDocxBuffer }, options);
        
        setHtmlPreview(result.value);
        setAppliedIds((prev) => new Set(prev).add(suggestion.id));
        setFailedIds((prev) => {
          const next = new Set(prev);
          next.delete(suggestion.id);
          return next;
        });
      } else {
        setFailedIds((prev) => new Set(prev).add(suggestion.id));
      }
    } catch (err) {
      console.error(err);
      setFailedIds((prev) => new Set(prev).add(suggestion.id));
    }
  }, []);

  const handleDownload = async () => {
    try {
      const { get } = await import("idb-keyval");
      const rawBlob = await get("cv_raw");
      const filename = (await get("cv_filename")) || "Optimized_CV.docx";
      
      if (!rawBlob) return;
      
      const a = document.createElement("a");
      a.href = URL.createObjectURL(rawBlob);
      a.download = filename.replace(/\.(docx|pdf)$/i, "_edited.docx");
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const pendingSuggestions = useMemo(
    () => suggestions.filter((s) => !appliedIds.has(s.id)),
    [suggestions, appliedIds]
  );
  const appliedSuggestions = useMemo(
    () => suggestions.filter((s) => appliedIds.has(s.id)),
    [suggestions, appliedIds]
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* HTML Content Panel via Mammoth */}
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-base font-bold">Your CV</h3>
            <span className="badge badge-primary text-[10px]">
              {appliedIds.size} change{appliedIds.size !== 1 ? "s" : ""} applied
            </span>
          </div>
          <button
            onClick={handleDownload}
            className="btn-secondary text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </button>
        </div>

        <div className="surface-elevated p-8 min-h-[700px] relative overflow-y-auto bg-white text-black shadow-sm">
          <div 
             className="prose prose-sm max-w-none text-black leading-normal marker:text-black prose-p:my-1 prose-h1:my-2 prose-h2:my-2 prose-h3:my-2"
             dangerouslySetInnerHTML={{ __html: htmlPreview }} 
          />
        </div>
      </div>

      {/* Suggestions Panel */}
      <div className="w-full lg:w-[380px] space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-muted-foreground">
            Suggestions ({pendingSuggestions.length})
          </h4>
        </div>

        {pendingSuggestions.length === 0 && appliedSuggestions.length > 0 ? (
          <div className="surface-elevated p-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10 mx-auto mb-3">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <p className="text-sm font-semibold">All done!</p>
            <p className="text-xs text-muted-foreground mt-1">
              All suggestions are applied. Download your updated CV.
            </p>
          </div>
        ) : pendingSuggestions.length === 0 ? (
          <div className="surface-elevated p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No suggestions available.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
            {pendingSuggestions.map((s, i) => {
              const isFailed = failedIds.has(s.id);

              return (
                <div
                  key={s.id}
                  className="surface-elevated p-4 transition-all animate-fade-in-up"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="badge badge-primary text-[10px]">
                      {s.type}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                      {s.section}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-foreground mb-3 leading-snug">
                    {s.issue}
                  </p>

                  <div className="space-y-2 mb-3">
                    <div className="bg-destructive/4 border border-destructive/10 p-3 rounded-lg">
                      <p className="text-[10px] font-semibold text-destructive mb-1 uppercase tracking-wider">
                        Current
                      </p>
                      <p className="text-xs text-foreground/60 line-through decoration-destructive/30">
                        {s.xml_target}
                      </p>
                    </div>

                    <div className="flex justify-center">
                      <ArrowDown className="h-3 w-3 text-muted-foreground opacity-30" />
                    </div>

                    <div className="bg-success/4 border border-success/10 p-3 rounded-lg">
                      <p className="text-[10px] font-semibold text-success mb-1 uppercase tracking-wider">
                        Suggested
                      </p>
                      <p className="text-xs text-foreground/80 font-medium">
                        {s.replacement}
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed mb-3 italic">
                    {s.reason}
                  </p>

                  {isFailed && (
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-warning/6 border border-warning/15 mb-3">
                      <X className="h-3 w-3 text-warning mt-0.5 shrink-0" />
                      <p className="text-[10px] text-warning leading-relaxed">
                        Couldn&apos;t apply automatically. Text may be split across complex XML nodes.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => handleApply(s)}
                    className="w-full btn-primary py-2 text-xs"
                  >
                    <Check className="h-3 w-3" />
                    {isFailed ? "Retry Apply" : "Apply Change"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Applied log */}
        {appliedSuggestions.length > 0 && pendingSuggestions.length > 0 && (
          <div className="pt-4 border-t border-border">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 opacity-60">
              Applied ({appliedSuggestions.length})
            </p>
            <div className="space-y-1.5">
              {appliedSuggestions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-2 px-3 py-2 bg-success/4 rounded-lg"
                >
                  <CheckCircle2 className="h-3 w-3 text-success shrink-0" />
                  <span className="text-[11px] text-foreground/60 truncate">
                    {s.replacement}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
