"use client";

import React, { useState, useRef } from "react";
import { Navbar } from "@/components/navbar";
import { MetricsBar } from "@/components/metrics-bar";
import { AgentDefinition } from "@/components/agent-definition";
import { CapabilityMatrix } from "@/components/capability-matrix";
import { GeneratedPolicy } from "@/components/generated-policy";
import { AttackLab } from "@/components/attack-lab";
import { RuntimeTrace } from "@/components/runtime-trace";
import { DEMO_PRESETS } from "@/lib/demo/sample-emails";
import {
  ToolAnalysis,
  Policy,
  ComparisonRun,
  ToolExecutionResult
} from "@/types";
import { PolicyMetrics } from "@/lib/policy/generator";
import { RedTeamSuiteResult } from "@/lib/attacks/simulator";
import { executeGatedToolCall } from "@/lib/policy/engine";
import { Shield, AlertCircle } from "lucide-react";

export default function Home() {
  // State management
  const defaultPreset = DEMO_PRESETS[0];
  const [activePresetId, setActivePresetId] = useState<string>(defaultPreset.id);
  const [purpose, setPurpose] = useState<string>(defaultPreset.purpose);
  const [apiKey, setApiKey] = useState<string>("");

  // Analysis & Policy State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ToolAnalysis[] | null>(null);
  const [analysisSummary, setAnalysisSummary] = useState<string>("");
  const [engineSource, setEngineSource] = useState<string>("");
  const [modelName, setModelName] = useState<string>("");
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [policyYaml, setPolicyYaml] = useState<string>("");
  const [metrics, setMetrics] = useState<PolicyMetrics | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Attack Lab & Red-Team State
  const [comparisonRun, setComparisonRun] = useState<ComparisonRun | null>(null);
  const [isRunningComparison, setIsRunningComparison] = useState(false);
  const [redTeamResult, setRedTeamResult] = useState<RedTeamSuiteResult | null>(null);
  const [isRunningRedTeam, setIsRunningRedTeam] = useState(false);
  const [isPolicyEnforced, setIsPolicyEnforced] = useState<boolean>(true);

  // Runtime Audit Log Traces
  const [traces, setTraces] = useState<ToolExecutionResult[]>([]);

  // Smooth scroll refs
  const matrixRef = useRef<HTMLDivElement>(null);
  const attackLabRef = useRef<HTMLDivElement>(null);

  // Load Preset
  const handleSelectPreset = (presetId: string) => {
    const preset = DEMO_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setActivePresetId(preset.id);
      setPurpose(preset.purpose);
      // Reset downstream compilation when preset changes
      setAnalysis(null);
      setPolicy(null);
      setComparisonRun(null);
      setRedTeamResult(null);
    }
  };

  const handleLoadDemo = () => {
    handleSelectPreset(defaultPreset.id);
  };

  const handleReset = () => {
    handleSelectPreset(defaultPreset.id);
    setTraces([]);
    setErrorMsg(null);
  };

  // Compile / Analyze Permissions
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose, apiKey, presetId: activePresetId })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Capability analysis failed");
      }

      setAnalysis(data.analysis);
      setAnalysisSummary(data.summary);
      setEngineSource(data.source);
      setModelName(data.modelName);
      setPolicy(data.policy);
      setPolicyYaml(data.policyYaml);
      setMetrics(data.metrics);
      setIsPolicyEnforced(true);

      // Auto scroll smoothly to compiled matrix
      setTimeout(() => {
        matrixRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Error analyzing permissions");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Run Before vs After Attack Comparison
  const handleRunComparison = async (emailId?: string, attemptedTools?: string[]) => {
    setIsRunningComparison(true);
    setErrorMsg(null);

    try {
      const effectivePolicy = isPolicyEnforced ? policy : null;
      const res = await fetch("/api/attacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose,
          policy: effectivePolicy,
          apiKey,
          emailId: emailId || "email_malicious_prompt_injection",
          attemptedTools,
          mode: "comparison"
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Simulation failed");
      }

      setComparisonRun(data.comparisonRun);

      // Prepend the new traces into the live runtime log
      if (data.comparisonRun?.enforcedTraces) {
        setTraces(prev => [...data.comparisonRun.enforcedTraces, ...prev]);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Error executing comparison");
    } finally {
      setIsRunningComparison(false);
    }
  };

  // Run Full Red-Team Suite
  const handleRunRedTeam = async () => {
    setIsRunningRedTeam(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/attacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose,
          policy: policy,
          apiKey,
          mode: "red-team"
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Red team suite failed");
      }

      setRedTeamResult(data.suiteResult);

      // Append sample traces to log
      const allSuiteTraces = data.suiteResult.results.flatMap((r: { traces: ToolExecutionResult[] }) => r.traces);
      setTraces(prev => [...allSuiteTraces.slice(0, 8), ...prev]);
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Error running red-team");
    } finally {
      setIsRunningRedTeam(false);
    }
  };

  // Human-in-the-loop Approval Action
  const handleApproveTrace = async (traceId: string, toolName: string, args?: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolName,
          policy: isPolicyEnforced ? policy : null,
          args: args || {},
          bypassPolicy: !isPolicyEnforced,
          userApproved: true
        })
      });
      const data = await res.json();
      if (data.success && data.trace) {
        setTraces(prev => prev.map(t => (t.id === traceId ? data.trace : t)));
        return;
      }
    } catch {
      // Offline fallback
    }

    const approvedTrace = executeGatedToolCall(
      toolName,
      isPolicyEnforced ? policy : null,
      args || {},
      !isPolicyEnforced,
      true
    );

    setTraces(prev =>
      prev.map(t => (t.id === traceId ? approvedTrace : t))
    );
  };

  // Manual Trace added
  const handleAddManualTrace = (newTrace: ToolExecutionResult) => {
    setTraces(prev => [newTrace, ...prev]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080c14] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Navbar */}
      <Navbar
        activePresetId={activePresetId}
        onSelectPreset={handleSelectPreset}
        onReset={handleReset}
        apiKey={apiKey}
        onSaveApiKey={setApiKey}
        isAnalyzing={isAnalyzing}
        engineSource={engineSource}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Error Banner if any */}
        {errorMsg && (
          <div className="bg-rose-950/40 border border-rose-800 rounded-xl p-3 flex items-center justify-between text-xs text-rose-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* Executive Metrics Bar */}
        <MetricsBar
          metrics={metrics}
          suiteResult={redTeamResult}
          hasAnalyzed={Boolean(analysis)}
        />

        {/* Step 1: Agent Definition & MCP Environment */}
        <AgentDefinition
          purpose={purpose}
          onChangePurpose={setPurpose}
          onAnalyze={handleAnalyze}
          onLoadDemo={handleLoadDemo}
          isAnalyzing={isAnalyzing}
          hasAnalyzed={Boolean(analysis)}
        />

        {/* Step 2 & 3: Capability Matrix & Generated Policy */}
        {analysis && policy && (
          <div ref={matrixRef} className="space-y-6 animate-in fade-in duration-300">
            {/* Step 2: Capability Matrix */}
            <CapabilityMatrix
              analysis={analysis}
              summary={analysisSummary}
              source={engineSource}
              modelName={modelName}
            />

            {/* Step 3: Generated Policy */}
            <GeneratedPolicy
              policy={policy}
              policyYaml={policyYaml}
            />
          </div>
        )}

        {/* Step 4: Attack Lab & Red-Team */}
        <div ref={attackLabRef}>
          <AttackLab
            policy={policy}
            onRunComparison={handleRunComparison}
            comparisonRun={comparisonRun}
            isRunningComparison={isRunningComparison}
            onRunRedTeam={handleRunRedTeam}
            redTeamResult={redTeamResult}
            isRunningRedTeam={isRunningRedTeam}
            onExecuteCustomTrace={handleAddManualTrace}
            isPolicyEnforced={isPolicyEnforced}
            onTogglePolicyEnforcement={setIsPolicyEnforced}
          />
        </div>

        {/* Step 5: Runtime Audit Trace */}
        <RuntimeTrace
          traces={traces}
          policy={policy}
          onClearTraces={() => setTraces([])}
          onApproveTrace={handleApproveTrace}
          onAddManualTrace={handleAddManualTrace}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-4 py-6 text-center text-xs text-slate-500 font-mono space-y-1">
        <div className="flex items-center justify-center gap-2 text-slate-400">
          <Shield className="h-4 w-4 text-indigo-400" />
          <span className="font-semibold text-slate-300">ScopeForge</span>
          <span>—</span>
          <span>Compile intent into permissions &bull; Enforce deterministically &bull; Red-team before deployment</span>
        </div>
        <div>
          Separation of Concerns: AI reasons on intent; pure deterministic code enforces runtime policy.
        </div>
      </footer>
    </div>
  );
}
