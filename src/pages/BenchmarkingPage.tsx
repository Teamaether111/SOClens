import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, ShieldAlert, ArrowRight, Activity, Users } from 'lucide-react';
import { api } from '../api';
import { Badge } from '../components/Badge';

interface BenchmarkingPageProps {
  onNavigate: (route: string) => void;
}

export const BenchmarkingPage: React.FC<BenchmarkingPageProps> = ({ onNavigate }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBenchmarking()
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load benchmarking', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-xs font-mono text-cyan-400">
        Computing sectoral peer cohort statistics across critical infrastructure...
      </div>
    );
  }

  const peerGroups = data?.peerGroups || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-6 space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase tracking-widest flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" />
            Supervisory Engine
          </span>
          <span className="text-xs font-mono text-slate-400">Sectoral Cohort Baseline Normalization</span>
        </div>
        <h1 className="text-xl md:text-2xl font-black font-mono text-slate-100">
          Peer Benchmarking & Sectoral Distributions
        </h1>
        <p className="text-xs font-mono text-slate-300 max-w-3xl leading-relaxed">
          Operational metrics vary fundamentally across sectors (e.g. SCADA pipelines vs High-Frequency Trading). SAT-SA groups entities by sector and criticality tier to isolate genuine anomalous deviations from sectoral norms.
        </p>
      </div>

      {/* Peer Groups Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {peerGroups.map((pg: any) => (
          <div
            key={pg.id}
            className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-4 hover:border-slate-700 transition"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-bold font-mono text-cyan-300">
                  {pg.sector.replace('_', ' ')}
                </span>
                <span className="text-xs font-mono text-slate-400 ml-2">({pg.criticality})</span>
              </div>
              <Badge label={`${pg.cseCount} Entities`} variant="info" />
            </div>

            {/* Key Medians */}
            <div className="grid grid-cols-3 gap-2.5 text-center text-xs font-mono">
              <div className="bg-slate-950/70 p-2.5 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">Median Escalation</span>
                <span className="text-base font-bold text-slate-100 mt-1 block">
                  {pg.stats?.medianEscalationRate}%
                </span>
              </div>

              <div className="bg-slate-950/70 p-2.5 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">Median Inv. Time</span>
                <span className="text-base font-bold text-slate-100 mt-1 block">
                  {pg.stats?.medianInvestigationTimeMinutes}m
                </span>
              </div>

              <div className="bg-slate-950/70 p-2.5 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">Median Closure</span>
                <span className="text-base font-bold text-slate-100 mt-1 block">
                  {pg.stats?.medianClosureTimeMinutes}m
                </span>
              </div>

              <div className="bg-slate-950/70 p-2.5 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">Monitoring Cov.</span>
                <span className="text-base font-bold text-slate-100 mt-1 block">
                  {pg.stats?.medianMonitoringCoverage}%
                </span>
              </div>

              <div className="bg-slate-950/70 p-2.5 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">Repeat Alerts</span>
                <span className="text-base font-bold text-slate-100 mt-1 block">
                  {pg.stats?.medianRepeatAlertRate}%
                </span>
              </div>

              <div className="bg-slate-950/70 p-2.5 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">Reopen Rate</span>
                <span className="text-base font-bold text-slate-100 mt-1 block">
                  {pg.stats?.medianCaseReopenRate}%
                </span>
              </div>
            </div>

            <div className="text-[10px] font-mono text-slate-400 border-t border-slate-800/80 pt-2 flex items-center justify-between">
              <span>Deviation flag threshold: &gt; 30 percentage points</span>
              <span className="text-cyan-400">Contextual inquiry only</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
