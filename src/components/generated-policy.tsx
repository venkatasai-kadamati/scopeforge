"use client";

import React, { useState } from "react";
import { Copy, Check, ShieldCheck, Download } from "lucide-react";
import { Policy } from "@/types";

interface GeneratedPolicyProps {
  policy: Policy;
  policyYaml: string;
}

export function GeneratedPolicy({ policy, policyYaml }: GeneratedPolicyProps) {
  const [viewFormat, setViewFormat] = useState<"yaml" | "json" | "rules">("yaml");
  const [copied, setCopied] = useState(false);

  const jsonString = JSON.stringify(policy, null, 2);
  const textToCopy = viewFormat === "json" ? jsonString : policyYaml;

  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([textToCopy], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${policy.agent}-policy.${viewFormat === "json" ? "json" : "yaml"}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 rounded-full bg-blue-500/20 border border-blue-500/40 items-center justify-center text-xs font-mono font-bold text-blue-400">
            3
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white tracking-wide uppercase font-mono">
                Compiled Permission Policy
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                v{policy.version}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Deterministic declarative specification consumed by the runtime policy engine
            </p>
          </div>
        </div>

        {/* View Toggle & Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              type="button"
              onClick={() => setViewFormat("yaml")}
              className={`px-2.5 py-1 rounded transition-colors ${
                viewFormat === "yaml" ? "bg-indigo-600 text-white font-medium" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              YAML
            </button>
            <button
              type="button"
              onClick={() => setViewFormat("json")}
              className={`px-2.5 py-1 rounded transition-colors ${
                viewFormat === "json" ? "bg-indigo-600 text-white font-medium" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              JSON
            </button>
            <button
              type="button"
              onClick={() => setViewFormat("rules")}
              className={`px-2.5 py-1 rounded transition-colors ${
                viewFormat === "rules" ? "bg-indigo-600 text-white font-medium" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Rules
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 transition-colors"
            title="Copy to clipboard"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 transition-colors"
            title="Download policy file"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Architectural Guarantee Callout */}
      <div className="bg-indigo-950/20 border border-indigo-800/40 rounded-xl p-3 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <div className="font-semibold text-indigo-200">
            Deterministic Runtime Enforcement Guarantee
          </div>
          <p className="text-slate-300 leading-relaxed">
            The LLM reasons at compile-time to infer this policy. At runtime, every tool invocation passes through deterministic gate code (<code className="font-mono text-indigo-300 bg-indigo-950/80 px-1 py-0.5 rounded">evaluateToolCall</code>).
            The LLM is <strong>never</strong> consulted to authorize tool calls on the fly.
          </p>
        </div>
      </div>

      {/* Policy Content Viewer */}
      {viewFormat === "yaml" && (
        <div className="relative">
          <pre className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-xs sm:text-sm font-mono text-emerald-300/90 overflow-x-auto leading-relaxed">
            {policyYaml}
          </pre>
        </div>
      )}

      {viewFormat === "json" && (
        <div className="relative">
          <pre className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-xs sm:text-sm font-mono text-cyan-300/90 overflow-x-auto leading-relaxed">
            {jsonString}
          </pre>
        </div>
      )}

      {viewFormat === "rules" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Allow */}
          <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-emerald-400">
              <span>ALLOW ({policy.allow.length})</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20">pass</span>
            </div>
            <ul className="space-y-1 font-mono text-xs text-slate-300">
              {policy.allow.map(t => (
                <li key={t} className="flex items-center gap-1.5">
                  <span className="text-emerald-400">✓</span> {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Approval */}
          <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-400">
              <span>HUMAN APPROVAL ({policy.approval.length})</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20">gate</span>
            </div>
            <ul className="space-y-1 font-mono text-xs text-slate-300">
              {policy.approval.length > 0 ? (
                policy.approval.map(t => (
                  <li key={t} className="flex items-center gap-1.5">
                    <span className="text-amber-400">!</span> {t}
                  </li>
                ))
              ) : (
                <li className="text-slate-500 italic">None</li>
              )}
            </ul>
          </div>

          {/* Deny */}
          <div className="bg-rose-950/20 border border-rose-800/40 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-rose-400">
              <span>DENY / BLOCKED ({policy.deny.length})</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20">drop</span>
            </div>
            <ul className="space-y-1 font-mono text-xs text-slate-300">
              {policy.deny.map(t => (
                <li key={t} className="flex items-center gap-1.5">
                  <span className="text-rose-400">×</span> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
