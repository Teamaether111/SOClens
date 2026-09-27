import { Case, Alert, Asset, Investigation, Escalation, EvidenceMetric } from '../types';
import { computeMeanPairwiseSimilarity } from '../tfidf';

export interface CSEFeatures {
  cseId: string;
  totalAlerts: number;
  criticalAlerts: number;
  highAlerts: number;
  totalCases: number;
  investigationRate: number;
  escalationRate: number;
  medianAcknowledgementTimeMinutes: number;
  medianInvestigationTimeMinutes: number;
  medianClosureTimeMinutes: number;
  repeatAlertRate: number;
  caseReopenRate: number;
  monitoringCoverage: number;
  criticalAssetCoverage: number;
  investigationCompleteness: number;
  escalationDelayMinutes: number;
  severityWeightedWorkload: number;
  criticalAlertRatio: number;
}

function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function countWords(str: string): number {
  if (!str) return 0;
  return str.trim().split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Computes features from raw database records for a single CSE
 */
export function computeCSEFeatures(
  cseId: string,
  cseAssets: Asset[],
  cseAlerts: Alert[],
  cseCases: Case[],
  cseInvestigations: Investigation[],
  cseEscalations: Escalation[]
): CSEFeatures {
  const totalAlerts = cseAlerts.length;
  const criticalAlerts = cseAlerts.filter(a => a.severity === 'CRITICAL').length;
  const highAlerts = cseAlerts.filter(a => a.severity === 'HIGH').length;
  const totalCases = cseCases.length;

  const investigatedCasesCount = cseInvestigations.length;
  const investigationRate = totalCases > 0 ? investigatedCasesCount / totalCases : 0;

  const escalatedCasesCount = cseEscalations.length;
  const escalationRate = totalCases > 0 ? escalatedCasesCount / totalCases : 0;

  // Timings
  const ackTimes: number[] = [];
  const invTimes: number[] = [];
  const closureTimes: number[] = [];
  const escDelays: number[] = [];

  for (const c of cseCases) {
    const created = new Date(c.createdAt).getTime();

    if (c.acknowledgedAt) {
      const ack = new Date(c.acknowledgedAt).getTime();
      ackTimes.push(Math.max(0, (ack - created) / 60000));
    }

    if (c.investigationStartedAt && c.closedAt) {
      const invStart = new Date(c.investigationStartedAt).getTime();
      const closed = new Date(c.closedAt).getTime();
      invTimes.push(Math.max(0, (closed - invStart) / 60000));
    }

    if (c.closedAt) {
      const closed = new Date(c.closedAt).getTime();
      closureTimes.push(Math.max(0, (closed - created) / 60000));
    }

    if (c.escalatedAt) {
      const esc = new Date(c.escalatedAt).getTime();
      escDelays.push(Math.max(0, (esc - created) / 60000));
    }
  }

  const medianAcknowledgementTimeMinutes = Number(calculateMedian(ackTimes).toFixed(1));
  const medianInvestigationTimeMinutes = Number(calculateMedian(invTimes).toFixed(1));
  const medianClosureTimeMinutes = Number(calculateMedian(closureTimes).toFixed(1));
  const escalationDelayMinutes = Number(calculateMedian(escDelays).toFixed(1));

  // Repeat Alert Rate: alerts with the same category on the same asset within the period
  const assetAlertMap = new Map<string, number>();
  for (const a of cseAlerts) {
    const key = `${a.assetId}_${a.category}`;
    assetAlertMap.set(key, (assetAlertMap.get(key) || 0) + 1);
  }
  let repeatAlertCount = 0;
  for (const count of assetAlertMap.values()) {
    if (count > 1) {
      repeatAlertCount += (count - 1);
    }
  }
  const repeatAlertRate = totalAlerts > 0 ? Number((repeatAlertCount / totalAlerts).toFixed(3)) : 0;

  // Case reopen rate
  const reopenedCases = cseCases.filter(c => (c.reopenedCount || 0) > 0).length;
  const caseReopenRate = totalCases > 0 ? Number((reopenedCases / totalCases).toFixed(3)) : 0;

  // Monitoring Coverage: Monitored assets vs total assets
  const monitoredAssets = cseAssets.filter(a => a.isMonitored).length;
  const monitoringCoverage = cseAssets.length > 0 ? Number((monitoredAssets / cseAssets.length).toFixed(3)) : 1.0;

  const criticalAssets = cseAssets.filter(a => a.criticality === 'CRITICAL');
  const monitoredCriticalAssets = criticalAssets.filter(a => a.isMonitored).length;
  const criticalAssetCoverage = criticalAssets.length > 0 
    ? Number((monitoredCriticalAssets / criticalAssets.length).toFixed(3)) 
    : 1.0;

  // Investigation completeness (has notes + artifacts)
  const completeInvestigations = cseInvestigations.filter(i => 
    i.notes && i.notes.trim().length > 30 && i.evidenceArtifactCount > 0
  ).length;
  const investigationCompleteness = totalCases > 0 
    ? Number((completeInvestigations / totalCases).toFixed(3)) 
    : 0;

  // Severity weighted workload
  const severityWeightedWorkload = (criticalAlerts * 4) + (highAlerts * 2) + ((totalAlerts - criticalAlerts - highAlerts) * 1);
  const criticalAlertRatio = totalAlerts > 0 ? Number((criticalAlerts / totalAlerts).toFixed(3)) : 0;

  return {
    cseId,
    totalAlerts,
    criticalAlerts,
    highAlerts,
    totalCases,
    investigationRate: Number(investigationRate.toFixed(3)),
    escalationRate: Number(escalationRate.toFixed(3)),
    medianAcknowledgementTimeMinutes,
    medianInvestigationTimeMinutes,
    medianClosureTimeMinutes,
    repeatAlertRate,
    caseReopenRate,
    monitoringCoverage,
    criticalAssetCoverage,
    investigationCompleteness,
    escalationDelayMinutes,
    severityWeightedWorkload,
    criticalAlertRatio
  };
}

/**
 * Computes Evidence_Metrics independently from raw case & investigation records
 * NEVER reads from or is influenced by reported_kpis!
 */
export function computeEvidenceMetrics(
  cseId: string,
  reportingCycle: string,
  cseCases: Case[],
  cseInvestigations: Investigation[]
): EvidenceMetric {
  const totalCases = cseCases.length;

  if (totalCases === 0) {
    return {
      id: `evm_${cseId}_${reportingCycle}`,
      cseId,
      reportingCycle,
      investigationEvidence: 0,
      remediationEvidence: 0,
      caseDepth: 0,
      repetitionRate: 0,
      computedAt: new Date().toISOString()
    };
  }

  // investigation_evidence: ratio of cases with notes > 50 words to total cases
  let detailedNotesCount = 0;
  let totalWordCount = 0;
  const noteTexts: string[] = [];

  for (const inv of cseInvestigations) {
    const notes = inv.notes || '';
    const wc = countWords(notes);
    totalWordCount += wc;
    if (wc >= 50) {
      detailedNotesCount++;
    }
    if (notes.trim().length > 0) {
      noteTexts.push(notes);
    }
  }

  const investigationEvidence = totalCases > 0 ? Number((detailedNotesCount / totalCases).toFixed(3)) : 0;
  const caseDepth = cseInvestigations.length > 0 ? Number((totalWordCount / cseInvestigations.length).toFixed(1)) : 0;

  // remediation_evidence: ratio of cases with remediation record to total cases
  const remediationRecordsCount = cseInvestigations.filter(i => i.hasRemediationRecord).length;
  const remediationEvidence = totalCases > 0 ? Number((remediationRecordsCount / totalCases).toFixed(3)) : 0;

  // repetition_rate: local TF-IDF pairwise cosine similarity across this CSE's own notes
  const tfidfResult = computeMeanPairwiseSimilarity(noteTexts);
  const repetitionRate = tfidfResult.meanSimilarity;

  return {
    id: `evm_${cseId}_${reportingCycle}`,
    cseId,
    reportingCycle,
    investigationEvidence,
    remediationEvidence,
    caseDepth,
    repetitionRate,
    computedAt: new Date().toISOString()
  };
}
