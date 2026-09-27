import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, FileText, Server, AlertTriangle, ShieldAlert, CheckCircle2, 
  Clock, ArrowRight, UserCheck, Tag, Terminal
} from 'lucide-react';
import { api } from '../api';
import { Badge } from '../components/Badge';
import { Timeline } from '../components/Timeline';

interface CaseDetailPageProps {
  caseId: string;
  onNavigate: (route: string) => void;
}

export const CaseDetailPage: React.FC<CaseDetailPageProps> = ({ caseId, onNavigate }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.getCaseById(caseId)
      .then(res => {
        if (mounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Failed to load case', err);
        setLoading(false);
      });
    return () => { mounted = false; };
  }, [caseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-xs font-mono text-cyan-400">
        Loading case forensics and timeline audit logs for {caseId}...
      </div>
    );
  }

  if (!data || !data.case) {
    return (
      <div className="p-6 bg-red-950/40 border border-red-800 rounded font-mono text-xs text-red-400">
        Case record {caseId} not found in database.
      </div>
    );
  }

  const { case: c, cse, primaryAsset, relatedAlerts = [], investigation, escalation, findings = [], timings } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('/cases')}
          className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-cyan-400 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Case Review Queue
        </button>

        <div className="flex items-center gap-2">
          <Badge
            label={c.severity}
            variant={c.severity === 'CRITICAL' ? 'critical' : c.severity === 'HIGH' ? 'high' : 'moderate'}
            size="md"
          />
          <Badge label={c.status} variant="neutral" size="md" />
        </div>
      </div>

      {/* Case Overview Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-6 space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {c.id}
              </span>
              <span className="text-xs font-mono text-cyan-400 font-bold">
                {c.cseId} ({cse?.name})
              </span>
            </div>
            <h1 className="text-lg md:text-xl font-black font-mono text-slate-100 mt-1">
              {c.title}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-950 px-3 py-1.5 rounded border border-slate-800 text-center">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">PRIORITY SCORE</span>
              <span className="text-lg font-bold font-mono text-cyan-400">{c.priorityScore || 75} / 100</span>
            </div>
          </div>
        </div>

        {/* WHY WAS THIS CASE FLAGGED? (Section 19) */}
        <div className="bg-slate-950/80 border border-amber-900/40 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            Why was this case flagged for supervisory review?
          </div>

          <div className="text-xs font-mono text-slate-200 leading-relaxed pl-6">
            {findings.length > 0 ? (
              findings.map((f: any) => (
                <div key={f.id} className="mt-1">
                  • <strong>{f.title}</strong>: {f.reason}
                </div>
              ))
            ) : (
              <div>
                • Case flagged due to {c.severity} severity tier on critical asset {primaryAsset?.name} requiring supervisory closure confirmation.
              </div>
            )}
          </div>
        </div>

        {/* Asset & Alert Telemetry Attributes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs font-mono">
          <div className="bg-slate-950/60 p-3 rounded border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block flex items-center gap-1">
              <Server className="w-3 h-3 text-cyan-400" /> Impacted Asset
            </span>
            <div className="text-slate-200 font-semibold mt-1">{primaryAsset?.name || c.primaryAssetId}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              IP: {primaryAsset?.ipAddress} | Type: {primaryAsset?.assetType} | Monitored: {primaryAsset?.isMonitored ? 'YES' : 'NO'}
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-400" /> Incident Timings
            </span>
            <div className="text-slate-200 mt-1">
              Ack Time: <strong className="text-cyan-300">{timings?.acknowledgementMinutes !== null ? `${timings.acknowledgementMinutes}m` : 'N/A'}</strong>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Resolution Duration: <strong className="text-slate-200">{timings?.totalClosureMinutes !== null ? `${timings.totalClosureMinutes}m` : 'Open'}</strong>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-amber-400" /> Escalation Status
            </span>
            <div className="mt-1">
              {escalation ? (
                <span className="text-emerald-400 font-semibold">
                  Escalated to {escalation.escalatedTo}
                </span>
              ) : c.severity === 'CRITICAL' ? (
                <span className="text-red-400 font-semibold">
                  Missing Mandated Escalation
                </span>
              ) : (
                <span className="text-slate-400">Standard Local Handling</span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {escalation ? `At: ${new Date(escalation.escalatedAt).toLocaleTimeString()}` : 'No external escalation logged'}
            </div>
          </div>
        </div>
      </div>

      {/* INTERACTIVE TIMELINE (Section 19) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" /> Operational Lifecycle Timeline
            </h2>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              Calculates actual latency across triage, forensic investigation, and containment steps.
            </p>
          </div>
        </div>

        <Timeline
          caseData={{
            createdAt: c.createdAt,
            acknowledgedAt: c.acknowledgedAt,
            investigationStartedAt: c.investigationStartedAt,
            escalatedAt: c.escalatedAt,
            closedAt: c.closedAt,
            severity: c.severity,
            status: c.status
          }}
          timings={timings || {}}
        />
      </div>

      {/* Investigation Notes & Forensic Artifacts */}
      {investigation && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" /> Analyst Investigation Notes & Forensic Record
              </h2>
              <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                Investigator: <strong className="text-slate-300">{investigation.investigatorName}</strong> • Artifacts Attached: <strong className="text-slate-300">{investigation.evidenceArtifactCount}</strong>
              </div>
            </div>
            <Badge
              label={investigation.hasRemediationRecord ? 'Remediation Logged' : 'No Remediation Record'}
              variant={investigation.hasRemediationRecord ? 'success' : 'high'}
            />
          </div>

          <div className="p-4 rounded bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 leading-relaxed">
            {investigation.notes || 'No investigation notes recorded by operator.'}
          </div>

          {investigation.remediationActionSummary && (
            <div className="p-3 rounded bg-slate-950/60 border border-emerald-900/40 text-xs font-mono text-emerald-300">
              <strong>Recorded Remediation:</strong> {investigation.remediationActionSummary}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
