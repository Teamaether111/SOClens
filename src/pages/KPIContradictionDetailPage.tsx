import React, { useEffect, useState } from 'react';
import { ArrowLeft, Scale, AlertTriangle, CheckCircle2, XCircle, Clock, FileText, ArrowRight } from 'lucide-react';
import { api } from '../api';
import { Badge } from '../components/Badge';

interface KPIContradictionDetailPageProps {
  contradictionId: string;
  onNavigate: (route: string) => void;
  onReviewed?: () => void;
}

export const KPIContradictionDetailPage: React.FC<KPIContradictionDetailPageProps> = ({
  contradictionId,
  onNavigate,
  onReviewed
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.getContradictionById(contradictionId)
      .then(res => {
        if (mounted) {
          setData(res);
          setNote(res.contradiction?.supervisorNote || '');
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Failed to load contradiction', err);
        setLoading(false);
      });
    return () => { mounted = false; };
  }, [contradictionId]);

  const handleReviewAction = async (action: 'CONFIRM' | 'DISMISS' | 'NEEDS_REVIEW') => {
    try {
      const res = await api.reviewContradiction(contradictionId, action, note);
      setData((prev: any) => ({
        ...prev,
        contradiction: res.contradiction
      }));
      setActionSuccess(`Contradiction status updated to ${res.contradiction.status}.`);
      if (onReviewed) onReviewed();
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-xs font-mono text-cyan-400">
        Loading contradiction audit evidence...
      </div>
    );
  }

  if (!data || !data.contradiction) {
    return (
      <div className="p-6 bg-red-950/40 border border-red-800 rounded font-mono text-xs text-red-400">
        Contradiction record not found.
      </div>
    );
  }

  const { contradiction: c, cse, reportedKpi, evidenceMetric, sampleCases = [], sampleInvestigations = [] } = data;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('/kpi-evidence')}
          className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-cyan-400 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to KPI Contradictions
        </button>

        <Badge label={c.status} variant={c.status === 'CONFIRMED' ? 'critical' : c.status === 'DISMISSED' ? 'neutral' : 'high'} size="md" />
      </div>

      {/* Main Comparison Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-cyan-400 bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800">
                {c.id}
              </span>
              <span className="text-xs font-mono text-slate-400">Entity: <strong className="text-slate-200">{cse?.name}</strong> ({c.cseId})</span>
            </div>
            <h1 className="text-lg md:text-xl font-black font-mono text-slate-100 mt-1">
              Cross-Check Discrepancy: {c.kpiName} vs {c.evidenceMetricName}
            </h1>
          </div>

          <button
            onClick={() => onNavigate(`/cse/${c.cseId}`)}
            className="px-3 py-1.5 rounded text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            Inspect {c.cseId} Dossier →
          </button>
        </div>

        {/* Side by side Signal A vs Signal B */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="bg-slate-950/80 p-5 rounded-lg border border-slate-800 space-y-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              SIGNAL A — REPORTED BY CSE ({cse?.code})
            </span>
            <div className="text-slate-300 font-semibold">{c.kpiName}</div>
            <div className="text-3xl font-black text-slate-100">
              {c.kpiValue === 1.0 ? '100% Unique' : `${Math.round(c.kpiValue * 100)}%`}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed pt-2 border-t border-slate-800">
              Source: Official Quarterly Self-Declaration. The entity asserts high compliance and resolved workload metrics.
            </p>
          </div>

          <div className="bg-slate-950/80 p-5 rounded-lg border border-red-900/50 space-y-2">
            <span className="text-[10px] text-red-400 uppercase font-bold block">
              SIGNAL B — INDEPENDENT OPERATIONAL EVIDENCE
            </span>
            <div className="text-slate-300 font-semibold">{c.evidenceMetricName}</div>
            <div className="text-3xl font-black text-red-400">
              {typeof c.evidenceValue === 'number' ? `${Math.round(c.evidenceValue * 100)}%` : c.evidenceValue}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed pt-2 border-t border-slate-800">
              Source: Parsed directly from {sampleCases.length} raw case dockets and local TF-IDF cosine similarity matrix.
            </p>
          </div>
        </div>

        {/* Framing & Mandated Phrasing */}
        <div className="bg-slate-950 p-4 rounded border border-slate-800 text-xs font-mono space-y-2">
          <div className="text-cyan-400 font-bold uppercase text-[10px]">
            Supervisory Statement (Conservative Phrasing):
          </div>
          <div className="text-sm font-semibold text-slate-100 italic">
            "{c.statement}"
          </div>
          <div className="text-slate-400 text-xs pt-1">
            <strong>Recommended Review Action:</strong> {c.recommendedReview}
          </div>
        </div>

        {/* Evidence Samples: Raw Case Records */}
        <div className="space-y-2">
          <div className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center justify-between">
            <span>Sample Raw Case Investigations Evaluated ({sampleInvestigations.length})</span>
            <span className="text-[10px] text-slate-500 font-normal">Demonstrating true operational depth</span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {sampleInvestigations.map((inv: any, idx: number) => (
              <div key={inv.id || idx} className="p-3 rounded bg-slate-950/70 border border-slate-800 text-xs font-mono">
                <div className="flex items-center justify-between text-[11px] mb-1 text-slate-400">
                  <span className="font-bold text-amber-400">{inv.caseId}</span>
                  <span>Investigator: {inv.investigatorName}</span>
                  <span className={inv.hasRemediationRecord ? 'text-emerald-400' : 'text-red-400'}>
                    {inv.hasRemediationRecord ? 'Remediation: YES' : 'Remediation: NO'}
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed line-clamp-2">
                  "{inv.notes}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Review Actions Panel */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-6 space-y-4">
        <h2 className="text-sm font-mono font-bold uppercase text-slate-100">
          Supervisory Adjudication & Notes
        </h2>

        {actionSuccess && (
          <div className="p-3 rounded bg-emerald-950 border border-emerald-800 text-xs font-mono text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        <textarea
          rows={3}
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Document reason for finding confirmation or explanation provided by entity..."
          className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
        />

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleReviewAction('CONFIRM')}
            className="px-4 py-2 rounded text-xs font-mono font-bold bg-red-600 hover:bg-red-500 text-white transition flex items-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Confirm Contradiction Finding
          </button>
          <button
            onClick={() => handleReviewAction('NEEDS_REVIEW')}
            className="px-4 py-2 rounded text-xs font-mono font-bold bg-amber-600 hover:bg-amber-500 text-slate-950 transition flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" /> Needs Further Review
          </button>
          <button
            onClick={() => handleReviewAction('DISMISS')}
            className="px-4 py-2 rounded text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1.5"
          >
            <XCircle className="w-3.5 h-3.5" /> Dismiss Contradiction Signal
          </button>
        </div>
      </div>
    </div>
  );
};
