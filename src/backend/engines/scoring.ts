import { Score, ScoringWeights, Finding, Anomaly, KPIContradiction } from '../types';
import { CSEPeerDeviation } from './benchmarking';

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  executionGap: 0.15,
  investigationWeakness: 0.10,
  escalationWeakness: 0.10,
  negativeSpace: 0.15,
  kpiContradiction: 0.15,
  anomaly: 0.15,
  peerDeviation: 0.10,
  historicalDeterioration: 0.10
};

export function computeAttentionScore(
  cseId: string,
  reportingCycle: string,
  findings: Finding[],
  anomaly: Anomaly | undefined,
  contradictions: KPIContradiction[],
  deviations: CSEPeerDeviation[],
  hasHistoricalDeterioration: boolean,
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS
): Score {
  const cseFindings = findings.filter(f => f.cseId === cseId);

  // 1. Execution Gap Component (up to 20 points)
  const execGapFindings = cseFindings.filter(f => f.category === 'EXECUTION_GAP');
  let execRaw = 0;
  for (const f of execGapFindings) {
    execRaw += f.severity === 'CRITICAL' ? 6 : f.severity === 'HIGH' ? 4 : 2;
  }
  const execContribution = Math.min(20, Math.round(execRaw * (weights.executionGap / 0.15)));

  // 2. Investigation Weakness Component (up to 15 points)
  const invFindings = cseFindings.filter(f => f.category === 'INVESTIGATION_WEAKNESS');
  let invRaw = 0;
  for (const f of invFindings) {
    invRaw += f.severity === 'CRITICAL' ? 5 : f.severity === 'HIGH' ? 3 : 1.5;
  }
  const invContribution = Math.min(15, Math.round(invRaw * (weights.investigationWeakness / 0.10)));

  // 3. Escalation Weakness Component (up to 15 points)
  const escFindings = cseFindings.filter(f => f.category === 'ESCALATION_WEAKNESS');
  let escRaw = 0;
  for (const f of escFindings) {
    escRaw += f.severity === 'CRITICAL' ? 6 : f.severity === 'HIGH' ? 4 : 2;
  }
  if (execGapFindings.some(f => f.id.includes('rule1'))) {
    escRaw += 8;
  }
  const escContribution = Math.min(15, Math.round(escRaw * (weights.escalationWeakness / 0.10)));

  // 4. Negative Space Component (up to 18 points)
  const nsFindings = cseFindings.filter(f => f.category === 'NEGATIVE_SPACE');
  let nsRaw = 0;
  for (const f of nsFindings) {
    nsRaw += f.severity === 'CRITICAL' ? 8 : f.severity === 'HIGH' ? 5 : 2.5;
  }
  const nsContribution = Math.min(18, Math.round(nsRaw * (weights.negativeSpace / 0.15)));

  // 5. KPI-Evidence Contradiction Component (up to 18 points)
  const cseContradictions = contradictions.filter(c => c.cseId === cseId);
  let contraRaw = 0;
  for (const c of cseContradictions) {
    contraRaw += 8 * (c.confidence || 0.9);
  }
  const contraContribution = Math.min(18, Math.round(contraRaw * (weights.kpiContradiction / 0.15)));

  // 6. Anomaly Component (from Isolation Forest, up to 15 points)
  let anomalyRaw = 0;
  if (anomaly) {
    if (anomaly.isAnomaly) {
      anomalyRaw = Math.min(15, Math.round(anomaly.anomalyScore * 16));
    } else {
      anomalyRaw = Math.round(anomaly.anomalyScore * 6);
    }
  }
  const anomalyContribution = Math.min(15, Math.round(anomalyRaw * (weights.anomaly / 0.15)));

  // 7. Peer Deviation Component (up to 12 points)
  let peerRaw = 0;
  for (const d of deviations) {
    if (d.isSignificant) {
      peerRaw += Math.min(6, Math.round(Math.abs(d.deviationPoints) / 7));
    }
  }
  const peerContribution = Math.min(12, Math.round(peerRaw * (weights.peerDeviation / 0.10)));

  // 8. Historical Deterioration Component (up to 10 points)
  const histContribution = hasHistoricalDeterioration ? Math.round(10 * (weights.historicalDeterioration / 0.10)) : 0;

  // Total composite attention score (0 - 100)
  const overallScore = Math.max(
    0,
    Math.min(
      100,
      execContribution +
      invContribution +
      escContribution +
      nsContribution +
      contraContribution +
      anomalyContribution +
      peerContribution +
      histContribution
    )
  );

  let tier: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (overallScore >= 81) tier = 'CRITICAL';
  else if (overallScore >= 61) tier = 'HIGH';
  else if (overallScore >= 31) tier = 'MODERATE';

  // Radar capabilities (100 = optimal, lower = needs attention)
  const radarCapabilities = {
    threatDetection: Math.max(20, Math.min(98, 95 - (nsContribution * 2.2) - (cseFindings.filter(f => f.category === 'DETECTION_WEAKNESS').length * 20))),
    investigation: Math.max(20, Math.min(98, 95 - (invContribution * 3.5))),
    escalation: Math.max(20, Math.min(98, 95 - (escContribution * 3.5))),
    incidentResponse: Math.max(20, Math.min(98, 95 - (execContribution * 3.0))),
    securityOperations: Math.max(20, Math.min(98, 95 - (anomalyContribution * 3.0))),
    governanceOversight: Math.max(20, Math.min(98, 95 - (contraContribution * 3.0))),
    operationalDiscipline: Math.max(20, Math.min(98, 95 - ((execContribution + invContribution) * 1.8))),
    cyberResilience: Math.max(20, Math.min(98, 95 - (overallScore * 0.7)))
  };

  return {
    id: `score_${cseId}_${reportingCycle}`,
    cseId,
    reportingCycle,
    overallScore,
    tier,
    breakdown: {
      executionGap: execContribution,
      investigationWeakness: invContribution,
      escalationWeakness: escContribution,
      negativeSpace: nsContribution,
      kpiContradiction: contraContribution,
      anomaly: anomalyContribution,
      peerDeviation: peerContribution,
      historicalDeterioration: histContribution
    },
    radarCapabilities,
    computedAt: new Date().toISOString()
  };
}
