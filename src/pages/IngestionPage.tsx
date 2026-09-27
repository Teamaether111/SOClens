import React, { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle2, AlertTriangle, FileText, Database, ArrowRight, Play, RefreshCw } from 'lucide-react';
import { api } from '../api';
import { Badge } from '../components/Badge';

interface IngestionPageProps {
  onNavigate: (route: string) => void;
  onDataIngested?: () => void;
}

export const IngestionPage: React.FC<IngestionPageProps> = ({ onNavigate, onDataIngested }) => {
  const [dataStatus, setDataStatus] = useState<any>(null);
  const [uploadText, setUploadText] = useState('');
  const [fileName, setFileName] = useState('quarterly_telemetry_feed.json');
  const [format, setFormat] = useState<'JSON' | 'CSV'>('JSON');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const res = await api.getDataStatus();
      setDataStatus(res);
    } catch (err) {
      console.error('Failed to load data status', err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFormat(file.name.endsWith('.csv') ? 'CSV' : 'JSON');

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadText((event.target?.result as string) || '');
    };
    reader.readAsText(file);
  };

  const loadSamplePayload = () => {
    const sample = [
      {
        type: "REPORTED_KPI",
        cseId: "CSE-11",
        reportingCycle: "2026-Q3",
        slaCompliance: 0.98,
        closureRate: 0.94,
        escalationRate: 0.88
      },
      {
        type: "CASE",
        id: "CAS-INGEST-201",
        cseId: "CSE-11",
        title: "Critical Telemetry Anomaly - Hydroelectric SCADA Unit 3",
        severity: "CRITICAL",
        primaryAssetId: "AST-1011",
        status: "CLOSED",
        createdAt: "2026-09-18T10:14:00Z",
        acknowledgedAt: "2026-09-18T10:20:00Z",
        investigationStartedAt: "2026-09-18T10:25:00Z",
        closedAt: "2026-09-18T10:31:00Z"
      },
      {
        type: "ALERT",
        id: "ALT-INGEST-501",
        cseId: "CSE-11",
        assetId: "AST-1011",
        title: "CRITICAL MALWARE detected on SCADA Gateway",
        category: "MALWARE",
        severity: "CRITICAL",
        status: "CLOSED"
      }
    ];
    setUploadText(JSON.stringify(sample, null, 2));
    setFormat('JSON');
    setFileName('sample_critical_infrastructure_batch.json');
  };

  const handleProcessUpload = async () => {
    if (!uploadText.trim()) {
      alert('Please enter or select file content to upload.');
      return;
    }

    setIsProcessing(true);
    setUploadResult(null);

    try {
      const res = await api.uploadData({
        fileName,
        format,
        content: uploadText
      });
      setUploadResult(res);
      await loadStatus();
      if (onDataIngested) onDataIngested();
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const pipelineSteps = [
    { label: 'UPLOAD', desc: 'Secure payload ingest' },
    { label: 'VALIDATE', desc: 'Schema & type check' },
    { label: 'NORMALIZE', desc: 'Schema alignment' },
    { label: 'STORE', desc: 'PostgreSQL persistence' },
    { label: 'FEATURE ENG.', desc: 'Independent derivation' },
    { label: 'ANALYZE', desc: 'Rules & Isolation Forest' },
    { label: 'SCORE', desc: '0-100 Attention calculation' },
    { label: 'READY', desc: 'Supervisory review queue' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-6 space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase tracking-widest flex items-center gap-1.5">
            <UploadCloud className="w-3.5 h-3.5" />
            Air-Gapped Ingestion Hub
          </span>
          <span className="text-xs font-mono text-slate-400">Periodic SOC Batch Feeds</span>
        </div>
        <h1 className="text-xl md:text-2xl font-black font-mono text-slate-100">
          Data Ingestion & Telemetry Normalization
        </h1>
        <p className="text-xs font-mono text-slate-300 max-w-3xl leading-relaxed">
          Ingests periodic alert, case-management, and self-reported KPI compliance data from Critical Sector Entities. Validates and parses raw case records separately from self-reported KPIs to ensure independent signal derivation.
        </p>
      </div>

      {/* Processing Pipeline Flow (Section 6) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5">
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-3">
          Ingestion & Analytics Pipeline Architecture
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {pipelineSteps.map((step, idx) => (
            <div key={idx} className="bg-slate-950/80 p-2.5 rounded border border-slate-800 text-center relative group">
              <span className="text-[10px] font-mono text-cyan-400 font-bold block">{idx + 1}. {step.label}</span>
              <span className="text-[9px] font-mono text-slate-400 block mt-1">{step.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Database State Summary */}
      {dataStatus && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
          <div className="bg-slate-900/80 p-3 rounded border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">Entities</span>
            <span className="text-lg font-bold text-slate-100 mt-1 block">{dataStatus.totalCses}</span>
          </div>
          <div className="bg-slate-900/80 p-3 rounded border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">Total Assets</span>
            <span className="text-lg font-bold text-slate-100 mt-1 block">{dataStatus.totalAssets}</span>
          </div>
          <div className="bg-slate-900/80 p-3 rounded border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">Total Alerts</span>
            <span className="text-lg font-bold text-cyan-400 mt-1 block">{dataStatus.totalAlerts.toLocaleString()}</span>
          </div>
          <div className="bg-slate-900/80 p-3 rounded border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">Case Dockets</span>
            <span className="text-lg font-bold text-amber-400 mt-1 block">{dataStatus.totalCases.toLocaleString()}</span>
          </div>
          <div className="bg-slate-900/80 p-3 rounded border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">Investigations</span>
            <span className="text-lg font-bold text-slate-200 mt-1 block">{dataStatus.totalInvestigations.toLocaleString()}</span>
          </div>
          <div className="bg-slate-900/80 p-3 rounded border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">Escalations</span>
            <span className="text-lg font-bold text-emerald-400 mt-1 block">{dataStatus.totalEscalations.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Upload Interface */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-cyan-400" /> Upload Critical Sector Telemetry Batch
            </h2>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              Supports periodic JSON batch files or CSV exports containing alerts, cases, and self-reported KPIs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadSamplePayload}
              className="px-2.5 py-1 text-xs font-mono rounded bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-slate-700 transition"
            >
              Load Sample Telemetry
            </button>
          </div>
        </div>

        {/* File input or text area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-300 font-semibold block">
              1. Choose Telemetry File (CSV / JSON):
            </label>
            <input
              type="file"
              accept=".csv,.json"
              onChange={handleFileUpload}
              className="block w-full text-xs font-mono text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-mono file:font-semibold file:bg-cyan-950 file:text-cyan-300 hover:file:bg-cyan-900 cursor-pointer"
            />
            <div className="text-[10px] font-mono text-slate-500">
              Active File: <strong className="text-slate-300">{fileName}</strong> ({format})
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-300 font-semibold block">
              2. Review Ingest Format:
            </label>
            <div className="flex items-center gap-4 text-xs font-mono text-slate-300">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  checked={format === 'JSON'}
                  onChange={() => setFormat('JSON')}
                  className="accent-cyan-500"
                />
                JSON Schema Feed
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  checked={format === 'CSV'}
                  onChange={() => setFormat('CSV')}
                  className="accent-cyan-500"
                />
                CSV Tabular Export
              </label>
            </div>
          </div>
        </div>

        {/* Payload Preview */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono text-slate-400 font-medium">
            Payload Text Content Preview:
          </label>
          <textarea
            rows={8}
            value={uploadText}
            onChange={e => setUploadText(e.target.value)}
            placeholder="Paste raw JSON array or CSV text containing alerts, cases, and reported_kpis..."
            className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleProcessUpload}
            disabled={isProcessing || !uploadText.trim()}
            className="px-5 py-2.5 rounded font-mono font-bold text-xs bg-cyan-600 hover:bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)] transition disabled:opacity-50 flex items-center gap-2"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isProcessing ? 'animate-spin' : ''}`} />
            <span>{isProcessing ? 'Validating & Ingesting...' : 'Validate & Ingest Dataset'}</span>
          </button>

          <span className="text-[11px] font-mono text-slate-500">
            Ingestion automatically triggers supervisory assessment re-calculation
          </span>
        </div>

        {/* Results Banner (Section 6) */}
        {uploadResult && (
          <div className="mt-4 p-4 rounded bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-cyan-300">Ingestion Validation Status</span>
              <Badge
                label={uploadResult.errors?.length > 0 ? 'ERRORS' : uploadResult.warnings?.length > 0 ? 'WARNINGS' : 'VALID'}
                variant={uploadResult.errors?.length > 0 ? 'critical' : 'success'}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div>File Name: <strong className="text-slate-200">{fileName}</strong></div>
              <div>Format: <strong className="text-slate-200">{format}</strong></div>
              <div>Records Ingested: <strong className="text-emerald-400">{uploadResult.recordCount}</strong></div>
              <div>Dataset ID: <strong className="text-cyan-400">{uploadResult.datasetId}</strong></div>
            </div>

            {uploadResult.errors?.length > 0 && (
              <div className="text-red-400 space-y-0.5">
                {uploadResult.errors.map((err: string, i: number) => (
                  <div key={i}>• {err}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
