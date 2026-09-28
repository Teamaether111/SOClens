import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, ShieldAlert, ArrowRight, Activity, Users, Layers } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, Legend, Cell, LabelList 
} from 'recharts';
import { api } from '../api';
import { Badge } from '../components/Badge';
import { useTheme } from '../context/ThemeContext';

interface BenchmarkingPageProps {
  onNavigate: (route: string) => void;
}

const METRIC_COLORS = {
  escalation: '#38bdf8',      // Sky Blue
  investigation: '#818cf8',   // Indigo
  closure: '#c084fc',         // Purple
  coverage: '#34d399',        // Emerald
  repeat: '#f87171',          // Rose / Red
  reopen: '#fbbf24'           // Amber
};

export const BenchmarkingPage: React.FC<BenchmarkingPageProps> = ({ onNavigate }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();

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

  // Data for the Cross-Sector Grouped Comparison Chart
  const crossSectorData = peerGroups.map((pg: any) => ({
    sector: pg.sector.replace('_', ' '),
    'Median Escalation': pg.stats?.medianEscalationRate || 0,
    'Median Inv. Time (m)': pg.stats?.medianInvestigationTimeMinutes || 0,
    'Median Closure (m)': pg.stats?.medianClosureTimeMinutes || 0,
    'Monitoring Cov. (%)': pg.stats?.medianMonitoringCoverage || 0,
    'Repeat Alerts (%)': pg.stats?.medianRepeatAlertRate || 0,
    'Reopen Rate (%)': pg.stats?.medianCaseReopenRate || 0,
    cseCount: pg.cseCount
  }));

  const chartTextColor = isDark ? '#94a3b8' : '#475569';
  const chartGridColor = isDark ? '#1e293b' : '#e2e8f0';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#cbd5e1';
  const tooltipText = isDark ? '#f8fafc' : '#0f172a';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-6 space-y-2 transition-colors">
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
          Operational metrics vary fundamentally across sectors (e.g. SCADA pipelines vs High-Frequency Trading). SOClens groups entities by sector and criticality tier to isolate genuine anomalous deviations from sectoral norms.
        </p>
      </div>

      {/* 1. CROSS-SECTOR COMPARISON GROUPED BAR CHART */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider">
                Cross-Sector Comparative Baseline (All Critical Sectors)
              </h2>
            </div>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              Side-by-side grouped distribution of the 6 core supervisory telemetry indicators across all enrolled sectors.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono bg-slate-950/70 px-2.5 py-1 rounded border border-slate-800 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>{peerGroups.length} Monitored Sectors</span>
          </div>
        </div>

        {/* Recharts Grouped Bar Chart */}
        <div className="w-full h-80 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={crossSectorData}
              margin={{ top: 15, right: 20, left: 0, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
              <XAxis 
                dataKey="sector" 
                tick={{ fontSize: 11, fill: chartTextColor, fontFamily: 'monospace' }}
                axisLine={{ stroke: chartGridColor }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: chartTextColor, fontFamily: 'monospace' }}
                axisLine={{ stroke: chartGridColor }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  borderColor: tooltipBorder,
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  color: tooltipText,
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                }}
                itemStyle={{ color: tooltipText }}
              />
              <Legend 
                wrapperStyle={{ 
                  fontSize: '11px', 
                  fontFamily: 'monospace', 
                  paddingTop: '8px' 
                }} 
              />
              <Bar dataKey="Median Escalation" fill={METRIC_COLORS.escalation} name="Median Escalation (%)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Median Inv. Time (m)" fill={METRIC_COLORS.investigation} name="Median Inv. Time (min)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Median Closure (m)" fill={METRIC_COLORS.closure} name="Median Closure (min)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Monitoring Cov. (%)" fill={METRIC_COLORS.coverage} name="Monitoring Cov. (%)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Repeat Alerts (%)" fill={METRIC_COLORS.repeat} name="Repeat Alerts (%)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Reopen Rate (%)" fill={METRIC_COLORS.reopen} name="Reopen Rate (%)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. INDIVIDUAL SECTOR PANELS WITH HORIZONTAL BAR CHARTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {peerGroups.map((pg: any) => {
          const stats = pg.stats || {};
          const sectorMetrics = [
            {
              metric: 'Median Escalation',
              value: stats.medianEscalationRate || 0,
              displayValue: `${stats.medianEscalationRate || 0}%`,
              color: METRIC_COLORS.escalation,
              unit: '%'
            },
            {
              metric: 'Median Inv. Time',
              value: stats.medianInvestigationTimeMinutes || 0,
              displayValue: `${stats.medianInvestigationTimeMinutes || 0}m`,
              color: METRIC_COLORS.investigation,
              unit: 'm'
            },
            {
              metric: 'Median Closure',
              value: stats.medianClosureTimeMinutes || 0,
              displayValue: `${stats.medianClosureTimeMinutes || 0}m`,
              color: METRIC_COLORS.closure,
              unit: 'm'
            },
            {
              metric: 'Monitoring Cov.',
              value: stats.medianMonitoringCoverage || 0,
              displayValue: `${stats.medianMonitoringCoverage || 0}%`,
              color: METRIC_COLORS.coverage,
              unit: '%'
            },
            {
              metric: 'Repeat Alerts',
              value: stats.medianRepeatAlertRate || 0,
              displayValue: `${stats.medianRepeatAlertRate || 0}%`,
              color: METRIC_COLORS.repeat,
              unit: '%'
            },
            {
              metric: 'Reopen Rate',
              value: stats.medianCaseReopenRate || 0,
              displayValue: `${stats.medianCaseReopenRate || 0}%`,
              color: METRIC_COLORS.reopen,
              unit: '%'
            }
          ];

          return (
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
                <Badge label={`${pg.cseCount} ENTITIES`} variant="info" />
              </div>

              {/* Horizontal Bar Chart for the 6 Metrics */}
              <div className="w-full h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={sectorMetrics}
                    margin={{ top: 5, right: 45, left: 15, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} horizontal={false} />
                    <XAxis 
                      type="number" 
                      tick={{ fontSize: 9, fill: chartTextColor, fontFamily: 'monospace' }}
                      axisLine={{ stroke: chartGridColor }}
                      tickLine={false}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="metric" 
                      width={110}
                      tick={{ fontSize: 10, fill: chartTextColor, fontFamily: 'monospace' }}
                      axisLine={{ stroke: chartGridColor }}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(val: any, name: any, item: any) => [
                        item.payload.displayValue, 
                        item.payload.metric
                      ]}
                      contentStyle={{
                        backgroundColor: tooltipBg,
                        borderColor: tooltipBorder,
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        color: tooltipText
                      }}
                    />
                    <Bar dataKey="value" barSize={16} radius={[0, 3, 3, 0]} isAnimationActive={false}>
                      {sectorMetrics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                      <LabelList 
                        dataKey="displayValue" 
                        position="right" 
                        style={{ 
                          fontSize: '10px', 
                          fontFamily: 'monospace', 
                          fontWeight: 'bold',
                          fill: isDark ? '#e2e8f0' : '#1e293b' 
                        }} 
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Threshold & Inquire Notes - Preserved */}
              <div className="text-[10px] font-mono text-slate-400 border-t border-slate-800/80 pt-2 flex items-center justify-between">
                <span>Deviation flag threshold: &gt; 30 percentage points</span>
                <span className="text-cyan-400">Contextual inquiry only</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
