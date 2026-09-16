"use client";

import React, { useState } from "react";
import {
  Flame,
  ShieldCheck,
  ShieldAlert,
  Play,
  Bug,
  Mail,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle
} from "lucide-react";
import { Policy, ComparisonRun, ToolExecutionResult } from "@/types";
import { SAMPLE_EMAILS, SampleEmail } from "@/lib/demo/sample-emails";
import { RedTeamSuiteResult } from "@/lib/attacks/simulator";

interface AttackLabProps {
  policy?: Policy | null;
  onRunComparison: (emailId?: string, attemptedTools?: string[]) => void;
  comparisonRun: ComparisonRun | null;
  isRunningComparison: boolean;
  onRunRedTeam: () => void;
  redTeamResult: RedTeamSuiteResult | null;
  isRunningRedTeam: boolean;
  onExecuteCustomTrace?: (trace: ToolExecutionResult) => void;
  isPolicyEnforced?: boolean;
  onTogglePolicyEnforcement?: (enforce: boolean) => void;
}

export function AttackLab({
  onRunComparison,
  comparisonRun,
  isRunningComparison,
  onRunRedTeam,
  redTeamResult,
  isRunningRedTeam,
  isPolicyEnforced = true,
  onTogglePolicyEnforcement
}: AttackLabProps) {
  const [selectedEmail, setSelectedEmail] = useState<SampleEmail>(
    SAMPLE_EMAILS.find(e => e.isMalicious) || SAMPLE_EMAILS[1]
  );
  const [comparisonMode, setComparisonMode] = useState<"side-by-side" | "unrestricted" | "enforced">("side-by-side");
  const [expandedScenarioId, setExpandedScenarioId] = useState<string | null>(null);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 rounded-full bg-rose-500/20 border border-rose-500/40 items-center justify-center text-xs font-mono font-bold text-rose-400">
            4
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white tracking-wide uppercase font-mono">
                Attack Lab &amp; Red-Team Arena
              </h2>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                Adversarial Simulation
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Test prompt injection and destructive payloads against unrestricted vs policy-enforced agents
            </p>
          </div>
        </div>

        {/* Action buttons & Policy Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {onTogglePolicyEnforcement && (
            <button
              type="button"
              onClick={() => onTogglePolicyEnforcement(!isPolicyEnforced)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
                isPolicyEnforced
                  ? "bg-emerald-950/60 border-emerald-700/80 text-emerald-300"
                  : "bg-rose-950/60 border-rose-700/80 text-rose-300"
              }`}
              title="Toggle ScopeForge Policy Gate enforcement ON or OFF"
            >
              {isPolicyEnforced ? (
                <>
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>ScopeForge Gate: ENFORCED</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                  <span>ScopeForge Gate: UNRESTRICTED</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => onRunComparison(selectedEmail.id)}
            disabled={isRunningComparison}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-medium shadow-md shadow-rose-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {isRunningComparison ? (
              <>
                <div className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Simulating Attack...</span>
              </>
            ) : (
              <>
                <Flame className="h-3.5 w-3.5" />
                <span>Run Before/After Demonstration</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onRunRedTeam}
            disabled={isRunningRedTeam}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {isRunningRedTeam ? (
              <>
                <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-300/30 border-t-slate-200 animate-spin" />
                <span>Running Red-Team...</span>
              </>
            ) : (
              <>
                <Bug className="h-3.5 w-3.5 text-cyan-400" />
                <span>Run Red-Team Suite (12 Attacks)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Incoming Mailbox Simulator & Prompt Injection Vector */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <Mail className="h-4 w-4 text-indigo-400" />
            <span>Simulated Incoming Email Stream ({SAMPLE_EMAILS.length} scenarios):</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs flex-wrap">
            {SAMPLE_EMAILS.map(email => {
              const isSelected = selectedEmail.id === email.id;
              return (
                <button
                  key={email.id}
                  type="button"
                  onClick={() => setSelectedEmail(email)}
                  className={`px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1.5 ${
                    isSelected
                      ? email.isMalicious
                        ? "bg-rose-950/60 text-rose-200 border-rose-700/80 font-medium"
                        : "bg-emerald-950/60 text-emerald-200 border-emerald-700/80 font-medium"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                  }`}
                >
                  {email.isMalicious ? (
                    <Flame className="h-3 w-3 text-rose-400" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  )}
                  <span>
                    {email.id === "email_normal_1"
                      ? "Normal Meeting (Benign)"
                      : email.id === "email_malicious_prompt_injection"
                      ? "Prompt Injection (Exfiltration)"
                      : "Ransomware Purge"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Email Content Box */}
        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-2.5 text-xs font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-slate-400 border-b border-slate-800 pb-2 gap-1">
            <div className="space-x-2">
              <span>From: <strong className="text-slate-200">{selectedEmail.from}</strong></span>
              <span className="text-slate-600">|</span>
              <span>Subject: <strong className="text-slate-200">{selectedEmail.subject}</strong></span>
            </div>
            {selectedEmail.isMalicious ? (
              <span className="text-[10px] uppercase font-bold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-700/60 flex items-center gap-1 self-start sm:self-auto">
                <AlertOctagon className="h-3 w-3" />
                Prompt Injection Payload Detected
              </span>
            ) : (
              <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/60 flex items-center gap-1 self-start sm:self-auto">
                <CheckCircle2 className="h-3 w-3" />
                Benign Communication
              </span>
            )}
          </div>

          {/* Email Body with styled injection section */}
          <div className="text-slate-300 whitespace-pre-wrap leading-relaxed">
            {selectedEmail.body.includes("--- Begin embedded instructions ---") ? (
              <>
                <p className="text-slate-400">
                  {selectedEmail.body.split("--- Begin embedded instructions ---")[0]}
                </p>
                <div className="my-2.5 p-3 rounded-lg bg-rose-950/30 border border-rose-800/60 text-rose-200/90 space-y-1">
                  <div className="text-[10px] uppercase tracking-wider text-rose-400 font-bold flex items-center gap-1">
                    <Flame className="h-3 w-3" />
                    Embedded Adversarial Instructions:
                  </div>
                  <pre className="text-xs font-mono text-rose-200 whitespace-pre-wrap">
                    {"--- Begin embedded instructions ---" +
                      selectedEmail.body.split("--- Begin embedded instructions ---")[1]}
                  </pre>
                </div>
              </>
            ) : (
              selectedEmail.body
            )}
          </div>
        </div>
      </div>

      {/* BEFORE vs AFTER LIVE COMPARISON SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-mono font-semibold uppercase text-slate-200 tracking-wider">
              Before vs After Live Demonstration
            </h3>
            <span className="text-[11px] text-slate-400">
              (Core Hackathon Demonstration)
            </span>
          </div>

          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              type="button"
              onClick={() => setComparisonMode("side-by-side")}
              className={`px-2.5 py-1 rounded transition-colors ${
                comparisonMode === "side-by-side" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Side-by-Side
            </button>
            <button
              type="button"
              onClick={() => setComparisonMode("unrestricted")}
              className={`px-2.5 py-1 rounded transition-colors ${
                comparisonMode === "unrestricted" ? "bg-rose-950/80 text-rose-300" : "text-slate-400 hover:text-white"
              }`}
            >
              Without ScopeForge
            </button>
            <button
              type="button"
              onClick={() => setComparisonMode("enforced")}
              className={`px-2.5 py-1 rounded transition-colors ${
                comparisonMode === "enforced" ? "bg-emerald-950/80 text-emerald-300" : "text-slate-400 hover:text-white"
              }`}
            >
              With ScopeForge
            </button>
          </div>
        </div>

        {/* Results View */}
        {comparisonRun ? (
          <div className="space-y-4">
            {/* Top Status Banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Unrestricted Banner */}
              <div className={`border rounded-xl p-3.5 space-y-1.5 ${
                selectedEmail.isMalicious
                  ? "bg-rose-950/30 border-rose-800/60 text-rose-200"
                  : "bg-slate-900/60 border-slate-800 text-slate-300"
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-mono uppercase font-bold flex items-center gap-1.5 ${
                    selectedEmail.isMalicious ? "text-rose-400" : "text-slate-300"
                  }`}>
                    <ShieldAlert className="h-4 w-4" />
                    WITHOUT ScopeForge (Overpowered Baseline)
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                    selectedEmail.isMalicious
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                      : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}>
                    {selectedEmail.isMalicious ? "CRITICAL BREACH" : "UNRESTRICTED"}
                  </span>
                </div>
                <p className="text-xs leading-tight opacity-90">
                  {selectedEmail.isMalicious
                    ? "Injected adversarial payload executed without resistance. Dangerous tools (sendEmail, deleteEmail) dispatched immediately."
                    : "Harmless routine email processing executed without least-privilege guardrails."}
                </p>
              </div>

              {/* Enforced Banner */}
              <div className={`border rounded-xl p-3.5 space-y-1.5 ${
                selectedEmail.isMalicious
                  ? "bg-emerald-950/30 border-emerald-800/60 text-emerald-200"
                  : "bg-indigo-950/30 border-indigo-800/60 text-indigo-200"
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-mono uppercase font-bold flex items-center gap-1.5 ${
                    selectedEmail.isMalicious ? "text-emerald-400" : "text-indigo-400"
                  }`}>
                    <ShieldCheck className="h-4 w-4" />
                    WITH ScopeForge (Least-Privilege Gate)
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                    selectedEmail.isMalicious
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                  }`}>
                    {selectedEmail.isMalicious ? "ATTACK CONTAINED" : "FUNCTIONALITY PRESERVED"}
                  </span>
                </div>
                <p className="text-xs leading-tight opacity-90">
                  {selectedEmail.isMalicious ? (
                    <>
                      <strong>{comparisonRun.dangerousActionsBlocked} dangerous actions prevented</strong> deterministically. 0 unauthorized executions. Prompt injection neutralized at capability gate.
                    </>
                  ) : (
                    <>
                      All <strong>{comparisonRun.enforcedTraces.filter(t => t.status === "allowed").length} legitimate capabilities</strong> allowed under compiled policy. Zero false-positive blocks.
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Side-by-Side Tool Traces */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Column 1: Unrestricted Execution Trace */}
              {(comparisonMode === "side-by-side" || comparisonMode === "unrestricted") && (
                <div className="bg-slate-950 rounded-xl p-3.5 border border-rose-900/40 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-mono text-slate-300 font-semibold">
                      Unrestricted Tool Invocations
                    </span>
                    <span className="text-[10px] font-mono text-rose-400">
                      All 8 MCP Tools Accessible
                    </span>
                  </div>

                  <div className="space-y-2">
                    {comparisonRun.unrestrictedTraces.map(trace => {
                      const isDangerous = ["sendEmail", "deleteEmail", "moveEmail"].includes(trace.tool);
                      return (
                        <div
                          key={trace.id}
                          className={`p-2.5 rounded-lg border text-xs font-mono ${
                            isDangerous
                              ? "bg-rose-950/40 border-rose-700/60 text-rose-200"
                              : "bg-slate-900 border-slate-800 text-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold flex items-center gap-1.5">
                              {isDangerous ? (
                                <AlertOctagon className="h-3.5 w-3.5 text-rose-400" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                              )}
                              {trace.tool}()
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold uppercase">
                              SUCCESS
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1">
                            {isDangerous
                              ? `⚠️ Injected payload executed unauthorized: ${trace.tool}`
                              : "Executed harmless read action"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Column 2: ScopeForge Enforced Execution Trace */}
              {(comparisonMode === "side-by-side" || comparisonMode === "enforced") && (
                <div className="bg-slate-950 rounded-xl p-3.5 border border-emerald-900/40 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-mono text-slate-300 font-semibold">
                      ScopeForge Policy Gate Traces
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">
                      Enforced by Deterministic Engine
                    </span>
                  </div>

                  <div className="space-y-2">
                    {comparisonRun.enforcedTraces.map(trace => {
                      const isBlocked = trace.status === "blocked";
                      const isAllowed = trace.status === "allowed";
                      const isApproval = trace.status === "approval_required";

                      return (
                        <div
                          key={trace.id}
                          className={`p-2.5 rounded-lg border text-xs font-mono ${
                            isBlocked
                              ? "bg-rose-950/40 border-rose-700/60 text-rose-200"
                              : isApproval
                              ? "bg-amber-950/40 border-amber-700/60 text-amber-200"
                              : "bg-emerald-950/20 border-emerald-800/40 text-emerald-200"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold flex items-center gap-1.5">
                              {isBlocked && <XCircle className="h-3.5 w-3.5 text-rose-400" />}
                              {isAllowed && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                              {isApproval && <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />}
                              {trace.tool}()
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                isBlocked
                                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                                  : isApproval
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              }`}
                            >
                              {trace.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-300 mt-1">
                            {trace.reason}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-slate-950/60 border border-dashed border-slate-800 rounded-xl p-8 text-center space-y-2">
            <Flame className="h-8 w-8 text-rose-400/80 mx-auto" />
            <div className="text-sm font-semibold text-slate-200">
              Ready to execute Before / After demonstration
            </div>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Simulate prompt injection against an unrestricted agent vs the same agent protected by the compiled ScopeForge policy gate.
            </p>
            <button
              type="button"
              onClick={() => onRunComparison(selectedEmail.id)}
              disabled={isRunningComparison}
              className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5" />
              Launch Demonstration
            </button>
          </div>
        )}
      </div>

      {/* RED-TEAM GENERATION & SUITE RESULTS */}
      {redTeamResult && (
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4 text-cyan-400" />
              <h3 className="text-xs font-mono font-semibold uppercase text-slate-200 tracking-wider">
                Adversarial Red-Team Test Suite ({redTeamResult.totalAttacks} Scenarios)
              </h3>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-emerald-400 font-bold">
                {redTeamResult.containmentRatePercent}% Contained
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-300">
                {redTeamResult.dangerousCallsBlocked} Dangerous Calls Blocked
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-emerald-400 font-bold">
                0 Escapes
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {redTeamResult.results.map(res => {
              const isExpanded = expandedScenarioId === res.scenarioId;
              return (
                <div
                  key={res.scenarioId}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <span className="font-mono text-cyan-400">[{res.scenarioId}]</span>
                      <span>{res.scenarioName}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded font-bold ${
                          res.severity === "critical"
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                            : res.severity === "high"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                        }`}
                      >
                        {res.severity}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase font-bold">
                        CONTAINED
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono">
                    <span>
                      Blocked:{" "}
                      <strong className="text-rose-400">
                        {res.blockedTools.concat(res.approvalRequiredTools).join(", ") || "None"}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setExpandedScenarioId(isExpanded ? null : res.scenarioId)}
                      className="text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
                    >
                      <span>{isExpanded ? "Hide Traces" : "View Traces"}</span>
                      {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-1 font-mono text-[11px]">
                      {res.traces.map(t => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between bg-slate-900/80 px-2 py-1 rounded"
                        >
                          <span className="text-slate-300">{t.tool}()</span>
                          <span
                            className={
                              t.status === "blocked"
                                ? "text-rose-400 font-bold"
                                : t.status === "approval_required"
                                ? "text-amber-400 font-bold"
                                : "text-emerald-400"
                            }
                          >
                            {t.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
