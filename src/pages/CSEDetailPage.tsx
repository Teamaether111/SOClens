import React, { useEffect, useState } from 'react';
import { 
  ShieldAlert, ArrowLeft, ArrowRight, Server, AlertTriangle, Scale, 
  FileCheck2, CheckCircle2, ScanEye, ExternalLink, Activity
} from 'lucide-react';
import { api } from '../api';
import { Badge } from '../components/Badge';
import { RadarChart } from '../components/RadarChart';

interface CSEDetailPageProps {
  cseId: string;
  onNavigate: (route: string) => void;
}

export const CSEDetailPage: React.FC<CSEDetailPageProps> = ({ cseId, onNavigate }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.getCSEById(cseId)
      .then(res => {
        if (mounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch(err => {
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, [cseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-xs font-mono text-cyan-400">
        Loading comprehensive supervisory dossier for {cseId}...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-950/40 border border-red-800 rounded font-mono text-xs text-red-400">
        Error loading CSE assessment: {error || 'Record not found'}
      </div>
    );
  }

  const {
    cse,
    score,
    reportedKpi,
    evidenceMetric,
    peerGroup,
    findings = [],
    contradictions = [],
    negativeGaps = [],
    priorityCases = [],
    assetsCount,
    criticalAssetsCount,
    monitoredAssetsCount,
    alertsCount,
    criticalAlertsCount,
    casesCount
  } = data;

  const breakdown = score?.breakdown || {};
  const radar = score?.radarCapabilities || {};
  const monitoringPct = assetsCount > 0 ? Math.round((monitoredAssetsCount / assetsCount) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Header & Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('/cse')}
          className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-cyan-400 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to CSE Directory
        </button>

        <div className="flex items-center gap-2">
          <Badge
            label={cse.sector.replace('_', ' ')}
            variant="neutral"
            size="md"
          />
          <Badge
            label={cse.criticality}
            variant={cse.criticality === 'TIER_1' ? 'critical' : 'moderate'}
            size="md"
          />
        </div>
      </div>

      {/* Top Banner: Attention Score & Identity */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-black font-mono text-slate-100">{cse.name}</h1>
              <span className="text-lg font-mono font-bold text-cyan-400">({cse.code})</span>
            </div>
            <div className="text-xs font-mono text-slate-400 mt-1 flex flex-wrap items-center gap-3">
              <span>Assessment Cycle: <strong className="text-slate-200">{cse.reportingCycle}</strong></span>
              <span>•</span>
              <span>Total Assets: <strong className="text-slate-200">{assetsCount}</strong> ({criticalAssetsCount} Critical)</span>
              <span>•</span>
              <span>Total Alerts: <strong className="text-slate-200">{alertsCount}</strong> ({criticalAlertsCount} Critical)</span>
              <span>•</span>
              <span>Cases: <strong className="text-slate-200">{casesCount}</strong></span>
            </div>
          </div>

          {/* Attention Score Badge Box */}
          <div className="flex items-center gap-4 bg-slate-950/80 border border-slate-800 p-4 rounded-lg shrink-0">
            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">SUPERVISORY ATTENTION SCORE</span>
              <div className="flex items-baseline gap-1 justify-end">
                <span className={`text-3xl font-black font-mono ${
                  score?.overallScore >= 80 ? 'text-red-400' :
                  score?.overallScore >= 60 ? 'text-amber-400' :
                  score?.overallScore >= 35 ? 'text-yellow-400' : 'text-emerald-400'
                }`}>
                  {score?.overallScore || 0}
                </span>
                <span className="text-xs font-mono text-slate-500">/100</span>
              </div>
            </div>
            <div className="border-l border-slate-800 pl-4">
              <Badge
                label={score?.tier || 'LOW'}
                variant={
                  score?.tier === 'CRITICAL' ? 'critical' :
                  score?.tier === 'HIGH' ? 'high' :
                  score?.tier === 'MODERATE' ? 'moderate' : 'low'
                }
                size="lg"
              />
            </div>
          </div>
        </div>

        {/* Score Contributors Breakdown */}
        <div className="mt-6 pt-4 border-t border-slate-800/80">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">
            Dynamic Score Contributors (Click contributor to view evidence)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs font-mono">
            <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
              <span className="text-[9px] text-slate-400 block truncate">Execution Gap</span>
              <span className="text-sm font-bold text-amber-400">+{breakdown.executionGap || 0}</span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
              <span className="text-[9px] text-slate-400 block truncate">Investigation</span>
              <span className="text-sm font-bold text-amber-400">+{breakdown.investigationWeakness || 0}</span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
              <span className="text-[9px] text-slate-400 block truncate">Escalation</span>
              <span className="text-sm font-bold text-amber-400">+{breakdown.escalationWeakness || 0}</span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
              <span className="text-[9px] text-slate-400 block truncate">Negative Space</span>
              <span className="text-sm font-bold text-red-400">+{breakdown.negativeSpace || 0}</span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
              <span className="text-[9px] text-slate-400 block truncate">KPI Contradiction</span>
              <span className="text-sm font-bold text-cyan-400">+{breakdown.kpiContradiction || 0}</span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
              <span className="text-[9px] text-slate-400 block truncate">Anomaly IF</span>
              <span className="text-sm font-bold text-yellow-400">+{breakdown.anomaly || 0}</span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
              <span className="text-[9px] text-slate-400 block truncate">Peer Deviation</span>
              <span className="text-sm font-bold text-slate-300">+{breakdown.peerDeviation || 0}</span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
              <span className="text-[9px] text-slate-400 block truncate">Historical Trend</span>
              <span className="text-sm font-bold text-slate-300">+{breakdown.historicalDeterioration || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Radar Capabilities & Side-by-side KPI Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Radar Capabilities Chart (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 mb-1 flex items-center gap-2">
              <Activity className="w-4 h-4" /> 8 Capability Dimensions Assessment
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Evaluated from operational telemetry rigor across incident lifecycle
            </p>
          </div>

          <div className="py-2 flex items-center justify-center">
            <RadarChart data={radar} size={300} />
          </div>

          <div className="text-[10px] font-mono text-slate-500 text-center border-t border-slate-800 pt-2">
            Polygon shrinkage indicates operational vulnerabilities requiring contextual inquiry.
          </div>
        </div>

        {/* SIDE-BY-SIDE REPORTED KPIS VS EVIDENCE METRICS (7 cols) - MANDATED SECTION 17 */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                <Scale className="w-4 h-4" /> Reported KPIs vs Operational Evidence
              </h3>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                Independent Cross-Check
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mb-4">
              Compares self-declared performance summary metrics against independently computed telemetry evidence.
            </p>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {/* Row 1: SLA Compliance vs Remediation Evidence */}
            <div className="p-3 rounded bg-slate-950/70 border border-slate-800">
              <div className="flex items-center justify-between text-[11px] mb-2">
                <span className="text-slate-400">Metric 1: SLA Compliance vs Remediation Records</span>
                {reportedKpi && evidenceMetric && reportedKpi.slaCompliance > 0.95 && evidenceMetric.remediationEvidence < 0.50 && (
                  <span className="text-[10px] text-red-400 font-bold uppercase flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Contradiction Detected
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="border-r border-slate-800 pr-2">
                  <span className="text-[10px] text-slate-500 uppercase block">Signal A — Reported KPI</span>
                  <span className="text-lg font-bold text-slate-100">
                    {reportedKpi ? `${Math.round(reportedKpi.slaCompliance * 100)}%` : 'N/A'}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Self-Declared SLA Compliance</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Signal B — Evidence Metric</span>
                  <span className={`text-lg font-bold ${
                    evidenceMetric && evidenceMetric.remediationEvidence < 0.50 ? 'text-red-400' : 'text-emerald-400'
                  }`}>
                    {evidenceMetric ? `${Math.round(evidenceMetric.remediationEvidence * 100)}%` : 'N/A'}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Cases with Remediation Records</span>
                </div>
              </div>
            </div>

            {/* Row 2: Closure Rate vs Substantive Notes */}
            <div className="p-3 rounded bg-slate-950/70 border border-slate-800">
              <div className="flex items-center justify-between text-[11px] mb-2">
                <span className="text-slate-400">Metric 2: Case Closure Rate vs Substantive Notes (&gt;50 words)</span>
                {reportedKpi && evidenceMetric && reportedKpi.closureRate > 0.90 && evidenceMetric.investigationEvidence < 0.60 && (
                  <span className="text-[10px] text-amber-400 font-bold uppercase flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Contradiction Detected
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="border-r border-slate-800 pr-2">
                  <span className="text-[10px] text-slate-500 uppercase block">Signal A — Reported KPI</span>
                  <span className="text-lg font-bold text-slate-100">
                    {reportedKpi ? `${Math.round(reportedKpi.closureRate * 100)}%` : 'N/A'}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Self-Declared Case Closure Rate</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Signal B — Evidence Metric</span>
                  <span className={`text-lg font-bold ${
                    evidenceMetric && evidenceMetric.investigationEvidence < 0.60 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {evidenceMetric ? `${Math.round(evidenceMetric.investigationEvidence * 100)}%` : 'N/A'}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Cases with Detailed Notes (&gt;50w)</span>
                </div>
              </div>
            </div>

            {/* Row 3: Investigation Note Repetition Rate (TF-IDF Cosine Similarity) */}
            <div className="p-3 rounded bg-slate-950/70 border border-slate-800">
              <div className="flex items-center justify-between text-[11px] mb-2">
                <span className="text-slate-400">Metric 3: Textual Uniqueness (Local TF-IDF + Cosine Similarity)</span>
                {evidenceMetric && evidenceMetric.repetitionRate > 0.85 && (
                  <span className="text-[10px] text-red-400 font-bold uppercase flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Boilerplate Review Pattern
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="border-r border-slate-800 pr-2">
                  <span className="text-[10px] text-slate-500 uppercase block">Case Investigation Depth</span>
                  <span className="text-lg font-bold text-slate-100">
                    {evidenceMetric?.caseDepth || 0} words
                  </span>
                  <span className="text-[10px] text-slate-400 block">Mean Words / Investigation</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Mean Note Similarity</span>
                  <span className={`text-lg font-bold ${
                    evidenceMetric && evidenceMetric.repetitionRate > 0.85 ? 'text-red-400' : 'text-slate-200'
                  }`}>
                    {evidenceMetric ? `${Math.round(evidenceMetric.repetitionRate * 100)}%` : 'N/A'}
                  </span>
                  <span className="text-[10px] text-slate-400 block">TF-IDF Cosine Similarity</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 text-[10px] font-mono text-slate-400 bg-slate-950/40 p-2.5 rounded border border-slate-800/80">
            <strong>Supervisory Note:</strong> "Reported metric is not sufficiently supported by available operational evidence." (Conservative framing — flags for review, does not accuse).
          </div>
        </div>
      </div>

      {/* 3. KEY SUPERVISORY FINDINGS */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" /> Active Supervisory Findings ({findings.length})
            </h3>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Identified by Rule Engine, Negative Space Engine, and Anomaly Detection
            </p>
          </div>
          <button
            onClick={() => onNavigate(`/findings?cseId=${cse.id}`)}
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300"
          >
            Review All Signals →
          </button>
        </div>

        {findings.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-slate-500">
            No active supervisory findings logged for this entity during the reporting cycle.
          </div>
        ) : (
          <div className="space-y-2">
            {findings.map((f: any) => (
              <div
                key={f.id}
                onClick={() => onNavigate(`/findings/${f.id}`)}
                className="p-3.5 rounded bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 transition cursor-pointer flex items-start justify-between gap-4 group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      label={f.severity}
                      variant={f.severity === 'CRITICAL' ? 'critical' : f.severity === 'HIGH' ? 'high' : 'moderate'}
                    />
                    <Badge label={f.category.replace('_', ' ')} variant="neutral" />
                    <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition">
                      {f.title}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1">{f.reason}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Badge
                    label={f.status}
                    variant={f.status === 'CONFIRMED' ? 'critical' : f.status === 'DISMISSED' ? 'neutral' : 'high'}
                  />
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. PRIORITY CASES FOR THIS CSE */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-amber-400" /> Recommended Priority Cases ({priorityCases.length})
            </h3>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Prioritized by severity, criticality, and associated execution gaps
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Case ID</th>
                <th className="py-2.5 px-3">Title</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Associated Finding</th>
                <th className="py-2.5 px-3 text-center">Priority Score</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {priorityCases.map((c: any) => (
                <tr
                  key={c.id}
                  onClick={() => onNavigate(`/cases/${c.id}`)}
                  className="hover:bg-slate-800/40 cursor-pointer transition"
                >
                  <td className="py-2.5 px-3 font-bold text-amber-400">{c.id}</td>
                  <td className="py-2.5 px-3 text-slate-200">{c.title}</td>
                  <td className="py-2.5 px-3">
                    <Badge label={c.severity} variant={c.severity === 'CRITICAL' ? 'critical' : 'high'} />
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 text-[11px] truncate max-w-xs">
                    {c.topFindingTitle || 'Standard triage'}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-cyan-300">
                    {c.priorityScore || 50}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button className="px-2 py-0.5 text-[10px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300">
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
