import React, { useState } from 'react';
import { 
  Shield, Database, Play, Search, Bell, Lock, Cpu, CheckCircle2, UserCheck, RefreshCw 
} from 'lucide-react';
import { Badge } from './Badge';

interface NavbarProps {
  onOpenSearch: () => void;
  onGenerateDemo: () => Promise<void>;
  onRunAssessment: () => Promise<void>;
  isProcessing: boolean;
  currentUser?: { username: string; name: string; role: string };
  lastAnalyzed?: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSearch,
  onGenerateDemo,
  onRunAssessment,
  isProcessing,
  currentUser = { username: 'supervisor', name: 'NCIIPC Senior Supervisor', role: 'SUPERVISOR' },
  lastAnalyzed
}) => {
  return (
    <header className="h-16 bg-slate-950 border-b border-slate-800/80 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-md">
      {/* Brand & Mandate */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-black text-sm tracking-wider text-slate-100">SAT-SA</span>
            <span className="text-[11px] font-mono text-cyan-400 font-semibold uppercase tracking-wider hidden sm:inline">
              Supervisory Analytics Tool
            </span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
              NCIIPC
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono tracking-tight hidden md:block">
            From SOC Data to Supervisory Intelligence
          </div>
        </div>
      </div>

      {/* Center: Air-Gapped / Security Indicators */}
      <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-900/90 rounded border border-slate-800 text-[10px] font-mono text-slate-300">
        <span className="flex items-center gap-1 text-emerald-400">
          <Lock className="w-3 h-3" /> AIR-GAPPED
        </span>
        <span className="text-slate-600">•</span>
        <span className="flex items-center gap-1 text-cyan-400">
          <Cpu className="w-3 h-3" /> OFFLINE ML
        </span>
        <span className="text-slate-600">•</span>
        <span className="text-slate-400">
          NO EXTERNAL APIS
        </span>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2.5">
        {/* Global Search Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-mono transition"
          title="Search telemetry entities (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline text-[11px]">Search...</span>
          <kbd className="hidden sm:inline text-[9px] px-1 bg-slate-800 border border-slate-700 rounded text-slate-400">
            Ctrl+K
          </kbd>
        </button>

        {/* Generate Demo Data Button */}
        <button
          onClick={onGenerateDemo}
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono transition disabled:opacity-50"
          title="Generate 20 CSEs, 500+ assets, 10,000+ alerts, planted contradictions"
        >
          <Database className={`w-3.5 h-3.5 text-blue-400 ${isProcessing ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline font-semibold">Generate Demo Data</span>
        </button>

        {/* Run Assessment Button */}
        <button
          onClick={onRunAssessment}
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono font-bold text-xs shadow-[0_0_12px_rgba(6,182,212,0.4)] transition disabled:opacity-50"
          title="Execute validation, rules, negative space, KPI-evidence contradiction, anomaly & scoring engines"
        >
          <Play className={`w-3.5 h-3.5 fill-current ${isProcessing ? 'animate-spin' : ''}`} />
          <span>{isProcessing ? 'Analyzing...' : 'Run Assessment'}</span>
        </button>

        {/* User Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-7 h-7 rounded-full bg-slate-800 border border-cyan-500/40 flex items-center justify-center text-xs font-mono text-cyan-300 font-bold">
            {currentUser.username.substring(0, 2).toUpperCase()}
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-[11px] font-semibold text-slate-200 leading-tight">{currentUser.name}</div>
            <div className="text-[9px] font-mono text-cyan-400 leading-none">{currentUser.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
};
