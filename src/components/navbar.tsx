"use client";

import React, { useState } from "react";
import { Shield, Sparkles, RefreshCw, Key, CheckCircle2 } from "lucide-react";
import { DEMO_PRESETS } from "@/lib/demo/sample-emails";

interface NavbarProps {
  activePresetId: string;
  onSelectPreset: (presetId: string) => void;
  onReset: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  isAnalyzing: boolean;
  engineSource?: string;
}

export function Navbar({
  activePresetId,
  onSelectPreset,
  onReset,
  apiKey,
  onSaveApiKey,
  isAnalyzing
}: NavbarProps) {
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);

  const handleSaveKey = () => {
    onSaveApiKey(tempKey);
    setShowKeyModal(false);
  };

  return (
    <>
      <header className="border-b border-slate-800 bg-[#090d16]/90 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20">
                <div className="h-full w-full bg-slate-950 rounded-[7px] flex items-center justify-center">
                  <Shield className="h-5 w-5 text-indigo-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg tracking-tight text-white">ScopeForge</span>
                  <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                    Least-Privilege Compiler
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">
                  Compile agent intent into minimum permissions & red-team before deployment
                </p>
              </div>
            </div>

            {/* Engine Indicator Pill */}
            <div className="md:hidden">
              <button
                onClick={() => setShowKeyModal(true)}
                className="text-xs px-2.5 py-1 rounded-md border border-slate-700 bg-slate-900 text-slate-300 hover:text-white flex items-center gap-1.5"
              >
                <Key className="h-3 w-3 text-amber-400" />
                <span>{apiKey ? "Live Gemini" : "Demo Mode"}</span>
              </button>
            </div>
          </div>

          {/* Action Controls & Presets */}
          <div className="flex items-center gap-2.5 flex-wrap justify-end w-full md:w-auto">
            {/* Presets Selector */}
            <div className="flex items-center rounded-lg bg-slate-900/80 p-1 border border-slate-800 text-xs">
              <span className="text-slate-400 px-2 py-1 font-medium flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-indigo-400" />
                Preset:
              </span>
              {DEMO_PRESETS.map(preset => {
                const isActive = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => onSelectPreset(preset.id)}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      isActive
                        ? "bg-indigo-600 text-white font-medium shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {preset.title.split(" ")[0]}
                  </button>
                );
              })}
            </div>

            {/* API Config Button */}
            <button
              onClick={() => {
                setTempKey(apiKey);
                setShowKeyModal(true);
              }}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-xs text-slate-300 transition-colors"
              title="Configure Gemini API Key"
            >
              <Key className="h-3.5 w-3.5 text-amber-400" />
              <span>{apiKey ? "Gemini Key Active" : "AI Mode: Auto / Offline-Safe"}</span>
            </button>

            {/* Reset Button */}
            <button
              onClick={onReset}
              disabled={isAnalyzing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-xs text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
              title="Reset to initial state"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>
      </header>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-amber-400" />
                <h3 className="font-semibold text-white">AI Engine Configuration</h3>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              ScopeForge connects to Google Gemini (or any LLM) to semantically analyze tool parameters and generate red-team attack scenarios.
              <span className="block mt-1 text-emerald-400 font-medium">
                ✓ Offline-safe fallback fixture is pre-loaded — ScopeForge works 100% reliably out of the box even without an API key!
              </span>
            </p>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Gemini API Key (Optional)
              </label>
              <input
                type="password"
                value={tempKey}
                onChange={e => setTempKey(e.target.value)}
                placeholder="AIzaSy... (Leave empty to use built-in offline fixture)"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />
                <span>Deterministic Runtime Guarantee</span>
              </div>
              <p>
                The LLM is only used for compile-time permission recommendations and red-team generation. Execution-time enforcement is 100% deterministic code.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveKey}
                className="px-4 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
