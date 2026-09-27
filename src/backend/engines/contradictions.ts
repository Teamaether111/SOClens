import { ReportedKPI, EvidenceMetric, KPIContradiction, Finding, ContradictionThresholds } from '../types';

export const DEFAULT_CONTRADICTION_THRESHOLDS: ContradictionThresholds = {
  slaComplianceThreshold: 0.95,
  remediationEvidenceThreshold: 0.50,
  closureRateThreshold: 0.90,
  investigationEvidenceThreshold: 0.60,
  repetitionRateThreshold: 0.85
};

export interface ContradictionEngineResult {
  contradictions: KPIContradiction[];
  findings: Finding[];
}

/**
 * KPI-Evidence Contradiction Engine
 * Compares independently computed evidence metrics against self-reported KPIs.
 * Uses conservative supervisory phrasing:
 * "Reported metric is not sufficiently supported by available operational evidence."
 */
export function runContradictionEngine(
  cseId: string,
  reportedKpi: ReportedKPI | undefined,
  evidenceMetric: EvidenceMetric | undefined,
  caseCount: number,
  thresholds: ContradictionThresholds = DEFAULT_CONTRADICTION_THRESHOLDS
): ContradictionEngineResult {
  const contradictions: KPIContradiction[] = [];
  const findings: Finding[] = [];
  const now = new Date().toISOString();

  if (!reportedKpi || !evidenceMetric) {
    return { contradictions, findings };
  }

  // CONTRADICTION RULE 1:
  // IF reported sla_compliance > 0.95 AND remediation_evidence < 0.50
  if (
    reportedKpi.slaCompliance >= thresholds.slaComplianceThreshold &&
    evidenceMetric.remediationEvidence < thresholds.remediationEvidenceThreshold
  ) {
    const kpiPct = Math.round(reportedKpi.slaCompliance * 100);
    const evPct = Math.round(evidenceMetric.remediationEvidence * 100);
    const gapPct = kpiPct - evPct;

    const contraId = `kpi_contra_sla_${cseId}_${reportedKpi.reportingCycle}`;
    const contradiction: KPIContradiction = {
      id: contraId,
      cseId,
      reportingCycle: reportedKpi.reportingCycle,
      kpiName: 'Reported SLA Compliance',
      kpiValue: reportedKpi.slaCompliance,
      evidenceMetricName: 'Remediation Evidence Ratio',
      evidenceValue: evidenceMetric.remediationEvidence,
      thresholdKpi: thresholds.slaComplianceThreshold,
      thresholdEvidence: thresholds.remediationEvidenceThreshold,
      confidence: 0.93,
      statement: 'Reported metric is not sufficiently supported by available operational evidence.',
      recommendedReview: 'Review remediation records supporting the reported SLA compliance figure.',
      status: 'NEW',
      createdAt: now
    };
    contradictions.push(contradiction);

    findings.push({
      id: `fnd_kpi_sla_${cseId}`,
      cseId,
      category: 'KPI_EVIDENCE_CONTRADICTION',
      severity: 'CRITICAL',
      title: 'Potential KPI-Evidence Contradiction: SLA Compliance vs Remediation Records',
      reason: `Entity reported ${kpiPct}% SLA compliance, but operational case records reflect remediation evidence in only ${evPct}% of incidents.`,
      expectedWorkflow: 'Reported SLA Compliance Metric aligns with documented technical remediation activity logs.',
      observedWorkflow: `Reported SLA: ${kpiPct}% vs Observed Remediation Evidence: ${evPct}% (Divergence of ${gapPct} percentage points)`,
      evidence: {
        contradictionId: contraId,
        reportedKpiName: 'SLA Compliance',
        reportedKpiValue: `${kpiPct}%`,
        evidenceMetricName: 'Remediation Evidence',
        evidenceMetricValue: `${evPct}%`,
        gap: `${gapPct}% gap`,
        remediationRecordsObserved: `${Math.round(evidenceMetric.remediationEvidence * caseCount)} / ${caseCount} cases`
      },
      confidence: 0.93,
      recommendedReview: 'Review remediation records supporting the reported SLA compliance figure.',
      status: 'NEW',
      createdAt: now
    });
  }

  // CONTRADICTION RULE 2:
  // IF reported closure_rate > 0.90 AND investigation_evidence < 0.60
  if (
    reportedKpi.closureRate >= thresholds.closureRateThreshold &&
    evidenceMetric.investigationEvidence < thresholds.investigationEvidenceThreshold
  ) {
    const kpiPct = Math.round(reportedKpi.closureRate * 100);
    const evPct = Math.round(evidenceMetric.investigationEvidence * 100);
    const gapPct = kpiPct - evPct;

    const contraId = `kpi_contra_cls_${cseId}_${reportedKpi.reportingCycle}`;
    const contradiction: KPIContradiction = {
      id: contraId,
      cseId,
      reportingCycle: reportedKpi.reportingCycle,
      kpiName: 'Reported Closure Rate',
      kpiValue: reportedKpi.closureRate,
      evidenceMetricName: 'Investigation Evidence Ratio (>50 words)',
      evidenceValue: evidenceMetric.investigationEvidence,
      thresholdKpi: thresholds.closureRateThreshold,
      thresholdEvidence: thresholds.investigationEvidenceThreshold,
      confidence: 0.89,
      statement: 'Reported metric is not sufficiently supported by available operational evidence.',
      recommendedReview: 'Review investigation docket logs for cases marked as resolved without substantive notes.',
      status: 'NEW',
      createdAt: now
    };
    contradictions.push(contradiction);

    findings.push({
      id: `fnd_kpi_cls_${cseId}`,
      cseId,
      category: 'KPI_EVIDENCE_CONTRADICTION',
      severity: 'HIGH',
      title: 'Potential KPI-Evidence Contradiction: Case Closure Rate vs Substantive Investigation Notes',
      reason: `Entity reported a high closure rate of ${kpiPct}%, yet only ${evPct}% of closed cases contain substantive investigation documentation (>50 words).`,
      expectedWorkflow: 'High Case Closure Rates accompanied by substantive investigative notes demonstrating root-cause triage.',
      observedWorkflow: `Reported Closure Rate: ${kpiPct}% vs Substantive Investigation Evidence: ${evPct}% (Divergence of ${gapPct} percentage points)`,
      evidence: {
        contradictionId: contraId,
        reportedKpiName: 'Case Closure Rate',
        reportedKpiValue: `${kpiPct}%`,
        evidenceMetricName: 'Investigation Evidence (>50 words)',
        evidenceMetricValue: `${evPct}%`,
        gap: `${gapPct}% gap`,
        casesWithDetailedNotes: `${Math.round(evidenceMetric.investigationEvidence * caseCount)} / ${caseCount}`
      },
      confidence: 0.89,
      recommendedReview: 'Review investigation docket logs for cases marked as resolved without substantive notes.',
      status: 'NEW',
      createdAt: now
    });
  }

  // CONTRADICTION RULE 3 — Boilerplate / Template Detection:
  // IF mean pairwise similarity (repetition_rate) > 0.85
  if (evidenceMetric.repetitionRate >= thresholds.repetitionRateThreshold) {
    const simPct = Math.round(evidenceMetric.repetitionRate * 100);
    const contraId = `kpi_contra_rep_${cseId}_${reportedKpi.reportingCycle}`;

    const contradiction: KPIContradiction = {
      id: contraId,
      cseId,
      reportingCycle: reportedKpi.reportingCycle,
      kpiName: 'Declared Independent Case Investigations',
      kpiValue: 1.0,
      evidenceMetricName: 'Investigation Note Text Similarity (TF-IDF Cosine)',
      evidenceValue: evidenceMetric.repetitionRate,
      thresholdKpi: 0.50,
      thresholdEvidence: thresholds.repetitionRateThreshold,
      confidence: 0.94,
      statement: 'Investigation notes show unusually high textual similarity, consistent with template-driven rather than case-specific review.',
      recommendedReview: 'Sample and manually review a subset of flagged investigation notes.',
      status: 'NEW',
      createdAt: now
    };
    contradictions.push(contradiction);

    findings.push({
      id: `fnd_kpi_tpl_${cseId}`,
      cseId,
      category: 'INVESTIGATION_WEAKNESS',
      severity: 'HIGH',
      title: 'Potential Superficial Review Pattern: High Textual Similarity Across Investigation Notes',
      reason: `TF-IDF pairwise cosine similarity across submitted investigation notes is ${simPct}%, indicating uniform boilerplate text across diverse incidents.`,
      expectedWorkflow: 'Incident-specific investigations reflecting unique telemetry, IP artifacts, and targeted remediation steps.',
      observedWorkflow: `Near-identical, template-driven investigation notes across cases (Mean Similarity: ${simPct}%)`,
      evidence: {
        contradictionId: contraId,
        meanCosineSimilarity: `${simPct}%`,
        caseDepthAverageWords: evidenceMetric.caseDepth,
        totalCasesEvaluated: caseCount
      },
      confidence: 0.94,
      recommendedReview: 'Sample and manually review a subset of flagged investigation notes.',
      status: 'NEW',
      createdAt: now
    });
  }

  return { contradictions, findings };
}
