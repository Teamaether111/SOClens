import React, { useState, useEffect } from 'react';
import { 
  UploadCloud, CheckCircle2, AlertTriangle, FileText, Database, 
  ArrowRight, Play, RefreshCw, FileSpreadsheet, Code2, Server 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { api } from '../api';
import { Badge } from '../components/Badge';

interface IngestionPageProps {
  onNavigate: (route: string) => void;
  onDataIngested?: () => void;
  onGenerateDemo?: () => Promise<void>;
}

export type SupportedFormat = 'JSON' | 'CSV' | 'XML' | 'SQL' | 'XLSX';

export const IngestionPage: React.FC<IngestionPageProps> = ({ 
  onNavigate, 
  onDataIngested,
  onGenerateDemo 
}) => {
  const [dataStatus, setDataStatus] = useState<any>(null);
  const [uploadText, setUploadText] = useState('');
  const [fileName, setFileName] = useState('quarterly_telemetry_feed.json');
  const [format, setFormat] = useState<SupportedFormat>('JSON');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);

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
    const lowerName = file.name.toLowerCase();

    if (lowerName.endsWith('.csv')) {
      setFormat('CSV');
      const reader = new FileReader();
      reader.onload = (event) => setUploadText((event.target?.result as string) || '');
      reader.readAsText(file);
    } else if (lowerName.endsWith('.xml')) {
      setFormat('XML');
      const reader = new FileReader();
      reader.onload = (event) => setUploadText((event.target?.result as string) || '');
      reader.readAsText(file);
    } else if (lowerName.endsWith('.sql') || lowerName.endsWith('.db')) {
      setFormat('SQL');
      const reader = new FileReader();
      reader.onload = (event) => setUploadText((event.target?.result as string) || '');
      reader.readAsText(file);
    } else if (lowerName.endsWith('.xlsx')) {
      setFormat('XLSX');
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(firstSheet);
          setUploadText(JSON.stringify(rows, null, 2));
        } catch (err: any) {
          // Fallback to base64 encoding if binary conversion fails
          reader.readAsDataURL(file);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setFormat('JSON');
      const reader = new FileReader();
      reader.onload = (event) => setUploadText((event.target?.result as string) || '');
      reader.readAsText(file);
    }
  };

  const loadSampleByFormat = (fmt: SupportedFormat) => {
    setFormat(fmt);
    if (fmt === 'JSON') {
      const sample = [
        {
          case_id: "CAS-INGEST-201",
          entity_id: "CSE-11",
          activity: "Critical Telemetry Anomaly - Hydroelectric SCADA Unit 3",
          timestamp: "2026-09-18T10:14:00Z",
          severity: "CRITICAL",
          asset_id: "AST-1011",
          actor_id: "SOC-ENG-42"
        },
        {
          case_id: "CAS-INGEST-202",
          entity_id: "CSE-11",
          activity: "Primary Turbine Relay Communication Drop",
          timestamp: "2026-09-18T11:05:00Z",
          severity: "HIGH",
          asset_id: "AST-1011",
          actor_id: "SOC-ENG-42"
        },
        {
          case_id: "CAS-INGEST-203",
          entity_id: "CSE-02",
          activity: "Core Payment Settlement Gateway TLS Handshake Timeout",
          timestamp: "2026-09-18T12:30:00Z",
          severity: "CRITICAL",
          asset_id: "AST-1002",
          actor_id: "NET-SEC-10"
        }
      ];
      setUploadText(JSON.stringify(sample, null, 2));
      setFileName('critical_infrastructure_cases_feed.json');
    } else if (fmt === 'CSV') {
      const csv = `case_id,entity_id,activity,timestamp,severity,asset_id,actor_id\nCAS-CSV-301,CSE-01,SCADA Telemetry Dropout on Feeder 14,2026-09-19T08:15:00Z,CRITICAL,AST-1001,ANALYST-01\nCAS-CSV-302,CSE-01,Turbine Vibration Sensor Calibration Warning,2026-09-19T09:22:00Z,HIGH,AST-1001,ANALYST-01\nCAS-CSV-303,CSE-03,Interbank Clearing Gateway TLS Anomaly,2026-09-19T10:45:00Z,CRITICAL,AST-1003,ANALYST-04`;
      setUploadText(csv);
      setFileName('cse_periodic_cases_export.csv');
    } else if (fmt === 'XML') {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<export>
  <system>Legacy SIEM Case Docket Archive</system>
  <cases>
    <case>
      <case_id>CAS-XML-401</case_id>
      <entity_id>CSE-04</entity_id>
      <activity>Air Traffic Radar Terminal Feed Glitch</activity>
      <timestamp>2026-09-20T07:12:00Z</timestamp>
      <severity>CRITICAL</severity>
      <asset_id>AST-1004</asset_id>
      <actor_id>RADAR-TOC-01</actor_id>
    </case>
    <case>
      <case_id>CAS-XML-402</case_id>
      <entity_id>CSE-04</entity_id>
      <activity>Ground ADS-B Receiver Heartbeat Missing</activity>
      <timestamp>2026-09-20T08:30:00Z</timestamp>
      <severity>HIGH</severity>
      <asset_id>AST-1004</asset_id>
      <actor_id>RADAR-TOC-01</actor_id>
    </case>
  </cases>
</export>`;
      setUploadText(xml);
      setFileName('legacy_siem_dockets_export.xml');
    } else if (fmt === 'SQL') {
      const sql = `-- Case Management Database Dump
INSERT INTO cases (case_id, entity_id, activity, timestamp, severity, asset_id, actor_id) VALUES
('CAS-SQL-601', 'CSE-05', 'Metropolitan Grid SCADA Control Room Disconnect', '2026-09-21T06:10:00Z', 'CRITICAL', 'AST-1005', 'GRID-OPS-07'),
('CAS-SQL-602', 'CSE-05', 'Substation Telemetry Multiplexer Fault', '2026-09-21T07:45:00Z', 'HIGH', 'AST-1005', 'GRID-OPS-07');`;
      setUploadText(sql);
      setFileName('cse_case_management_dump.sql');
    } else if (fmt === 'XLSX') {
      const rows = [
        {
          case_id: "CAS-XLSX-701",
          entity_id: "CSE-06",
          activity: "Core Cellular MSC Authentication Signaling Spike",
          timestamp: "2026-09-22T09:14:00Z",
          severity: "CRITICAL",
          asset_id: "AST-1006",
          actor_id: "TELCO-SOC-02"
        },
        {
          case_id: "CAS-XLSX-702",
          entity_id: "CSE-06",
          activity: "Optical Transponder Frame Error Rate Exceeded",
          timestamp: "2026-09-22T10:00:00Z",
          severity: "HIGH",
          asset_id: "AST-1006",
          actor_id: "TELCO-SOC-02"
        }
      ];
      setUploadText(JSON.stringify(rows, null, 2));
      setFileName('operational_case_tracker_q3.xlsx');
    }
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

  const handleLoadDemoDataset = async () => {
    setIsGeneratingDemo(true);
    setDemoNotice(null);
    try {
      if (onGenerateDemo) {
        await onGenerateDemo();
      } else {
        await api.generateDemoData();
      }
      await loadStatus();
      setDemoNotice('Synthetic evaluation dataset successfully loaded (20 CSEs, 500+ assets, 10,000+ alerts, planted contradictions).');
    } catch (err: any) {
      alert(`Demo generation failed: ${err.message}`);
    } finally {
      setIsGeneratingDemo(false);
    }
  };

  const pipelineSteps = [
    { label: 'UPLOAD', desc: 'Secure payload ingest' },
    { label: 'VALIDATE', desc: 'Schema & type check' },
    { label: 'NORMALIZE', desc: 'Canonical schema' },
    { label: 'STORE', desc: 'PostgreSQL persistence' },
    { label: 'FEATURE ENG.', desc: 'Independent derivation' },
    { label: 'ANALYZE', desc: 'Rules & Isolation Forest' },
    { label: 'SCORE', desc: '0-100 Attention score' },
    { label: 'READY', desc: 'Supervisory review queue' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-6 space-y-2 transition-colors">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase tracking-widest flex items-center gap-1.5">
            <UploadCloud className="w-3.5 h-3.5" />
            Air-Gapped Ingestion Hub
          </span>
          <span className="text-xs font-mono text-slate-400">Periodic Case Management Batch Feeds</span>
        </div>
        <h1 className="text-xl md:text-2xl font-black font-mono text-slate-100">
          Data Ingestion & Telemetry Normalization
        </h1>
        <p className="text-xs font-mono text-slate-300 max-w-3xl leading-relaxed">
          Supports periodic JSON, CSV, XML, SQL database exports, or XLSX batch files containing alerts, cases, and self-reported KPIs.
        </p>
      </div>

      {/* Demo / Evaluation Mode Section (Change 2) */}
      <div className="rounded-lg border-2 border-dashed border-cyan-800/60 bg-slate-950/70 p-5 space-y-3 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800 uppercase tracking-widest flex items-center gap-1">
                <Database className="w-3 h-3 text-amber-400" />
                Demo / Evaluation Mode
              </span>
              <span className="text-xs font-mono text-slate-300 font-semibold">Synthetic Evaluation Environment</span>
            </div>
            <p className="text-[11px] font-mono text-slate-400">
              For evaluation and demonstration only. Production use requires real CSE submission files.
            </p>
          </div>

          <button
            onClick={handleLoadDemoDataset}
            disabled={isGeneratingDemo}
            className="px-4 py-2 rounded text-xs font-mono font-bold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-700/60 shadow-sm transition disabled:opacity-50 flex items-center gap-2 shrink-0"
          >
            <Database className={`w-3.5 h-3.5 text-cyan-400 ${isGeneratingDemo ? 'animate-spin' : ''}`} />
            <span>{isGeneratingDemo ? 'Loading Sample Dataset...' : 'Load Sample Dataset (Demo Mode)'}</span>
          </button>
        </div>

        {demoNotice && (
          <div className="p-3 rounded bg-emerald-950/70 border border-emerald-800 text-xs font-mono text-emerald-300 flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{demoNotice}</span>
          </div>
        )}
      </div>

      {/* Processing Pipeline Flow */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 transition-colors">
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
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded">
            <span className="text-[10px] text-slate-500 uppercase block">Entities</span>
            <span className="text-lg font-bold text-slate-100 mt-1 block">{dataStatus.totalCses}</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded">
            <span className="text-[10px] text-slate-500 uppercase block">Total Assets</span>
            <span className="text-lg font-bold text-slate-100 mt-1 block">{dataStatus.totalAssets}</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded">
            <span className="text-[10px] text-slate-500 uppercase block">Total Alerts</span>
            <span className="text-lg font-bold text-cyan-400 mt-1 block">{dataStatus.totalAlerts?.toLocaleString()}</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded">
            <span className="text-[10px] text-slate-500 uppercase block">Case Dockets</span>
            <span className="text-lg font-bold text-amber-400 mt-1 block">{dataStatus.totalCases?.toLocaleString()}</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded">
            <span className="text-[10px] text-slate-500 uppercase block">Investigations</span>
            <span className="text-lg font-bold text-slate-200 mt-1 block">{dataStatus.totalInvestigations?.toLocaleString()}</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded">
            <span className="text-[10px] text-slate-500 uppercase block">Escalations</span>
            <span className="text-lg font-bold text-emerald-400 mt-1 block">{dataStatus.totalEscalations?.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Upload Interface */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-6 space-y-5 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-cyan-400" /> Upload Critical Sector Telemetry Batch
            </h2>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              Supports periodic JSON, CSV, XML, SQL database exports, or XLSX batch files containing alerts, cases, and self-reported KPIs.
            </p>
          </div>

          {/* Quick Sample Selector */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono text-slate-400 mr-1">Load Sample:</span>
            {(['JSON', 'CSV', 'XML', 'SQL', 'XLSX'] as SupportedFormat[]).map((fmt) => (
              <button
                key={fmt}
                onClick={() => loadSampleByFormat(fmt)}
                className={`px-2 py-1 text-[10px] font-mono rounded border transition ${
                  format === fmt 
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-700 font-bold' 
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        {/* File Picker & Format Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. Choose File */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-300 font-semibold block">
              1. Choose File (.csv, .json, .xml, .sql, .db, .xlsx):
            </label>
            <input
              type="file"
              accept=".csv,.json,.xml,.sql,.db,.xlsx"
              onChange={handleFileUpload}
              className="block w-full text-xs font-mono text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-mono file:font-semibold file:bg-cyan-950 file:text-cyan-300 hover:file:bg-cyan-900 cursor-pointer"
            />
            <div className="text-[10px] font-mono text-slate-500">
              Active File: <strong className="text-slate-300">{fileName}</strong> ({format})
            </div>
          </div>

          {/* 2. Review Ingest Format (All 5 Supported Options) */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-300 font-semibold block">
              2. Review Ingest Format (Offline Batch Feeds Only):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs font-mono text-slate-300">
              <label className="flex items-center gap-1.5 cursor-pointer p-1.5 rounded hover:bg-slate-950">
                <input
                  type="radio"
                  name="format"
                  value="CSV"
                  checked={format === 'CSV'}
                  onChange={() => setFormat('CSV')}
                  className="accent-cyan-500"
                />
                <span>CSV — Tabular Export</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer p-1.5 rounded hover:bg-slate-950">
                <input
                  type="radio"
                  name="format"
                  value="JSON"
                  checked={format === 'JSON'}
                  onChange={() => setFormat('JSON')}
                  className="accent-cyan-500"
                />
                <span>JSON — Schema Feed</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer p-1.5 rounded hover:bg-slate-950">
                <input
                  type="radio"
                  name="format"
                  value="XML"
                  checked={format === 'XML'}
                  onChange={() => setFormat('XML')}
                  className="accent-cyan-500"
                />
                <span>XML — Structured Export</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer p-1.5 rounded hover:bg-slate-950">
                <input
                  type="radio"
                  name="format"
                  value="SQL"
                  checked={format === 'SQL'}
                  onChange={() => setFormat('SQL')}
                  className="accent-cyan-500"
                />
                <span>SQL / DB Dump (.sql/.db)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer p-1.5 rounded hover:bg-slate-950">
                <input
                  type="radio"
                  name="format"
                  value="XLSX"
                  checked={format === 'XLSX'}
                  onChange={() => setFormat('XLSX')}
                  className="accent-cyan-500"
                />
                <span>XLSX — Spreadsheet Export</span>
              </label>
            </div>
          </div>
        </div>

        {/* Payload Preview */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono text-slate-400 font-medium">
              Payload Text Content Preview:
            </label>
            <span className="text-[10px] font-mono text-slate-500">
              Canonical Schema: case_id, entity_id, activity, timestamp, severity, asset_id, actor_id
            </span>
          </div>
          <textarea
            rows={8}
            value={uploadText}
            onChange={e => setUploadText(e.target.value)}
            placeholder="Paste raw file payload (JSON array, CSV rows, XML dockets, SQL INSERT dump, or XLSX JSON representation)..."
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

          <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
            Conversion to canonical schema triggers supervisory assessment recalculation
          </span>
        </div>

        {/* Ingestion Validation Results Banner */}
        {uploadResult && (
          <div className="mt-4 p-4 rounded bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono transition-colors">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-cyan-300">Ingestion Validation Status</span>
              <Badge
                label={uploadResult.errors?.length > 0 ? 'VALIDATION FAILURE' : uploadResult.warnings?.length > 0 ? 'WARNINGS' : 'CANONICAL SCHEMA VALID'}
                variant={uploadResult.errors?.length > 0 ? 'critical' : 'success'}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div>File Name: <strong className="text-slate-200">{fileName}</strong></div>
              <div>Detected Format: <strong className="text-slate-200">{format}</strong></div>
              <div>Canonical Records: <strong className="text-emerald-400">{uploadResult.recordCount}</strong></div>
              <div>Dataset ID: <strong className="text-cyan-400">{uploadResult.datasetId}</strong></div>
            </div>

            {uploadResult.errors?.length > 0 ? (
              <div className="p-3 bg-red-950/70 border border-red-800 rounded text-red-300 space-y-1 mt-2">
                <div className="font-bold flex items-center gap-1.5 text-red-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Specific Parsing & Schema Errors:
                </div>
                {uploadResult.errors.map((err: string, i: number) => (
                  <div key={i} className="pl-5 text-[11px]">• {err}</div>
                ))}
              </div>
            ) : (
              <div className="p-2.5 bg-emerald-950/60 border border-emerald-800 rounded text-emerald-300 flex items-center gap-2 text-[11px]">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Successfully normalized into canonical schema and executed supervisory analytics.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
