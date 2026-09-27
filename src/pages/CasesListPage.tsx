import React, { useState, useEffect } from 'react';
import { FileCheck2, Search, Filter, ArrowRight, ShieldAlert, AlertTriangle } from 'lucide-react';
import { api } from '../api';
import { Badge } from '../components/Badge';

interface CasesListPageProps {
  onNavigate: (route: string) => void;
  initialCseFilter?: string;
}

export const CasesListPage: React.FC<CasesListPageProps> = ({ onNavigate, initialCseFilter }) => {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  useEffect(() => {
    api.getCases(initialCseFilter ? { cseId: initialCseFilter } : undefined)
      .then(res => {
        setCases(res);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load cases', err);
        setLoading(false);
      });
  }, [initialCseFilter]);

  const filtered = cases.filter(c => {
    const matchesSearch =
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.cseId.toLowerCase().includes(search.toLowerCase());

    const matchesSev = severityFilter === 'ALL' || c.severity === severityFilter;

    let matchesPri = true;
    if (priorityFilter === 'HIGH') matchesPri = (c.priorityScore || 0) >= 70;
    else if (priorityFilter === 'MEDIUM') matchesPri = (c.priorityScore || 0) >= 40 && (c.priorityScore || 0) < 70;
    else if (priorityFilter === 'LOW') matchesPri = (c.priorityScore || 0) < 40;

    return matchesSearch && matchesSev && matchesPri;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-mono font-black text-slate-100 uppercase tracking-wider">
              Priority Case Review Queue
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
              {cases.length} Dockets Ingested
            </span>
          </div>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Prioritized by incident severity, asset criticality tier, execution gap signals, and supervisory attention impact.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:w-52">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter dockets..."
              className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-slate-900 border border-slate-800 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-mono bg-slate-900 border border-slate-800 rounded text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-mono bg-slate-900 border border-slate-800 rounded text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">High Priority (Score &gt;= 70)</option>
            <option value="MEDIUM">Medium Priority (40-69)</option>
            <option value="LOW">Low Priority (&lt; 40)</option>
          </select>
        </div>
      </div>

      {/* Case Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-cyan-400">
            Calculating priority queue scores across case dockets...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-slate-500">
            No incident case records match the specified filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Rank / ID</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Incident Docket Title</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Supervisory Signal Reason</th>
                  <th className="py-3 px-4 text-center">Priority Score</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((c, idx) => (
                  <tr
                    key={c.id}
                    onClick={() => onNavigate(`/cases/${c.id}`)}
                    className="hover:bg-slate-800/50 cursor-pointer transition group"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                          idx < 5 ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {c.rank || idx + 1}
                        </span>
                        <span className="font-bold text-amber-400">{c.id}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-cyan-300 font-bold">{c.cseId}</span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-200 group-hover:text-cyan-300 transition">
                        {c.title}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <Badge
                        label={c.severity}
                        variant={c.severity === 'CRITICAL' ? 'critical' : c.severity === 'HIGH' ? 'high' : 'moderate'}
                      />
                    </td>

                    <td className="py-3 px-4 text-slate-400 max-w-xs">
                      <div className="truncate text-[11px]" title={c.topFindingTitle || c.urgencyReason}>
                        {c.topFindingTitle || c.urgencyReason || 'Routine review'}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`text-sm font-black ${
                        (c.priorityScore || 0) >= 80 ? 'text-red-400' :
                        (c.priorityScore || 0) >= 65 ? 'text-amber-400' :
                        (c.priorityScore || 0) >= 40 ? 'text-yellow-400' : 'text-slate-400'
                      }`}>
                        {c.priorityScore || 50}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <Badge
                        label={c.status}
                        variant={c.status === 'CLOSED' ? 'neutral' : 'info'}
                      />
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate(`/cases/${c.id}`);
                        }}
                        className="px-2.5 py-1 text-[11px] font-mono rounded bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 border border-slate-700 hover:border-cyan-700 transition"
                      >
                        Review →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
