"use client";

import React, { useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, Sparkles } from "lucide-react";
import { ToolAnalysis, PermissionDecision } from "@/types";
import { getToolDefinition } from "@/lib/mcp/email-tools";

interface CapabilityMatrixProps {
  analysis: ToolAnalysis[];
  summary?: string;
  source?: string;
  modelName?: string;
}

export function CapabilityMatrix({
  analysis,
  summary,
  source,
  modelName
}: CapabilityMatrixProps) {
  const [filter, setFilter] = useState<"all" | PermissionDecision>("all");

  const requiredTools = analysis.filter(t => t.decision === "required");
  const approvalTools = analysis.filter(t => t.decision === "approval");
  const blockedTools = analysis.filter(t => t.decision === "blocked");

  const filteredItems = filter === "all" ? analysis : analysis.filter(t => t.decision === filter);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 items-center justify-center text-xs font-mono font-bold text-emerald-400">
            2
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white tracking-wide uppercase font-mono">
                Compiled Capability Matrix
              </h2>
              {source === "live-llm" ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5" />
                  {modelName || "Gemini Flash"}
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Deterministic Engine
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Granular classification inferred from agent intent &amp; tool schemas
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-xs font-mono">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-2 py-1 rounded transition-colors ${
              filter === "all" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All ({analysis.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("required")}
            className={`px-2 py-1 rounded transition-colors flex items-center gap-1 ${
              filter === "required"
                ? "bg-emerald-950/60 text-emerald-300 border border-emerald-700/50"
                : "text-slate-400 hover:text-emerald-400"
            }`}
          >
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            Required ({requiredTools.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("approval")}
            className={`px-2 py-1 rounded transition-colors flex items-center gap-1 ${
              filter === "approval"
                ? "bg-amber-950/60 text-amber-300 border border-amber-700/50"
                : "text-slate-400 hover:text-amber-400"
            }`}
          >
            <AlertTriangle className="h-3 w-3 text-amber-400" />
            Approval ({approvalTools.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("blocked")}
            className={`px-2 py-1 rounded transition-colors flex items-center gap-1 ${
              filter === "blocked"
                ? "bg-rose-950/60 text-rose-300 border border-rose-700/50"
                : "text-slate-400 hover:text-rose-400"
            }`}
          >
            <XCircle className="h-3 w-3 text-rose-400" />
            Blocked ({blockedTools.length})
          </button>
        </div>
      </div>

      {/* Summary Banner */}
      {summary && (
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-slate-300">
          <Info className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-200">Analysis Summary: </span>
            {summary}
          </div>
        </div>
      )}

      {/* Capabilities List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredItems.map(item => {
          const toolDef = getToolDefinition(item.name);
          const isRequired = item.decision === "required";
          const isApproval = item.decision === "approval";
          const isBlocked = item.decision === "blocked";

          return (
            <div
              key={item.name}
              className={`rounded-xl p-3.5 border transition-all ${
                isRequired
                  ? "bg-emerald-950/15 border-emerald-800/40 hover:border-emerald-700/60"
                  : isApproval
                  ? "bg-amber-950/15 border-amber-800/40 hover:border-amber-700/60"
                  : "bg-rose-950/15 border-rose-900/40 hover:border-rose-800/60"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  {isRequired && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
                  {isApproval && <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />}
                  {isBlocked && <XCircle className="h-4 w-4 text-rose-400 shrink-0" />}
                  <span className="font-mono font-semibold text-white text-xs sm:text-sm">
                    {item.name}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {toolDef && (
                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-black/40 text-slate-400">
                      {toolDef.riskLevel} risk
                    </span>
                  )}
                  <span
                    className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full font-bold ${
                      isRequired
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : isApproval
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    }`}
                  >
                    {item.decision}
                  </span>
                </div>
              </div>

              {/* Rationale */}
              <p className="text-xs text-slate-300 leading-relaxed pl-6">
                {item.reason}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
