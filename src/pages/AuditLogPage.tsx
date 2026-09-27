import React, { useEffect, useState } from 'react';
import { History, Search, Filter, ShieldCheck, ArrowRight, Clock } from 'lucide-react';
import { api } from '../api';
import { Badge } from '../components/Badge';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  useEffect(() => {
    api.getAuditLogs()
      .then(res => {
        setLogs(res);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load audit logs', err);
        setLoading(false);
      });
  }, []);

  const filtered = logs.filter(l => {
    const matchesSearch =
      l.user.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.objectType.toLowerCase().includes(search.toLowerCase()) ||
      (l.newValue && l.newValue.toLowerCase().includes(search.toLowerCase()));

    const matchesAction = actionFilter === 'ALL' || l.action.includes(actionFilter);

    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-6 space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-950 text-slate-300 border border-slate-800 uppercase tracking-widest flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-cyan-400" />
            Immutable Audit Trail
          </span>
          <span className="text-xs font-mono text-slate-400">Section 21 Compliance</span>
        </div>
        <h1 className="text-xl md:text-2xl font-black font-mono text-slate-100">
          Supervisory Audit Log & Action Trail
        </h1>
        <p className="text-xs font-mono text-slate-300 max-w-3xl leading-relaxed">
          Records every supervisor adjudication, confirmation, dismissal, parameter calibration, dataset ingestion, and report export. Provides an unbroken audit trail for judicial and regulatory inquiries.
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="text-xs font-mono text-slate-400">
          Audit Records Logged: <strong className="text-cyan-400">{filtered.length}</strong>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter by user or action..."
              className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-slate-900 border border-slate-800 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-mono bg-slate-900 border border-slate-800 rounded text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Actions</option>
            <option value="FINDING">Finding Reviews</option>
            <option value="CONTRADICTION">Contradiction Reviews</option>
            <option value="ANALYSIS">Analysis Executions</option>
            <option value="DEMO">Demo Data Ingests</option>
            <option value="SETTINGS">Settings Changes</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-cyan-400">
            Reading immutable audit journal...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-slate-500">
            No audit records match the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Supervisor / User</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Object Type / ID</th>
                  <th className="py-3 px-4">Previous State</th>
                  <th className="py-3 px-4">New State / Audit Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map(log => (
                  <tr key={log.id} className="hover:bg-slate-850/50 transition">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>

                    <td className="py-3 px-4 font-bold text-cyan-300">
                      {log.user}
                    </td>

                    <td className="py-3 px-4">
                      <Badge
                        label={log.action}
                        variant={
                          log.action.includes('CONFIRM') ? 'critical' :
                          log.action.includes('DISMISS') ? 'neutral' :
                          log.action.includes('ANALYSIS') ? 'info' : 'moderate'
                        }
                      />
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      <span className="font-semibold">{log.objectType}</span>
                      <span className="text-[10px] text-slate-500 block">{log.objectId}</span>
                    </td>

                    <td className="py-3 px-4 text-slate-500">
                      {log.oldValue || '—'}
                    </td>

                    <td className="py-3 px-4 text-slate-200 max-w-md">
                      <div className="truncate text-[11px]" title={log.newValue || ''}>
                        {log.newValue || 'Updated'}
                      </div>
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
