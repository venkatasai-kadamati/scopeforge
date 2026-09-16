"use client";

import React, { useState } from "react";
import { Sparkles, Terminal, Cpu, ArrowRight, ChevronDown, ChevronUp, Layers } from "lucide-react";
import { ToolDefinition } from "@/types";
import { EMAIL_MCP_TOOLS } from "@/lib/mcp/email-tools";

interface AgentDefinitionProps {
  purpose: string;
  onChangePurpose: (val: string) => void;
  onAnalyze: () => void;
  onLoadDemo: () => void;
  isAnalyzing: boolean;
  hasAnalyzed: boolean;
}

export function AgentDefinition({
  purpose,
  onChangePurpose,
  onAnalyze,
  onLoadDemo,
  isAnalyzing,
  hasAnalyzed
}: AgentDefinitionProps) {
  const [showToolsDrawer, setShowToolsDrawer] = useState(false);
  const [selectedToolDetail, setSelectedToolDetail] = useState<ToolDefinition | null>(null);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header & Step Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 rounded-full bg-indigo-500/20 border border-indigo-500/40 items-center justify-center text-xs font-mono font-bold text-indigo-400">
            1
          </span>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-wide uppercase font-mono">
              Agent Purpose & Tool Environment
            </h2>
            <p className="text-xs text-slate-400">
              Define the agent&apos;s natural-language intent and review connected MCP tools
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onLoadDemo}
            className="px-3 py-1 text-xs rounded-lg border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-medium transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="h-3 w-3 text-indigo-400" />
            Load Demo
          </button>
        </div>
      </div>

      {/* Purpose Prompt Area */}
      <div>
        <label className="block text-xs font-mono text-slate-300 mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Terminal className="h-3.5 w-3.5 text-indigo-400" />
            Declared Agent Purpose:
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            {purpose.length} characters
          </span>
        </label>
        <textarea
          rows={4}
          value={purpose}
          onChange={e => onChangePurpose(e.target.value)}
          placeholder="e.g. Read my inbox, identify important messages, summarize them, and prepare draft replies. The agent must never send or delete emails automatically."
          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm font-sans text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 leading-relaxed font-mono"
        />
      </div>

      {/* Connected MCP Tools Preview Bar */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-medium text-slate-200">
              Connected Email MCP Environment:
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {EMAIL_MCP_TOOLS.length} capabilities exposed
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowToolsDrawer(!showToolsDrawer)}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono"
          >
            <span>{showToolsDrawer ? "Hide Tool Schemas" : "Inspect 8 Schemas"}</span>
            {showToolsDrawer ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Quick tool chips */}
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {EMAIL_MCP_TOOLS.map(tool => {
            const isHighRisk = tool.riskLevel === "high";
            const isMediumRisk = tool.riskLevel === "medium";
            return (
              <button
                key={tool.name}
                type="button"
                onClick={() => setSelectedToolDetail(tool)}
                className={`text-[11px] font-mono px-2.5 py-1 rounded-md border transition-colors flex items-center gap-1.5 ${
                  isHighRisk
                    ? "bg-rose-950/30 border-rose-800/50 text-rose-300 hover:bg-rose-900/40"
                    : isMediumRisk
                    ? "bg-amber-950/30 border-amber-800/50 text-amber-300 hover:bg-amber-900/40"
                    : "bg-slate-900 border-slate-700/80 text-slate-300 hover:bg-slate-800"
                }`}
              >
                <span>{tool.name}</span>
                <span className="text-[9px] uppercase px-1 rounded bg-black/40 text-slate-400">
                  {tool.riskLevel}
                </span>
              </button>
            );
          })}
        </div>

        {/* Expandable tool schema inspector */}
        {showToolsDrawer && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
            {EMAIL_MCP_TOOLS.map(tool => (
              <div
                key={tool.name}
                className="bg-slate-900/70 border border-slate-800 rounded-lg p-2.5 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-slate-200">{tool.name}</span>
                  <span
                    className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                      tool.riskLevel === "high"
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        : tool.riskLevel === "medium"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    }`}
                  >
                    {tool.riskLevel} risk
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">{tool.description}</p>
                <div className="text-[10px] font-mono text-slate-500 truncate">
                  params: {Object.keys((tool.parameters as { properties?: object })?.properties || {}).join(", ")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Primary Action Button */}
      <div className="flex items-center justify-between pt-1">
        <div className="text-xs text-slate-400 flex items-center gap-1.5">
          <Cpu className="h-3.5 w-3.5 text-indigo-400" />
          <span>Calculates minimum necessary capabilities via semantic analysis</span>
        </div>

        <button
          type="button"
          onClick={onAnalyze}
          disabled={isAnalyzing || !purpose.trim()}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-medium text-xs sm:text-sm shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {isAnalyzing ? (
            <>
              <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              <span>Analyzing Capabilities...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-indigo-200" />
              <span>{hasAnalyzed ? "Re-Analyze Permissions" : "Analyze Permissions"}</span>
              <ArrowRight className="h-3.5 w-3.5 text-indigo-200 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </div>

      {/* Tool Detail Modal if clicked */}
      {selectedToolDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-white text-sm">
                  {selectedToolDetail.name}
                </span>
                <span
                  className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                    selectedToolDetail.riskLevel === "high"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : selectedToolDetail.riskLevel === "medium"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  }`}
                >
                  {selectedToolDetail.riskLevel} risk
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedToolDetail(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">{selectedToolDetail.description}</p>

            <div>
              <div className="text-[11px] font-mono text-slate-400 mb-1">Tool Schema Parameters:</div>
              <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-48">
                {JSON.stringify(selectedToolDetail.parameters, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setSelectedToolDetail(null)}
                className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
