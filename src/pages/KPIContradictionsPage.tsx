import React, { useEffect, useState } from 'react';
import { Scale, AlertTriangle, ArrowRight, ShieldAlert, CheckCircle2, FileText, Search } from 'lucide-react';
import { api } from '../api';
import { Badge } from '../components/Badge';

interface KPIContradictionsPageProps {
  onNavigate: (route: string) => void;
}

export const KPIContradictionsPage: React.FC<KPIContradictionsPageProps> = ({ onNavigate }) => {
  const [contradictions, setContradictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getContradictions()
      .then(res => {
        setContradictions(res);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load contradictions', err);
        setLoading(false);
      });
  }, []);

  const filtered = contradictions.filter(c =>
    c.cseId.toLowerCase().includes(search.toLowerCase()) ||
    c.kpiName.toLowerCase().includes(search.toLowerCase()) ||
    c.evidenceMetricName.toLowerCase().includes(search.toLowerCase()) ||
    (c.cseName && c.cseName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-cyan-800/60 rounded-lg p-6 space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700 uppercase tracking-widest flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5" />
            Core Innovation Engine #2
          </span>
          <span className="text-xs font-mono text-slate-400">
            Independent Cross-Check: Self-Reported Metrics vs Operational Telemetry Evidence
          </span>
        </div>

        <h1 className="text-xl md:text-2xl font-black font-mono text-slate-100">
          KPI-Evidence Contradiction Engine
        </h1>

        <p className="text-xs font-mono text-slate-300 max-w-3xl leading-relaxed">
          Where Negative Space identifies missing telemetry, the Contradiction Engine cross-checks two genuinely independent data sources: <strong>Signal A (the CSE's self-reported summary KPIs)</strong> vs <strong>Signal B (independently computed evidence from raw dockets and local TF-IDF text similarity)</strong>.
        </p>
      </div>

      {/* Search / Counter */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-mono text-slate-400">
          Identified Contradictions: <strong className="text-cyan-400">{filtered.length}</strong>
        </div>

        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search CSE or metric..."
            className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-slate-900 border border-slate-800 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Contradictions List (Side-by-Side Presentation - Section 12) */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-cyan-400">
            Evaluating reported KPIs against independently parsed case records...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-slate-500 bg-slate-900/60 border border-slate-800 rounded">
            No KPI-Evidence contradictions detected for the current reporting cycle.
          </div>
        ) : (
          filtered.map(item => {
            const isBoilerplate = item.evidenceMetricName.toLowerCase().includes('similarity') || item.evidenceMetricName.toLowerCase().includes('tfidf');
            const kpiValFormatted = isBoilerplate ? '100% Unique Claims' : `${Math.round(item.kpiValue * 100)}%`;
            const evValFormatted = isBoilerplate ? `${Math.round(item.evidenceValue * 100)}% Similarity` : `${Math.round(item.evidenceValue * 100)}%`;

            return (
              <div
                key={item.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-cyan-600/70 rounded-lg p-5 space-y-4 transition"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-cyan-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {item.cseId}
                    </span>
                    <span className="text-xs font-semibold text-slate-200">
                      {item.cseName}
                    </span>
                    <Badge
                      label={isBoilerplate ? 'Boilerplate Review Pattern' : 'KPI Contradiction'}
                      variant={isBoilerplate ? 'high' : 'critical'}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge label={item.status} variant={item.status === 'CONFIRMED' ? 'critical' : item.status === 'DISMISSED' ? 'neutral' : 'high'} />
                    <button
                      onClick={() => onNavigate(`/kpi-evidence/${item.id}`)}
                      className="px-2.5 py-1 text-xs font-mono bg-slate-800 hover:bg-slate-700 rounded text-slate-300 border border-slate-700 transition flex items-center gap-1"
                    >
                      <span>Drill Down</span> <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* SIDE-BY-SIDE PRESENTATION (MANDATED SECTION 12) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  {/* Column 1: Signal A (Reported KPI) */}
                  <div className="bg-slate-950/80 p-4 rounded border border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold mb-2">
                      <span>SIGNAL A — REPORTED METRIC</span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">Self-Declared</span>
                    </div>
                    <div className="text-slate-300 font-medium">{item.kpiName}</div>
                    <div className="text-2xl font-black font-mono text-slate-100 mt-2">
                      {kpiValFormatted}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Submitted in CSE Quarterly Compliance Self-Assessment
                    </div>
                  </div>

                  {/* Column 2: Signal B (Operational Evidence) */}
                  <div className="bg-slate-950/80 p-4 rounded border border-red-900/50">
                    <div className="flex items-center justify-between text-red-400 text-[10px] uppercase font-bold mb-2">
                      <span>SIGNAL B — OPERATIONAL EVIDENCE</span>
                      <span className="px-1.5 py-0.2 rounded bg-red-950 text-red-400 border border-red-800">Telemetry Proof</span>
                    </div>
                    <div className="text-slate-300 font-medium">{item.evidenceMetricName}</div>
                    <div className="text-2xl font-black font-mono text-red-400 mt-2">
                      {evValFormatted}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Independently computed from raw case records & local TF-IDF
                    </div>
                  </div>
                </div>

                {/* Exact Statement Framing (Section 12 Mandatory Phrasing) */}
                <div className="bg-slate-950/50 p-3 rounded border border-slate-800 text-xs font-mono text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-cyan-400 font-bold block text-[10px] uppercase">Supervisory Finding Statement:</span>
                    <span className="italic text-slate-200">"{item.statement}"</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-slate-500 block text-[10px] uppercase">Recommended Action</span>
                    <span className="text-amber-400 text-xs">{item.recommendedReview}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
