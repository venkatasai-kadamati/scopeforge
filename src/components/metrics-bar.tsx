"use client";

import React from "react";
import { ShieldCheck, ShieldAlert, AlertTriangle, Lock, Crosshair, Ban, CheckCircle } from "lucide-react";
import { PolicyMetrics } from "@/lib/policy/generator";
import { RedTeamSuiteResult } from "@/lib/attacks/simulator";

interface MetricsBarProps {
  metrics: PolicyMetrics | null;
  suiteResult: RedTeamSuiteResult | null;
  hasAnalyzed: boolean;
}

export function MetricsBar({ metrics, suiteResult, hasAnalyzed }: MetricsBarProps) {
  if (!hasAnalyzed || !metrics) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
          <div className="text-xs text-slate-400 font-mono flex items-center justify-between">
            <span>Exposed Capabilities</span>
            <Lock className="h-4 w-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">8</div>
          <div className="text-[11px] text-amber-400/90 mt-0.5">Email MCP Tools Connected</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
          <div className="text-xs text-slate-400 font-mono flex items-center justify-between">
            <span>Policy Status</span>
            <ShieldAlert className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300 mt-1">Uncompiled</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Awaiting intent analysis</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
          <div className="text-xs text-slate-400 font-mono flex items-center justify-between">
            <span>Authority Exposure</span>
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-1">100%</div>
          <div className="text-[11px] text-rose-300/80 mt-0.5">Zero-restriction surface</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
          <div className="text-xs text-slate-400 font-mono flex items-center justify-between">
            <span>Red-Team Test</span>
            <Crosshair className="h-4 w-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-slate-400 mt-1">Ready</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Compile policy to launch</div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
      {/* 1. Exposed */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5 shadow-sm">
        <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between">
          <span>Connected</span>
          <Lock className="h-3.5 w-3.5 text-slate-400" />
        </div>
        <div className="text-2xl font-bold text-slate-100 mt-1">{metrics.totalCapabilities}</div>
        <div className="text-[11px] text-slate-400 mt-0.5">Tools Exposed</div>
      </div>

      {/* 2. Required */}
      <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-xl p-3.5 shadow-sm">
        <div className="text-[11px] text-emerald-400 font-mono flex items-center justify-between">
          <span>Required</span>
          <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
        </div>
        <div className="text-2xl font-bold text-emerald-300 mt-1">{metrics.requiredCount}</div>
        <div className="text-[11px] text-emerald-400/80 mt-0.5">Strictly Essential</div>
      </div>

      {/* 3. Approval */}
      <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-3.5 shadow-sm">
        <div className="text-[11px] text-amber-400 font-mono flex items-center justify-between">
          <span>Approval</span>
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
        </div>
        <div className="text-2xl font-bold text-amber-300 mt-1">{metrics.approvalCount}</div>
        <div className="text-[11px] text-amber-400/80 mt-0.5">Human Sign-off</div>
      </div>

      {/* 4. Blocked */}
      <div className="bg-rose-950/20 border border-rose-800/40 rounded-xl p-3.5 shadow-sm">
        <div className="text-[11px] text-rose-400 font-mono flex items-center justify-between">
          <span>Blocked</span>
          <Ban className="h-3.5 w-3.5 text-rose-400" />
        </div>
        <div className="text-2xl font-bold text-rose-300 mt-1">{metrics.blockedCount}</div>
        <div className="text-[11px] text-rose-400/80 mt-0.5">Unnecessary Authority</div>
      </div>

      {/* 5. Authority Pruned */}
      <div className="bg-indigo-950/30 border border-indigo-700/50 rounded-xl p-3.5 shadow-sm">
        <div className="text-[11px] text-indigo-300 font-mono flex items-center justify-between">
          <span>Authority Removed</span>
          <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
        </div>
        <div className="text-2xl font-bold text-indigo-200 mt-1">
          {metrics.removedAuthorityPercent}%
        </div>
        <div className="text-[11px] text-indigo-300/80 mt-0.5">Attack Surface Cut</div>
      </div>

      {/* 6. Red-Team Containment */}
      <div className="bg-cyan-950/20 border border-cyan-800/40 rounded-xl p-3.5 shadow-sm">
        <div className="text-[11px] text-cyan-400 font-mono flex items-center justify-between">
          <span>Red-Team Escapes</span>
          <Crosshair className="h-3.5 w-3.5 text-cyan-400" />
        </div>
        <div className="text-2xl font-bold text-cyan-200 mt-1">
          {suiteResult ? suiteResult.unauthorizedEscapes : 0}
        </div>
        <div className="text-[11px] text-emerald-400 mt-0.5">
          {suiteResult ? `${suiteResult.dangerousCallsBlocked} blocked calls` : "0 unauthorized calls"}
        </div>
      </div>
    </div>
  );
}
