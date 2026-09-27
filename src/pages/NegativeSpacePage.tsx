import React, { useEffect, useState } from 'react';
import { ScanEye, AlertTriangle, ArrowRight, ShieldAlert, CheckCircle2, Server, Filter } from 'lucide-react';
import { api } from '../api';
import { Badge } from '../components/Badge';

interface NegativeSpacePageProps {
  onNavigate: (route: string) => void;
}

export const NegativeSpacePage: React.FC<NegativeSpacePageProps> = ({ onNavigate }) => {
  const [gaps, setGaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');

  useEffect(() => {
    api.getNegativeSpaceGaps()
      .then(res => {
        setGaps(res);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load negative space gaps', err);
        setLoading(false);
      });
  }, []);

  const filtered = gaps.filter(g => typeFilter === 'ALL' || g.gapType === typeFilter);

  return (
    <div className="space-y-6">
      {/* Header & Core Innovation Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-cyan-800/60 rounded-lg p-6 space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700 uppercase tracking-widest flex items-center gap-1.5">
            <ScanEye className="w-3.5 h-3.5" />
            Core Innovation Engine
          </span>
          <span className="text-xs font-mono text-slate-400">
            Identifying evidence that SHOULD exist but DOES NOT
          </span>
        </div>

        <h1 className="text-xl md:text-2xl font-black font-mono text-slate-100">
          Negative Space Engine — Absence of Expected Telemetry
        </h1>

        <p className="text-xs font-mono text-slate-300 max-w-3xl leading-relaxed">
          Standard SIEM tools report what occurred. The Negative Space Engine evaluates what <strong>should have occurred</strong> given the entity's critical assets, threat landscape, and regulatory mandates — highlighting critical assets missing telemetry, missing escalations, absent threat categories, and anomalous quiescence.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-mono text-slate-400">
          Identified Gaps: <strong className="text-cyan-400">{filtered.length}</strong>
        </div>

        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-1.5 text-xs font-mono bg-slate-900 border border-slate-800 rounded text-slate-300 focus:outline-none focus:border-cyan-500"
        >
          <option value="ALL">All Gap Types</option>
          <option value="MONITORING_COVERAGE_GAP">Monitoring Coverage Gaps</option>
          <option value="ESCALATION_RECORD_GAP">Escalation Record Gaps</option>
          <option value="DETECTION_CATEGORY_GAP">Threat Category Blind Spots</option>
          <option value="OPERATIONAL_ACTIVITY_GAP">Operational Activity Gaps</option>
        </select>
      </div>

      {/* Negative Space Gaps Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-cyan-400">
            Running negative space mathematical proofs across fleet...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-slate-500 bg-slate-900/60 border border-slate-800 rounded">
            No negative space gaps identified matching the selected criteria.
          </div>
        ) : (
          filtered.map(gap => (
            <div
              key={gap.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-cyan-700/60 rounded-lg p-5 space-y-4 transition"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-cyan-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {gap.cseId}
                  </span>
                  <Badge
                    label={gap.gapType.replace(/_/g, ' ')}
                    variant={gap.gapType === 'MONITORING_COVERAGE_GAP' ? 'critical' : 'high'}
                  />
                  <h3 className="text-sm font-bold font-mono text-slate-100">
                    {gap.title}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-400">
                    Confidence: <strong className="text-slate-200">{Math.round(gap.confidence * 100)}%</strong>
                  </span>
                  <button
                    onClick={() => onNavigate(`/cse/${gap.cseId}`)}
                    className="px-2.5 py-1 text-xs font-mono bg-slate-800 hover:bg-slate-700 rounded text-slate-300 border border-slate-700 transition"
                  >
                    Inspect {gap.cseId} Dossier →
                  </button>
                </div>
              </div>

              {/* EXPECTED vs OBSERVED vs GAP (Section 11 Mandatory Specification) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                {/* Expected */}
                <div className="bg-slate-950/80 p-3.5 rounded border border-emerald-900/40">
                  <span className="text-[10px] text-emerald-400 uppercase font-bold block mb-1">
                    EXPECTED TELEMETRY
                  </span>
                  <div className="text-slate-400 text-[11px]">{gap.expectedMetric}:</div>
                  <div className="text-sm font-bold text-slate-100 mt-1">{gap.expectedValue}</div>
                </div>

                {/* Observed */}
                <div className="bg-slate-950/80 p-3.5 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    OBSERVED TELEMETRY
                  </span>
                  <div className="text-slate-400 text-[11px]">{gap.observedMetric}:</div>
                  <div className="text-sm font-bold text-slate-200 mt-1">{gap.observedValue}</div>
                </div>

                {/* Gap */}
                <div className="bg-slate-950/80 p-3.5 rounded border border-red-900/50">
                  <span className="text-[10px] text-red-400 uppercase font-bold block mb-1">
                    POTENTIAL TELEMETRY GAP
                  </span>
                  <div className="text-slate-300 text-xs mt-1 leading-snug">
                    {gap.gapDescription}
                  </div>
                </div>
              </div>

              {/* Recommended Review */}
              <div className="bg-slate-950/40 p-3 rounded border border-slate-800 text-xs font-mono text-slate-300 flex items-center justify-between">
                <div>
                  <span className="text-cyan-400 font-bold uppercase text-[10px] block">Recommended Action:</span>
                  <span>{gap.recommendedReview}</span>
                </div>
                <span className="text-[10px] text-slate-500 italic hidden md:block">
                  Conservative supervisory framing (not an automated failure declaration)
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
