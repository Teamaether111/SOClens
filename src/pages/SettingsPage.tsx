import React, { useEffect, useState } from 'react';
import { Settings, Save, RotateCcw, CheckCircle2, AlertTriangle, Sliders, Shield } from 'lucide-react';
import { api } from '../api';
import { Badge } from '../components/Badge';

export const SettingsPage: React.FC = () => {
  const [weights, setWeights] = useState({
    executionGap: 0.15,
    investigationWeakness: 0.10,
    escalationWeakness: 0.10,
    negativeSpace: 0.15,
    kpiContradiction: 0.15,
    anomaly: 0.15,
    peerDeviation: 0.10,
    historicalDeterioration: 0.10
  });

  const [thresholds, setThresholds] = useState({
    slaComplianceThreshold: 0.95,
    remediationEvidenceThreshold: 0.50,
    closureRateThreshold: 0.90,
    investigationEvidenceThreshold: 0.60,
    repetitionRateThreshold: 0.85
  });

  const [loading, setLoading] = useState(true);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await api.getSettings();
      if (res.scoringWeights) setWeights(res.scoringWeights);
      if (res.contradictionThresholds) setThresholds(res.contradictionThresholds);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load settings', err);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSavedMessage(null);
    try {
      await api.updateSettings({
        scoringWeights: weights,
        contradictionThresholds: thresholds
      });
      setSavedMessage('Settings saved and all supervisory scores successfully recalculated.');
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset all supervisory weights and contradiction thresholds to NCIIPC defaults?')) return;
    setIsSaving(true);
    setSavedMessage(null);
    try {
      await api.resetSettings();
      await loadSettings();
      setSavedMessage('Restored standard default calibration weights and recalculated scores.');
    } catch (err: any) {
      alert(`Reset failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-6 space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase tracking-widest flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" />
            Calibration Matrix
          </span>
          <span className="text-xs font-mono text-slate-400">Section 32 Configuration</span>
        </div>
        <h1 className="text-xl md:text-2xl font-black font-mono text-slate-100">
          Supervisory Scoring Weights & Contradiction Thresholds
        </h1>
        <p className="text-xs font-mono text-slate-300 max-w-3xl leading-relaxed">
          Calibrate the relative weighting of analytical components comprising the 0-100 Supervisory Attention Score and adjust sensitivity thresholds for the KPI-Evidence Contradiction Engine.
        </p>
      </div>

      {savedMessage && (
        <div className="p-4 rounded bg-emerald-950/80 border border-emerald-800 text-xs font-mono text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* 1. SCORING WEIGHTS CONFIGURATION */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-100">
              Supervisory Attention Score Weights (Sum: {Math.round(totalWeight * 100)}%)
            </h2>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              Governs composite attention score allocation across the 8 supervisory signals.
            </p>
          </div>
          <Badge label={Math.round(totalWeight * 100) === 100 ? '100% Calibrated' : 'Weights Variance'} variant={Math.round(totalWeight * 100) === 100 ? 'success' : 'high'} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="space-y-1.5 bg-slate-950/70 p-3.5 rounded border border-slate-800">
            <div className="flex justify-between text-slate-300">
              <span>Execution Gap</span>
              <strong className="text-cyan-400">{Math.round(weights.executionGap * 100)}%</strong>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.40"
              step="0.01"
              value={weights.executionGap}
              onChange={e => setWeights({ ...weights, executionGap: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div className="space-y-1.5 bg-slate-950/70 p-3.5 rounded border border-slate-800">
            <div className="flex justify-between text-slate-300">
              <span>Investigation Weakness</span>
              <strong className="text-cyan-400">{Math.round(weights.investigationWeakness * 100)}%</strong>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.30"
              step="0.01"
              value={weights.investigationWeakness}
              onChange={e => setWeights({ ...weights, investigationWeakness: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div className="space-y-1.5 bg-slate-950/70 p-3.5 rounded border border-slate-800">
            <div className="flex justify-between text-slate-300">
              <span>Escalation Weakness</span>
              <strong className="text-cyan-400">{Math.round(weights.escalationWeakness * 100)}%</strong>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.30"
              step="0.01"
              value={weights.escalationWeakness}
              onChange={e => setWeights({ ...weights, escalationWeakness: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div className="space-y-1.5 bg-slate-950/70 p-3.5 rounded border border-slate-800">
            <div className="flex justify-between text-slate-300">
              <span>Negative Space</span>
              <strong className="text-cyan-400">{Math.round(weights.negativeSpace * 100)}%</strong>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.35"
              step="0.01"
              value={weights.negativeSpace}
              onChange={e => setWeights({ ...weights, negativeSpace: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div className="space-y-1.5 bg-slate-950/70 p-3.5 rounded border border-slate-800">
            <div className="flex justify-between text-slate-300">
              <span>KPI Contradiction</span>
              <strong className="text-cyan-400">{Math.round(weights.kpiContradiction * 100)}%</strong>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.35"
              step="0.01"
              value={weights.kpiContradiction}
              onChange={e => setWeights({ ...weights, kpiContradiction: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div className="space-y-1.5 bg-slate-950/70 p-3.5 rounded border border-slate-800">
            <div className="flex justify-between text-slate-300">
              <span>Isolation Forest Anomaly</span>
              <strong className="text-cyan-400">{Math.round(weights.anomaly * 100)}%</strong>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.30"
              step="0.01"
              value={weights.anomaly}
              onChange={e => setWeights({ ...weights, anomaly: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div className="space-y-1.5 bg-slate-950/70 p-3.5 rounded border border-slate-800">
            <div className="flex justify-between text-slate-300">
              <span>Peer Deviation</span>
              <strong className="text-cyan-400">{Math.round(weights.peerDeviation * 100)}%</strong>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.25"
              step="0.01"
              value={weights.peerDeviation}
              onChange={e => setWeights({ ...weights, peerDeviation: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div className="space-y-1.5 bg-slate-950/70 p-3.5 rounded border border-slate-800">
            <div className="flex justify-between text-slate-300">
              <span>Historical Deterioration</span>
              <strong className="text-cyan-400">{Math.round(weights.historicalDeterioration * 100)}%</strong>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.25"
              step="0.01"
              value={weights.historicalDeterioration}
              onChange={e => setWeights({ ...weights, historicalDeterioration: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 2. CONTRADICTION THRESHOLDS CONFIGURATION */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-6 space-y-5">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-100">
            KPI-Evidence Contradiction Sensitivity Thresholds
          </h2>
          <p className="text-[11px] font-mono text-slate-400 mt-0.5">
            Configures boundary values triggering contradiction findings between reported KPIs and evidence metrics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
          <div className="bg-slate-950/70 p-4 rounded border border-slate-800 space-y-2">
            <span className="text-slate-300 font-semibold block">SLA Compliance Trigger</span>
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Reported SLA &gt;=</span>
              <strong className="text-cyan-400">{Math.round(thresholds.slaComplianceThreshold * 100)}%</strong>
            </div>
            <input
              type="range"
              min="0.80"
              max="0.99"
              step="0.01"
              value={thresholds.slaComplianceThreshold}
              onChange={e => setThresholds({ ...thresholds, slaComplianceThreshold: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />

            <div className="flex justify-between text-slate-400 text-[11px] pt-1">
              <span>Evidence Remediation &lt;</span>
              <strong className="text-red-400">{Math.round(thresholds.remediationEvidenceThreshold * 100)}%</strong>
            </div>
            <input
              type="range"
              min="0.20"
              max="0.70"
              step="0.01"
              value={thresholds.remediationEvidenceThreshold}
              onChange={e => setThresholds({ ...thresholds, remediationEvidenceThreshold: parseFloat(e.target.value) })}
              className="w-full accent-red-400 cursor-pointer"
            />
          </div>

          <div className="bg-slate-950/70 p-4 rounded border border-slate-800 space-y-2">
            <span className="text-slate-300 font-semibold block">Closure Rate Trigger</span>
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Reported Closure &gt;=</span>
              <strong className="text-cyan-400">{Math.round(thresholds.closureRateThreshold * 100)}%</strong>
            </div>
            <input
              type="range"
              min="0.75"
              max="0.99"
              step="0.01"
              value={thresholds.closureRateThreshold}
              onChange={e => setThresholds({ ...thresholds, closureRateThreshold: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />

            <div className="flex justify-between text-slate-400 text-[11px] pt-1">
              <span>Evidence Detailed Notes &lt;</span>
              <strong className="text-amber-400">{Math.round(thresholds.investigationEvidenceThreshold * 100)}%</strong>
            </div>
            <input
              type="range"
              min="0.30"
              max="0.80"
              step="0.01"
              value={thresholds.investigationEvidenceThreshold}
              onChange={e => setThresholds({ ...thresholds, investigationEvidenceThreshold: parseFloat(e.target.value) })}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          <div className="bg-slate-950/70 p-4 rounded border border-slate-800 space-y-2">
            <span className="text-slate-300 font-semibold block">TF-IDF Boilerplate Trigger</span>
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Mean Cosine Similarity &gt;=</span>
              <strong className="text-cyan-400">{Math.round(thresholds.repetitionRateThreshold * 100)}%</strong>
            </div>
            <input
              type="range"
              min="0.60"
              max="0.95"
              step="0.01"
              value={thresholds.repetitionRateThreshold}
              onChange={e => setThresholds({ ...thresholds, repetitionRateThreshold: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <p className="text-[10px] text-slate-500 pt-2">
              Fits local TF-IDF on notes; flags template-driven review when similarity exceeds threshold.
            </p>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2.5 rounded font-mono font-bold text-xs bg-cyan-600 hover:bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)] transition disabled:opacity-50 flex items-center gap-2"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isSaving ? 'Recalculating Scores...' : 'Save & Recalculate Scores'}</span>
        </button>

        <button
          onClick={handleReset}
          disabled={isSaving}
          className="px-4 py-2.5 rounded font-mono font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-2 disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Default Weights</span>
        </button>
      </div>
    </div>
  );
};
