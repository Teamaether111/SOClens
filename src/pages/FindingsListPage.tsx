import React, { useState, useEffect } from 'react';
import { Flag, Search, Filter, ArrowRight, ShieldAlert, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { api } from '../api';
import { Badge } from '../components/Badge';

interface FindingsListPageProps {
  onNavigate: (route: string) => void;
  initialCseFilter?: string;
}

export const FindingsListPage: React.FC<FindingsListPageProps> = ({ onNavigate, initialCseFilter }) => {
  const [findings, setFindings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    api.getFindings(initialCseFilter ? { cseId: initialCseFilter } : undefined)
      .then(res => {
        setFindings(res);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load findings', err);
        setLoading(false);
      });
  }, [initialCseFilter]);

  const filtered = findings.filter(f => {
    const matchesSearch =
      f.id.toLowerCase().includes(search.toLowerCase()) ||
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      f.cseId.toLowerCase().includes(search.toLowerCase()) ||
      f.reason.toLowerCase().includes(search.toLowerCase());

    const matchesCat = categoryFilter === 'ALL' || f.category === categoryFilter;
    const matchesSev = severityFilter === 'ALL' || f.severity === severityFilter;
    const matchesStat = statusFilter === 'ALL' || f.status === statusFilter;

    return matchesSearch && matchesCat && matchesSev && matchesStat;
  });

  return (
    <div className="space-y-6">
      {/* Header & Overview */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-mono font-black text-slate-100 uppercase tracking-wider">
              Supervisory Signals & Findings
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800">
              {findings.length} Signals Generated
            </span>
          </div>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Execution Gaps, Negative-Space indicators, Investigation Weaknesses, and Operational Anomalies requiring supervisory verification.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-52">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter findings..."
              className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-slate-900 border border-slate-800 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-mono bg-slate-900 border border-slate-800 rounded text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Categories</option>
            <option value="EXECUTION_GAP">Execution Gap</option>
            <option value="NEGATIVE_SPACE">Negative Space</option>
            <option value="INVESTIGATION_WEAKNESS">Investigation Weakness</option>
            <option value="ESCALATION_WEAKNESS">Escalation Weakness</option>
            <option value="KPI_EVIDENCE_CONTRADICTION">KPI Contradiction</option>
            <option value="OPERATIONAL_ANOMALY">Operational Anomaly</option>
            <option value="PEER_DEVIATION">Peer Deviation</option>
          </select>

          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-mono bg-slate-900 border border-slate-800 rounded text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-mono bg-slate-900 border border-slate-800 rounded text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New (Unreviewed)</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="DISMISSED">Dismissed</option>
          </select>
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-cyan-400 bg-slate-900/60 border border-slate-800 rounded">
            Scanning operational telemetry findings...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-slate-500 bg-slate-900/60 border border-slate-800 rounded">
            No supervisory signals match the active search and filter criteria.
          </div>
        ) : (
          filtered.map(f => (
            <div
              key={f.id}
              onClick={() => onNavigate(`/findings/${f.id}`)}
              className="p-4 rounded-lg bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-cyan-700/60 transition cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-cyan-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {f.cseId}
                  </span>
                  <Badge
                    label={f.severity}
                    variant={f.severity === 'CRITICAL' ? 'critical' : f.severity === 'HIGH' ? 'high' : 'moderate'}
                  />
                  <Badge label={f.category.replace(/_/g, ' ')} variant="neutral" />
                  <span className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition">
                    {f.title}
                  </span>
                </div>

                <p className="text-xs font-mono text-slate-400 line-clamp-2">
                  {f.reason}
                </p>

                <div className="text-[11px] font-mono text-slate-500 flex items-center gap-4">
                  <span>Confidence: <strong className="text-slate-300">{Math.round(f.confidence * 100)}%</strong></span>
                  <span>•</span>
                  <span>ID: <strong className="text-slate-400">{f.id}</strong></span>
                  {f.caseId && (
                    <>
                      <span>•</span>
                      <span>Case: <strong className="text-amber-400">{f.caseId}</strong></span>
                    </>
                  )}
                </div>
              </div>

              {/* Status & Review Action */}
              <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                <Badge
                  label={f.status}
                  variant={
                    f.status === 'CONFIRMED' ? 'critical' :
                    f.status === 'DISMISSED' ? 'neutral' :
                    f.status === 'UNDER_REVIEW' ? 'high' : 'info'
                  }
                  size="md"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate(`/findings/${f.id}`);
                  }}
                  className="px-3 py-1.5 rounded text-xs font-mono bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 border border-slate-700 hover:border-cyan-700 transition flex items-center gap-1.5"
                >
                  Review Dossier <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
