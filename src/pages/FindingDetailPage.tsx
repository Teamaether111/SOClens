import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, ShieldAlert, CheckCircle2, XCircle, Clock, AlertTriangle, 
  ArrowRight, FileText, UserCheck, ShieldCheck, History
} from 'lucide-react';
import { api } from '../api';
import { Badge } from '../components/Badge';

interface FindingDetailPageProps {
  findingId: string;
  onNavigate: (route: string) => void;
  onFindingReviewed?: () => void;
}

export const FindingDetailPage: React.FC<FindingDetailPageProps> = ({
  findingId,
  onNavigate,
  onFindingReviewed
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.getFindingById(findingId)
      .then(res => {
        if (mounted) {
          setData(res);
          setNote(res.finding?.supervisorNote || '');
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Failed to load finding', err);
        setLoading(false);
      });
    return () => { mounted = false; };
  }, [findingId]);

  const handleReviewAction = async (action: 'CONFIRM' | 'DISMISS' | 'NEEDS_REVIEW') => {
    setIsSubmitting(true);
    setActionSuccess(null);
    try {
      const res = await api.reviewFinding(findingId, action, note);
      setData((prev: any) => ({
        ...prev,
        finding: res.finding
      }));
      setActionSuccess(`Supervisory finding status successfully updated to ${res.finding.status}.`);
      if (onFindingReviewed) onFindingReviewed();
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-xs font-mono text-cyan-400">
        Retrieving supervisory dossier evidence for {findingId}...
      </div>
    );
  }

  if (!data || !data.finding) {
    return (
      <div className="p-6 bg-red-950/40 border border-red-800 rounded font-mono text-xs text-red-400">
        Supervisory signal record {findingId} not found in database.
      </div>
    );
  }

  const { finding, cse, relatedCase } = data;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('/findings')}
          className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-cyan-400 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Supervisory Signals
        </button>

        <div className="flex items-center gap-2">
          <Badge label={finding.status} variant={finding.status === 'CONFIRMED' ? 'critical' : finding.status === 'DISMISSED' ? 'neutral' : 'high'} size="md" />
        </div>
      </div>

      {/* Main Signal Dossier Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-6 space-y-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-cyan-400 bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800">
                {finding.id}
              </span>
              <Badge
                label={finding.severity}
                variant={finding.severity === 'CRITICAL' ? 'critical' : finding.severity === 'HIGH' ? 'high' : 'moderate'}
                size="md"
              />
              <Badge label={finding.category.replace(/_/g, ' ')} variant="neutral" size="md" />
            </div>

            <h1 className="text-lg md:text-xl font-black font-mono text-slate-100">
              {finding.title}
            </h1>

            <div className="text-xs font-mono text-slate-400 flex flex-wrap items-center gap-3">
              <span>Entity: <strong className="text-cyan-300">{cse?.name || finding.cseId}</strong> ({finding.cseId})</span>
              <span>•</span>
              <span>Confidence Score: <strong className="text-slate-200">{Math.round(finding.confidence * 100)}%</strong></span>
              {relatedCase && (
                <>
                  <span>•</span>
                  <span>Related Docket: <strong className="text-amber-400 cursor-pointer hover:underline" onClick={() => onNavigate(`/cases/${relatedCase.id}`)}>{relatedCase.id}</strong></span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate(`/cse/${finding.cseId}`)}
            className="px-3.5 py-2 rounded text-xs font-mono bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition flex items-center gap-2"
          >
            <span>Inspect {finding.cseId} Dossier</span> <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Reason / Statement */}
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-bold">
            Supervisory Reason & Evidence Statement
          </span>
          <p className="text-sm font-mono text-slate-200 bg-slate-950/60 p-4 rounded border border-slate-800 leading-relaxed">
            {finding.reason}
          </p>
        </div>

        {/* Expected vs Observed Workflow (Core Innovation: Section 10 & 11) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Expected Process */}
          <div className="bg-slate-950/80 border border-emerald-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Documented / Expected Standard Process
            </div>
            <p className="text-xs font-mono text-slate-300 leading-relaxed">
              {finding.expectedWorkflow}
            </p>
          </div>

          {/* Observed Operational Behaviour */}
          <div className="bg-slate-950/80 border border-amber-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Observed Operational Telemetry Evidence
            </div>
            <p className="text-xs font-mono text-slate-300 leading-relaxed">
              {finding.observedWorkflow}
            </p>
          </div>
        </div>

        {/* Recommended Supervisory Review Action */}
        <div className="bg-cyan-950/30 border border-cyan-800/60 rounded-lg p-4">
          <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold block mb-1">
            Recommended Supervisory Action
          </span>
          <p className="text-xs font-mono text-slate-200">
            {finding.recommendedReview}
          </p>
        </div>

        {/* Raw Telemetry Evidence Artifacts */}
        {finding.evidence && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-bold">
              Telemetry Evidence Artifacts
            </span>
            <pre className="p-4 rounded bg-slate-950 text-slate-300 font-mono text-xs overflow-x-auto border border-slate-800/80 max-h-56">
              {JSON.stringify(finding.evidence, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* HUMAN SUPERVISOR REVIEW ACTION PANEL (Section 20 & 24) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-cyan-400" /> Human Supervisor Adjudication Panel
            </h2>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              "SOClens recommends. Supervisors decide." Only a human supervisor can confirm or dismiss a signal.
            </p>
          </div>

          {finding.reviewedBy && (
            <div className="text-right text-[11px] font-mono text-slate-400">
              Reviewed by: <strong className="text-cyan-300">{finding.reviewedBy}</strong> ({new Date(finding.reviewedAt).toLocaleDateString()})
            </div>
          )}
        </div>

        {actionSuccess && (
          <div className="p-3 rounded bg-emerald-950/70 border border-emerald-800 text-xs font-mono text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-mono text-slate-300 font-medium">
            Supervisor Contextual Audit Note:
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Document supervisory reasoning, corroborating evidence, or reason for dismissal..."
            className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => handleReviewAction('CONFIRM')}
            disabled={isSubmitting}
            className="px-4 py-2 rounded text-xs font-mono font-bold bg-red-600 hover:bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.3)] transition disabled:opacity-50 flex items-center gap-1.5"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Confirm Finding</span>
          </button>

          <button
            onClick={() => handleReviewAction('NEEDS_REVIEW')}
            disabled={isSubmitting}
            className="px-4 py-2 rounded text-xs font-mono font-bold bg-amber-600 hover:bg-amber-500 text-slate-950 transition disabled:opacity-50 flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Needs Further Review</span>
          </button>

          <button
            onClick={() => handleReviewAction('DISMISS')}
            disabled={isSubmitting}
            className="px-4 py-2 rounded text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition disabled:opacity-50 flex items-center gap-1.5"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Dismiss Signal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
