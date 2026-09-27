import React, { useState } from 'react';
import { 
  ShieldAlert, AlertTriangle, Scale, FileCheck2, Server, ArrowRight,
  TrendingUp, Activity, CheckCircle2, ChevronRight, Eye, RefreshCw, BarChart2
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { Network3D } from '../components/Network3D';

interface DashboardPageProps {
  stats: any;
  onNavigate: (route: string) => void;
  onRefresh: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ stats, onNavigate, onRefresh }) => {
  const [show3D, setShow3D] = useState(true);

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-xs font-mono text-cyan-400">
        Loading supervisory telemetry intelligence...
      </div>
    );
  }

  const {
    totalCses = 20,
    csesRequiringAttention = 0,
    highPriorityFindings = 0,
    kpiEvidenceContradictions = 0,
    casesRecommendedForReview = 0,
    cseRanking = []
  } = stats;

  const topCse = cseRanking[0];

  return (
    <div className="space-y-6">
      {/* 1. MANDATED DOCTRINE / KILLER STATEMENTS BANNER (Section 40) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-cyan-800/50 rounded-lg p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-full bg-cyan-500/5 blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              Supervisory Operational Doctrine
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-100 font-mono">
              "SIEMs monitor threats. SAT-SA monitors the effectiveness of the SOC itself."
            </h1>
            <p className="text-xs md:text-sm text-cyan-300/90 font-mono">
              "A green dashboard is not the same as a working SOC. SAT-SA checks whether the two actually agree."
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">SUPERVISORY CLEARANCE</span>
              <span className="text-xs font-mono font-bold text-emerald-400">NCIIPC TIER-1 ASSESSOR</span>
            </div>
            <button
              onClick={() => setShow3D(!show3D)}
              className="px-3 py-1.5 text-xs font-mono font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              {show3D ? 'Hide 3D Network' : 'Show 3D Network'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. TOP METRIC CARDS (Section 16) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: TOTAL CSEs */}
        <div className="bg-slate-900/80 border border-slate-800 rounded p-4 relative group hover:border-slate-700 transition">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Total CSEs</span>
            <Server className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-100 mt-2">{totalCses}</div>
          <div className="text-[10px] font-mono text-slate-500 mt-1">Critical Sector Entities</div>
        </div>

        {/* Card 2: CSEs REQUIRING ATTENTION */}
        <div
          onClick={() => onNavigate('/cse')}
          className="bg-slate-900/80 border border-red-900/60 rounded p-4 relative group hover:border-red-600 transition cursor-pointer"
        >
          <div className="text-[11px] font-mono text-red-400 uppercase tracking-wider flex items-center justify-between">
            <span>Attention Required</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black font-mono text-red-400 mt-2">{csesRequiringAttention}</div>
          <div className="text-[10px] font-mono text-red-300/80 mt-1">Score &gt; 60 (Critical / High)</div>
        </div>

        {/* Card 3: HIGH PRIORITY FINDINGS */}
        <div
          onClick={() => onNavigate('/findings')}
          className="bg-slate-900/80 border border-amber-900/60 rounded p-4 relative group hover:border-amber-600 transition cursor-pointer"
        >
          <div className="text-[11px] font-mono text-amber-400 uppercase tracking-wider flex items-center justify-between">
            <span>High Findings</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-400 mt-2">{highPriorityFindings}</div>
          <div className="text-[10px] font-mono text-amber-300/80 mt-1">Execution & Negative Space</div>
        </div>

        {/* Card 4: KPI-EVIDENCE CONTRADICTIONS */}
        <div
          onClick={() => onNavigate('/kpi-evidence')}
          className="bg-slate-900/80 border border-cyan-900/60 rounded p-4 relative group hover:border-cyan-500 transition cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.1)]"
        >
          <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider flex items-center justify-between">
            <span>KPI Contradictions</span>
            <Scale className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black font-mono text-cyan-300 mt-2">{kpiEvidenceContradictions}</div>
          <div className="text-[10px] font-mono text-cyan-400/80 mt-1">Reported vs Evidence Gaps</div>
        </div>

        {/* Card 5: CASES FOR REVIEW */}
        <div
          onClick={() => onNavigate('/cases')}
          className="bg-slate-900/80 border border-slate-800 rounded p-4 relative group hover:border-slate-700 transition cursor-pointer"
        >
          <div className="text-[11px] font-mono text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Priority Queue</span>
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-100 mt-2">{casesRecommendedForReview}</div>
          <div className="text-[10px] font-mono text-emerald-400 mt-1">Recommended for Review</div>
        </div>
      </div>

      {/* 3. OPTIONAL 3D VISUALIZATION SECTION */}
      {show3D && (
        <div className="h-[400px]">
          <Network3D
            cses={cseRanking.map((c: any) => ({
              id: c.id,
              code: c.code,
              name: c.name,
              attentionScore: c.attentionScore,
              priority: c.priority,
              findingsCount: c.findingsCount,
              sector: c.sector
            }))}
            onSelectCSE={(id) => onNavigate(`/cse/${id}`)}
          />
        </div>
      )}

      {/* 4. THE FOUR KEY SUPERVISORY QUESTIONS (Section 1) */}
      {topCse && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            Core Supervisory Focus — Answering the 4 Supervisory Questions
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
            {/* Q1: WHICH CSE? */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded p-3.5">
              <span className="text-slate-500 uppercase block text-[10px]">1. WHICH CSE NEEDS ATTENTION?</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-bold text-slate-100">{topCse.name}</span>
                <span className="text-cyan-300 font-bold">({topCse.code})</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-slate-400">Attention Score:</span>
                <span className="text-red-400 font-bold text-sm">{topCse.attentionScore} / 100</span>
              </div>
            </div>

            {/* Q2: WHY? */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded p-3.5">
              <span className="text-slate-500 uppercase block text-[10px]">2. WHY DOES IT NEED ATTENTION?</span>
              <div className="text-amber-400 font-semibold mt-1 line-clamp-2">
                {topCse.topSignal}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Sector: {topCse.sector} • Tier: {topCse.criticality}
              </div>
            </div>

            {/* Q3: WHAT EVIDENCE? */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded p-3.5">
              <span className="text-slate-500 uppercase block text-[10px]">3. WHAT EVIDENCE SUPPORTS IT?</span>
              <div className="text-slate-200 mt-1 space-y-0.5 text-[11px]">
                <div>Escalation Rate: <span className="text-amber-300 font-bold">{topCse.escalationRate}</span></div>
                <div>Monitoring Coverage: <span className="text-red-300 font-bold">{topCse.monitoringCoverage}</span></div>
                <div>Critical Alerts: <span className="text-slate-100 font-bold">{topCse.criticalAlerts}</span></div>
              </div>
            </div>

            {/* Q4: WHICH CASE TO REVIEW FIRST? */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded p-3.5 flex flex-col justify-between">
              <div>
                <span className="text-slate-500 uppercase block text-[10px]">4. WHICH CASE TO REVIEW FIRST?</span>
                <div className="text-emerald-400 font-semibold mt-1">
                  CAS-1001 (Priority Score: 94)
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Critical Alert without Escalation</div>
              </div>
              <button
                onClick={() => onNavigate(`/cse/${topCse.id}`)}
                className="mt-3 w-full py-1 text-center bg-cyan-950 hover:bg-cyan-900 border border-cyan-700/60 rounded text-cyan-300 text-xs font-mono font-bold transition flex items-center justify-center gap-1.5"
              >
                Inspect {topCse.code} Assessment <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MAIN CSE SUPERVISORY RANKING TABLE (Section 16) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-cyan-400" />
              Supervisory Attention Ranking (All 20 CSEs)
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Ranked dynamically by Supervisory Attention Score (Execution Gaps, Negative Space, KPI Contradictions, Anomalies, Deviations)
            </p>
          </div>
          <button
            onClick={() => onNavigate('/cse')}
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            View Full Matrix <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Rank / Code</th>
                <th className="py-3 px-4">Critical Sector Entity</th>
                <th className="py-3 px-4">Sector</th>
                <th className="py-3 px-4 text-center">Attention Score</th>
                <th className="py-3 px-4">Priority Tier</th>
                <th className="py-3 px-4">Top Supervisory Signal</th>
                <th className="py-3 px-4 text-center">Escalation Rate</th>
                <th className="py-3 px-4 text-center">Monitoring</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {cseRanking.map((cse: any, idx: number) => {
                const isTopThree = idx < 3;
                const tier = cse.priority;

                return (
                  <tr
                    key={cse.id}
                    onClick={() => onNavigate(`/cse/${cse.id}`)}
                    className="hover:bg-slate-800/50 cursor-pointer transition group"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                          isTopThree ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="font-bold text-cyan-300">{cse.code}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200 group-hover:text-cyan-300 transition">
                        {cse.name}
                      </div>
                      <div className="text-[10px] text-slate-500">Tier: {cse.criticality}</div>
                    </td>

                    <td className="py-3 px-4 text-slate-400">
                      {cse.sector.replace('_', ' ')}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`text-sm font-black ${
                        cse.attentionScore >= 80 ? 'text-red-400' :
                        cse.attentionScore >= 60 ? 'text-amber-400' :
                        cse.attentionScore >= 35 ? 'text-yellow-400' : 'text-emerald-400'
                      }`}>
                        {cse.attentionScore}
                      </span>
                      <span className="text-[10px] text-slate-500 block">/100</span>
                    </td>

                    <td className="py-3 px-4">
                      <Badge
                        label={tier}
                        variant={
                          tier === 'CRITICAL' ? 'critical' :
                          tier === 'HIGH' ? 'high' :
                          tier === 'MODERATE' ? 'moderate' : 'low'
                        }
                      />
                    </td>

                    <td className="py-3 px-4 text-slate-300 max-w-xs">
                      <div className="truncate text-[11px]" title={cse.topSignal}>
                        {cse.topSignal}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center font-bold">
                      <span className={parseInt(cse.escalationRate, 10) < 50 ? 'text-amber-400' : 'text-slate-300'}>
                        {cse.escalationRate}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center font-bold">
                      <span className={parseInt(cse.monitoringCoverage, 10) < 85 ? 'text-red-400' : 'text-emerald-400'}>
                        {cse.monitoringCoverage}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate(`/cse/${cse.id}`);
                        }}
                        className="px-2.5 py-1 text-[11px] font-mono rounded bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 border border-slate-700 hover:border-cyan-700 transition"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
