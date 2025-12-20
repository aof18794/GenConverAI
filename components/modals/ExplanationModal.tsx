"use client";

import { GraduationCap, X, Loader2 } from "lucide-react";
import { DialogueLine } from "@/types";

interface ExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  line: DialogueLine | null;
  explanation: string;
  isLoading: boolean;
  lang: "th" | "en";
}

export function ExplanationModal({
  isOpen,
  onClose,
  line,
  explanation,
  isLoading,
  lang,
}: ExplanationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="modal-glass rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <GraduationCap className="text-amber-400" />
            {lang === "th" ? "อธิบายประโยค" : "Sentence Explanation"}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X />
          </button>
        </div>

        {/* Original sentence */}
        {line && (
          <div className="glass-card rounded-xl p-4 mb-4">
            <div className="text-xs text-emerald-200/40 mb-1">
              {line.reading}
            </div>
            <div className="text-lg font-medium text-emerald-300">
              {line.text}
            </div>
            <div className="text-sm text-slate-400 mt-1">{line.th}</div>
          </div>
        )}

        {/* Explanation content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 text-amber-400 animate-spin mb-4" />
              <p className="text-emerald-200/60">
                {lang === "th"
                  ? "กำลังวิเคราะห์ประโยค..."
                  : "Analyzing sentence..."}
              </p>
            </div>
          ) : (
            <div className="text-sm leading-relaxed space-y-3">
              {explanation.split("\n").map((lineText, i) => {
                // Render [heading] as bold heading
                if (lineText.match(/^\[.+\]$/)) {
                  return (
                    <h4
                      key={i}
                      className="text-emerald-400 font-bold text-base mt-4 mb-2"
                    >
                      {lineText.replace(/^\[|\]$/g, "")}
                    </h4>
                  );
                }
                // Render - items as list
                if (lineText.trim().startsWith("- ")) {
                  return (
                    <div key={i} className="text-slate-200 pl-4">
                      <span className="text-emerald-400">•</span>{" "}
                      {lineText.trim().substring(2)}
                    </div>
                  );
                }
                // Render numbered items
                if (lineText.trim().match(/^\d+\./)) {
                  return (
                    <div key={i} className="text-slate-200 pl-4">
                      {lineText.trim()}
                    </div>
                  );
                }
                // Regular paragraph
                if (lineText.trim()) {
                  return (
                    <p key={i} className="text-slate-300">
                      {lineText}
                    </p>
                  );
                }
                return null;
              })}
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="btn-3d w-full mt-4 text-white font-bold py-3 rounded-xl"
        >
          {lang === "th" ? "ปิด" : "Close"}
        </button>
      </div>
    </div>
  );
}
