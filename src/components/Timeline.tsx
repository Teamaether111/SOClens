import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, ShieldAlert, ArrowRight } from 'lucide-react';

interface TimelineProps {
  caseData: {
    createdAt: string;
    acknowledgedAt: string | null;
    investigationStartedAt: string | null;
    escalatedAt: string | null;
    closedAt: string | null;
    severity: string;
    status: string;
  };
  timings: {
    acknowledgementMinutes: number | null;
    investigationDurationMinutes: number | null;
    escalationDelayMinutes: number | null;
    totalClosureMinutes: number | null;
  };
}

export const Timeline: React.FC<TimelineProps> = ({ caseData, timings }) => {
  const steps = [
    {
      id: 'alert_created',
      label: 'Alert Ingested / Case Created',
      timestamp: caseData.createdAt,
      completed: true,
      duration: 'T+0m',
      icon: Clock,
      status: 'complete'
    },
    {
      id: 'acknowledged',
      label: 'Operator Acknowledged',
      timestamp: caseData.acknowledgedAt,
      completed: !!caseData.acknowledgedAt,
      duration: timings.acknowledgementMinutes !== null ? `+${timings.acknowledgementMinutes}m` : 'Pending',
      icon: CheckCircle2,
      status: caseData.acknowledgedAt ? 'complete' : 'missing'
    },
    {
      id: 'investigation',
      label: 'Investigation Commenced',
      timestamp: caseData.investigationStartedAt,
      completed: !!caseData.investigationStartedAt,
      duration: timings.investigationDurationMinutes !== null ? `Dur: ${timings.investigationDurationMinutes}m` : 'None',
      icon: AlertTriangle,
      status: caseData.investigationStartedAt ? 'complete' : 'missing'
    },
    {
      id: 'escalation',
      label: 'External Escalation (CERT/NCIIPC)',
      timestamp: caseData.escalatedAt,
      completed: !!caseData.escalatedAt,
      duration: timings.escalationDelayMinutes !== null ? `+${timings.escalationDelayMinutes}m` : (caseData.severity === 'CRITICAL' ? 'OMITTED GAP' : 'N/A'),
      icon: ShieldAlert,
      status: caseData.escalatedAt ? 'complete' : (caseData.severity === 'CRITICAL' ? 'gap' : 'skipped')
    },
    {
      id: 'closure',
      label: 'Incident Resolution & Closure',
      timestamp: caseData.closedAt,
      completed: !!caseData.closedAt,
      duration: timings.totalClosureMinutes !== null ? `Total: ${timings.totalClosureMinutes}m` : 'Open',
      icon: CheckCircle2,
      status: caseData.closedAt ? 'complete' : 'in_progress'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="relative pl-6 border-l-2 border-slate-800 space-y-8 before:absolute before:top-0 before:bottom-0 before:left-[-2px] before:w-[2px] before:bg-gradient-to-b before:from-cyan-500 before:via-blue-600 before:to-slate-800">
        {steps.map((step) => {
          const isGap = step.status === 'gap';
          const isMissing = step.status === 'missing';
          const isComplete = step.status === 'complete';

          return (
            <div key={step.id} className="relative group">
              {/* Dot */}
              <div
                className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                  isGap
                    ? 'bg-red-950 border-red-500 ring-4 ring-red-500/20'
                    : isMissing
                    ? 'bg-amber-950 border-amber-500'
                    : isComplete
                    ? 'bg-cyan-950 border-cyan-400'
                    : 'bg-slate-900 border-slate-600'
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    isGap ? 'bg-red-400 animate-ping' : isComplete ? 'bg-cyan-400' : 'bg-slate-500'
                  }`}
                />
              </div>

              {/* Content */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded p-3.5 hover:border-slate-700 transition">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-200">{step.label}</span>
                    {isGap && (
                      <span className="px-2 py-0.5 text-[10px] uppercase font-mono font-bold bg-red-950 text-red-400 border border-red-800 rounded">
                        Potential Execution Gap
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800/80 text-cyan-300">
                    {step.duration}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                  <span>
                    {step.timestamp ? new Date(step.timestamp).toLocaleString() : 'No timestamp recorded in telemetry'}
                  </span>
                  <span className="font-mono text-[11px] text-slate-500 capitalize">{step.status}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expected vs Observed Summary Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="bg-slate-900/80 border border-emerald-900/40 rounded p-4">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-semibold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Mandated Standard Workflow
          </div>
          <div className="text-xs text-slate-300 space-y-1 font-mono leading-relaxed">
            <div className="flex items-center gap-1.5">
              <span>Alert</span> <ArrowRight className="w-3 h-3 text-slate-500" />
              <span>Ack (&lt;15m)</span> <ArrowRight className="w-3 h-3 text-slate-500" />
              <span>Forensic Investigation</span> <ArrowRight className="w-3 h-3 text-slate-500" />
              <span>Multi-tier Escalation</span> <ArrowRight className="w-3 h-3 text-slate-500" />
              <span>Containment</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-cyan-900/40 rounded p-4">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-semibold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            Observed Operational Workflow
          </div>
          <div className="text-xs text-slate-300 font-mono">
            {caseData.escalatedAt ? (
              <span className="text-emerald-300">Alert → Ack → Investigation → Escalated → Resolution Logged</span>
            ) : caseData.severity === 'CRITICAL' ? (
              <span className="text-amber-300">Alert → Ack → Closed (Missing Escalation Record)</span>
            ) : (
              <span>Alert → Local Triage → Closed (Standard non-escalated queue)</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
