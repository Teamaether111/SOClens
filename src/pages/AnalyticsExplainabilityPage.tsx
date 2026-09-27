import React from 'react';
import { BrainCircuit, Cpu, Scale, ScanEye, BarChart3, ShieldCheck, AlertCircle } from 'lucide-react';
import { Badge } from '../components/Badge';

export const AnalyticsExplainabilityPage: React.FC = () => {
  const engines = [
    {
      id: 'rule_engine',
      title: '1. Rule-Based Execution Gap Engine',
      icon: ShieldCheck,
      badge: 'Deterministic Rules',
      input: 'Case records, alert logs, investigator notes, timestamp sequences, and escalation registries.',
      method: 'Deterministic policy rule evaluation (Rules 1-7). Identifies violations of standard operational procedures, such as critical alerts closed without escalation or cases closed in <12 minutes.',
      output: 'Execution Gap and Investigation Weakness findings with expected vs observed workflow differentials.',
      limitations: 'Rules assess adherence to documented workflows. False positives may occur if valid verbal or external out-of-band escalations took place without logging.'
    },
    {
      id: 'negative_space',
      title: '2. Negative Space Engine (Absence of Telemetry)',
      icon: ScanEye,
      badge: 'Core Innovation',
      input: 'Asset criticalities, sensor telemetry status, expected threat vectors, and fleet scale.',
      method: 'Identifies evidence that SHOULD exist based on asset criticality and sector baseline, but DOES NOT exist (e.g. unmonitored critical assets, missing escalation dockets, silent periods).',
      output: 'Potential Monitoring Blind Spot and Negative-Space Gap findings with expected vs observed metrics.',
      limitations: 'Missing logs do not conclusively prove non-monitoring; temporary network collector disconnection or log shipper delays can simulate telemetry absence.'
    },
    {
      id: 'kpi_contradiction',
      title: '3. KPI-Evidence Contradiction Engine',
      icon: Scale,
      badge: 'Core Innovation',
      input: 'Signal A (Self-reported summary KPIs from CSE) and Signal B (Independently computed metrics from raw dockets & local TF-IDF vectorization).',
      method: 'Bi-directional threshold verification and local TF-IDF pairwise cosine similarity across investigation notes. Compares reported numbers directly against operational proof.',
      output: '"Reported metric is not sufficiently supported by available operational evidence" and boilerplate template review flags.',
      limitations: 'A contradiction does not confirm dishonesty or intentional misrepresentation; it highlights a discrepancy requiring supervisory context and audit clarification.'
    },
    {
      id: 'isolation_forest',
      title: '4. Isolation Forest Anomaly Engine',
      icon: Cpu,
      badge: 'Unsupervised ML',
      input: '8 operational metrics: closure_time, investigation_time, escalation_rate, repeat_alert_rate, monitoring_coverage, completeness, critical_ratio, reopen_rate.',
      method: 'Scikit-learn Isolation Forest algorithm. Recursively isolates samples in random feature projections. Calculates average path length c(n) and anomaly score s(x,n) = 2^(-E(h)/c(n)).',
      output: 'Unusual operational behaviour signals with feature-attribution z-score deviations.',
      limitations: 'Operational anomaly detection is NOT cyber attack detection. An outlier score simply flags unusual SOC behavior that deviates from mathematical cohort baselines.'
    },
    {
      id: 'peer_benchmark',
      title: '5. Peer Benchmarking Engine',
      icon: BarChart3,
      badge: 'Cohort Statistics',
      input: 'Operational metrics normalized across Sector and Criticality cohorts.',
      method: 'Non-parametric median and percentile calculations across peer groups. Flags entities deviating by >30 percentage points from cohort median.',
      output: 'Significant peer deviation signals highlighting operational variance.',
      limitations: 'Peer deviations do not automatically imply failure; an entity may possess bespoke compensating controls or higher operational efficiency than sectoral peers.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-6 space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800 uppercase tracking-widest flex items-center gap-1.5">
            <BrainCircuit className="w-3.5 h-3.5" />
            Transparent & Explainable AI
          </span>
          <span className="text-xs font-mono text-slate-400">Mathematical & Algorithmic Rigor</span>
        </div>
        <h1 className="text-xl md:text-2xl font-black font-mono text-slate-100">
          Supervisory Analytics & Explainability Framework
        </h1>
        <p className="text-xs font-mono text-slate-300 max-w-3xl leading-relaxed">
          SAT-SA rejects opaque "black box" conclusions. In critical infrastructure oversight, every supervisory signal must be transparent, verifiable, and explainable to human supervisors.
        </p>
      </div>

      {/* 5 Engines Explainability Cards */}
      <div className="space-y-4">
        {engines.map((eng) => {
          const Icon = eng.icon;
          return (
            <div
              key={eng.id}
              className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded bg-slate-950 flex items-center justify-center text-cyan-400 border border-slate-800">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold font-mono text-slate-100">
                    {eng.title}
                  </h3>
                </div>
                <Badge label={eng.badge} variant="info" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="space-y-1 bg-slate-950/60 p-3 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Input Telemetry</span>
                  <p className="text-slate-300">{eng.input}</p>
                </div>

                <div className="space-y-1 bg-slate-950/60 p-3 rounded border border-slate-800">
                  <span className="text-[10px] text-cyan-400 uppercase font-bold block">Analytical Method</span>
                  <p className="text-slate-300">{eng.method}</p>
                </div>

                <div className="space-y-1 bg-slate-950/60 p-3 rounded border border-slate-800">
                  <span className="text-[10px] text-emerald-400 uppercase font-bold block">Supervisory Output</span>
                  <p className="text-slate-300">{eng.output}</p>
                </div>

                <div className="space-y-1 bg-slate-950/60 p-3 rounded border border-amber-900/40">
                  <span className="text-[10px] text-amber-400 uppercase font-bold block flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Limitation & Interpretation Boundary
                  </span>
                  <p className="text-slate-300">{eng.limitations}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
