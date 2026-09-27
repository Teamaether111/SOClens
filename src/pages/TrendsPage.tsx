import React, { useEffect, useState } from 'react';
import { TrendingDown, TrendingUp, AlertTriangle, ArrowRight, Activity, Calendar } from 'lucide-react';
import { api } from '../api';
import { Badge } from '../components/Badge';

interface TrendsPageProps {
  onNavigate: (route: string) => void;
}

export const TrendsPage: React.FC<TrendsPageProps> = ({ onNavigate }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTrends()
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load trends', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-xs font-mono text-cyan-400">
        Aggregating multi-quarter historical telemetry trends...
      </div>
    );
  }

  const { cycles = [], flaggedDeteriorations = [], sectorAggregates = [] } = data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-6 space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800 uppercase tracking-widest flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5" />
            Historical Trajectory
          </span>
          <span className="text-xs font-mono text-slate-400">5-Cycle Longitudinal Analysis</span>
        </div>
        <h1 className="text-xl md:text-2xl font-black font-mono text-slate-100">
          Historical Deterioration & Trend Analysis
        </h1>
        <p className="text-xs font-mono text-slate-300 max-w-3xl leading-relaxed">
          Identifies gradual multi-cycle deterioration in operational rigor before major catastrophic outages occur. Flags entities exhibiting negative telemetry gradients across successive reporting windows.
        </p>
      </div>

      {/* Flagged Deterioration Section (Planted Pattern H) */}
      <div className="space-y-4">
        <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" /> Detected Active Operational Deteriorations
        </h2>

        {flaggedDeteriorations.map((det: any, idx: number) => (
          <div
            key={idx}
            className="bg-slate-900/95 border border-red-900/60 rounded-lg p-5 space-y-4"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-red-400 bg-slate-950 px-2 py-0.5 rounded border border-red-900">
                    {det.cseId}
                  </span>
                  <span className="text-sm font-bold text-slate-100">{det.name}</span>
                </div>
                <div className="text-xs font-mono text-amber-400 mt-1">
                  Metric: <strong>{det.metric}</strong> — {det.message}
                </div>
              </div>

              <button
                onClick={() => onNavigate(`/cse/${det.cseId}`)}
                className="px-3 py-1.5 rounded text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                Inspect {det.cseId} Assessment →
              </button>
            </div>

            {/* Progression Steps */}
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase mb-2">
                Longitudinal Telemetry Gradient:
              </div>
              <div className="grid grid-cols-5 gap-2 text-center text-xs font-mono">
                {det.trendPoints.map((pt: any, pIdx: number) => (
                  <div
                    key={pIdx}
                    className={`p-3 rounded border ${
                      pIdx === det.trendPoints.length - 1
                        ? 'bg-red-950/70 border-red-800 text-red-300 font-bold'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    <span className="text-[10px] text-slate-500 block">{pt.cycle}</span>
                    <span className="text-lg font-black block mt-1">{pt.value}%</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {pIdx === 0 ? 'Baseline' : `${pt.value - det.trendPoints[pIdx - 1].value}%`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded bg-red-950/30 border border-red-900/40 text-xs font-mono text-red-300">
              <strong>Supervisory Warning:</strong> Entity monitoring coverage has degraded from 94% down to 72% over 5 consecutive quarters, indicating accumulating blind spots on newly commissioned OT assets.
            </div>
          </div>
        ))}
      </div>

      {/* Sector Trajectories */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-4">
        <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" /> Sectoral Attention Score Trajectories
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-mono">
          {sectorAggregates.map((sec: any) => (
            <div key={sec.sector} className="p-3.5 rounded bg-slate-950/70 border border-slate-800">
              <span className="text-slate-300 font-bold block">{sec.sector.replace('_', ' ')}</span>
              <div className="text-[10px] text-slate-500 mt-1 mb-2">Quarterly Average Attention Score</div>
              <div className="flex items-center gap-1.5">
                {sec.avgScoreTrend.map((val: number, i: number) => (
                  <span
                    key={i}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      val >= 60 ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {val}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
