import React, { useState, useEffect } from 'react';
import { Search, X, Shield, FileText, AlertCircle, Server, Flag, ArrowRight } from 'lucide-react';
import { api } from '../api';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    cses: any[];
    cases: any[];
    alerts: any[];
    assets: any[];
    findings: any[];
  }>({
    cses: [],
    cases: [],
    alerts: [],
    assets: [],
    findings: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open search
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ cses: [], cases: [], alerts: [], assets: [], findings: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.search(query.trim());
        setResults(res);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults =
    results.cses.length +
    results.cases.length +
    results.alerts.length +
    results.assets.length +
    results.findings.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[75vh]">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 bg-slate-950/80">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search CSE Code (CSE-07), Case (CAS-1002), Finding, Asset, Alert..."
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none font-mono"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="px-2 py-0.5 text-[10px] font-mono bg-slate-800 border border-slate-700 rounded text-slate-400 shrink-0">
            ESC
          </kbd>
        </div>

        {/* Results Area */}
        <div className="overflow-y-auto p-4 space-y-4 flex-1">
          {loading && (
            <div className="text-center py-8 text-xs font-mono text-cyan-400 animate-pulse">
              Querying supervisory telemetry index...
            </div>
          )}

          {!loading && query && totalResults === 0 && (
            <div className="text-center py-8 text-xs font-mono text-slate-500">
              No matching critical infrastructure telemetry records found for "{query}".
            </div>
          )}

          {/* CSE Results */}
          {results.cses.length > 0 && (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                Critical Sector Entities ({results.cses.length})
              </div>
              <div className="space-y-1">
                {results.cses.map(cse => (
                  <button
                    key={cse.id}
                    onClick={() => {
                      onNavigate(`/cse/${cse.id}`);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded bg-slate-950/50 hover:bg-cyan-950/30 border border-slate-800/80 hover:border-cyan-800/60 text-left transition group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-cyan-300">{cse.code}</span>
                        <span className="text-xs font-medium text-slate-200">{cse.name}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        Sector: {cse.sector} | Criticality: {cse.criticality}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cases */}
          {results.cases.length > 0 && (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                Cases / Dockets ({results.cases.length})
              </div>
              <div className="space-y-1">
                {results.cases.map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onNavigate(`/cases/${c.id}`);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded bg-slate-950/50 hover:bg-amber-950/30 border border-slate-800/80 hover:border-amber-800/60 text-left transition group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-400">{c.id}</span>
                        <span className="text-xs font-medium text-slate-200">{c.title}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        CSE: {c.cseId} | Severity: {c.severity} | Priority Score: {c.priorityScore || 'N/A'}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Findings */}
          {results.findings.length > 0 && (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5 text-red-400" />
                Supervisory Findings ({results.findings.length})
              </div>
              <div className="space-y-1">
                {results.findings.map(f => (
                  <button
                    key={f.id}
                    onClick={() => {
                      onNavigate(`/findings/${f.id}`);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded bg-slate-950/50 hover:bg-red-950/30 border border-slate-800/80 hover:border-red-800/60 text-left transition group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-red-400">{f.id}</span>
                        <span className="text-xs font-medium text-slate-200">{f.title}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        Category: {f.category} | Severity: {f.severity} | Status: {f.status}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-red-400 transition shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Assets */}
          {results.assets.length > 0 && (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-blue-400" />
                Assets ({results.assets.length})
              </div>
              <div className="space-y-1">
                {results.assets.map(a => (
                  <div
                    key={a.id}
                    className="p-2.5 rounded bg-slate-950/50 border border-slate-800/80 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-400">{a.id}</span>
                      <span className="text-xs font-medium text-slate-200">{a.name}</span>
                      <span className="text-[10px] font-mono text-cyan-400">({a.ipAddress})</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                      CSE: {a.cseId} | Type: {a.assetType} | Criticality: {a.criticality} | Monitored: {a.isMonitored ? 'YES' : 'NO (GAP)'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
