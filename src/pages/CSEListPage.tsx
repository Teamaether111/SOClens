import React, { useState, useEffect } from 'react';
import { Shield, Search, Filter, ArrowRight, BarChart3, AlertTriangle } from 'lucide-react';
import { api } from '../api';
import { Badge } from '../components/Badge';

interface CSEListPageProps {
  onNavigate: (route: string) => void;
}

export const CSEListPage: React.FC<CSEListPageProps> = ({ onNavigate }) => {
  const [cses, setCses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [tierFilter, setTierFilter] = useState('ALL');

  useEffect(() => {
    api.getCSEs()
      .then(res => {
        setCses(res);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load CSEs', err);
        setLoading(false);
      });
  }, []);

  const filtered = cses.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.sector.toLowerCase().includes(search.toLowerCase());

    const matchesSector = sectorFilter === 'ALL' || c.sector === sectorFilter;
    const matchesTier = tierFilter === 'ALL' || c.tier === tierFilter;

    return matchesSearch && matchesSector && matchesTier;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-mono font-black text-slate-100 uppercase tracking-wider">
              Critical Sector Entities (CSEs)
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
              {cses.length} Enrolled
            </span>
          </div>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Supervisory portfolio across Energy, Banking & Finance, Telecommunications, Transportation, Defense, and Healthcare.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:w-56">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter by code or name..."
              className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-slate-900 border border-slate-800 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={sectorFilter}
            onChange={e => setSectorFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-mono bg-slate-900 border border-slate-800 rounded text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Sectors</option>
            <option value="ENERGY">Energy</option>
            <option value="BANKING_FINANCE">Banking & Finance</option>
            <option value="TRANSPORTATION">Transportation</option>
            <option value="TELECOMMUNICATIONS">Telecom</option>
            <option value="GOVERNMENT_DEFENSE">Defense</option>
            <option value="HEALTHCARE">Healthcare</option>
          </select>

          <select
            value={tierFilter}
            onChange={e => setTierFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-mono bg-slate-900 border border-slate-800 rounded text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Priority Tiers</option>
            <option value="CRITICAL">Critical Attention</option>
            <option value="HIGH">High Attention</option>
            <option value="MODERATE">Moderate</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* CSE Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-cyan-400">
            Loading entity registry...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-slate-500">
            No critical sector entities matched the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Entity Code</th>
                  <th className="py-3 px-4">Organization Name</th>
                  <th className="py-3 px-4">Sector</th>
                  <th className="py-3 px-4">Criticality</th>
                  <th className="py-3 px-4 text-center">Attention Score</th>
                  <th className="py-3 px-4">Priority Status</th>
                  <th className="py-3 px-4 text-center">Active Findings</th>
                  <th className="py-3 px-4 text-center">Contradictions</th>
                  <th className="py-3 px-4 text-right">Dossier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map(c => (
                  <tr
                    key={c.id}
                    onClick={() => onNavigate(`/cse/${c.id}`)}
                    className="hover:bg-slate-800/50 cursor-pointer transition group"
                  >
                    <td className="py-3 px-4">
                      <span className="font-bold text-cyan-300">{c.code}</span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-100 group-hover:text-cyan-300 transition">
                        {c.name}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {c.totalAssets} Assets ({c.criticalAssets} Critical)
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      {c.sector.replace('_', ' ')}
                    </td>

                    <td className="py-3 px-4">
                      <Badge
                        label={c.criticality}
                        variant={c.criticality === 'TIER_1' ? 'critical' : 'moderate'}
                      />
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`text-sm font-black ${
                        c.score >= 80 ? 'text-red-400' :
                        c.score >= 60 ? 'text-amber-400' :
                        c.score >= 35 ? 'text-yellow-400' : 'text-emerald-400'
                      }`}>
                        {c.score}
                      </span>
                      <span className="text-[10px] text-slate-500 block">/100</span>
                    </td>

                    <td className="py-3 px-4">
                      <Badge
                        label={c.tier}
                        variant={
                          c.tier === 'CRITICAL' ? 'critical' :
                          c.tier === 'HIGH' ? 'high' :
                          c.tier === 'MODERATE' ? 'moderate' : 'low'
                        }
                      />
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`font-bold ${c.findingsCount > 2 ? 'text-amber-400' : 'text-slate-300'}`}>
                        {c.findingsCount}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {c.contradictionsCount > 0 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                          {c.contradictionsCount}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate(`/cse/${c.id}`);
                        }}
                        className="px-2.5 py-1 text-[11px] font-mono rounded bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 border border-slate-700 hover:border-cyan-700 transition"
                      >
                        Assessment →
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
