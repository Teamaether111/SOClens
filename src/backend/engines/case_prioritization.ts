import { Case, Finding, CSEEntity, Score } from '../types';

export interface PrioritizedCase extends Case {
  rank: number;
  priorityScore: number;
  cseName: string;
  cseCode: string;
  associatedFindingsCount: number;
  topFindingTitle: string;
  topFindingCategory: string;
  urgencyReason: string;
}

export function prioritizeCases(
  cases: Case[],
  findings: Finding[],
  cses: CSEEntity[],
  scoresMap: Map<string, Score>
): PrioritizedCase[] {
  const cseMap = new Map(cses.map(c => [c.id, c]));
  const caseFindingsMap = new Map<string, Finding[]>();

  for (const f of findings) {
    if (f.caseId) {
      const arr = caseFindingsMap.get(f.caseId) || [];
      arr.push(f);
      caseFindingsMap.set(f.caseId, arr);
    }
  }

  const prioritized: PrioritizedCase[] = cases.map(c => {
    const cse = cseMap.get(c.cseId);
    const score = scoresMap.get(c.cseId);
    const caseFindings = caseFindingsMap.get(c.id) || [];

    // Severity base score
    let base = c.severity === 'CRITICAL' ? 45 : c.severity === 'HIGH' ? 30 : c.severity === 'MEDIUM' ? 15 : 5;

    // Entity Criticality multiplier
    if (cse?.criticality === 'TIER_1') base += 15;
    else if (cse?.criticality === 'TIER_2') base += 8;

    // Associated findings contribution
    let findingsScore = 0;
    for (const f of caseFindings) {
      if (f.category === 'EXECUTION_GAP') findingsScore += 20 * f.confidence;
      else if (f.category === 'NEGATIVE_SPACE') findingsScore += 22 * f.confidence;
      else if (f.category === 'KPI_EVIDENCE_CONTRADICTION') findingsScore += 25 * f.confidence;
      else findingsScore += 12 * f.confidence;
    }

    // CSE Attention score contribution (0 - 15)
    const cseAttentionContrib = score ? Math.round((score.overallScore / 100) * 15) : 5;

    const totalPriorityScore = Math.min(100, Math.round(base + findingsScore + cseAttentionContrib));

    const topFinding = caseFindings[0];

    let urgency = 'Standard routine case review.';
    if (caseFindings.some(f => f.category === 'EXECUTION_GAP')) {
      urgency = 'Critical workflow execution gap detected (e.g. unescalated closure).';
    } else if (c.severity === 'CRITICAL') {
      urgency = 'Tier-1 critical infrastructure severity incident requiring supervisory validation.';
    } else if (caseFindings.length > 0) {
      urgency = 'Investigation weaknesses flagged during automated triage.';
    }

    return {
      ...c,
      rank: 0,
      priorityScore: totalPriorityScore,
      cseName: cse?.name || 'Unknown CSE',
      cseCode: cse?.code || c.cseId,
      associatedFindingsCount: caseFindings.length,
      topFindingTitle: topFinding ? topFinding.title : (c.severity === 'CRITICAL' ? 'High Severity Case Under Evaluation' : 'Routine Operational Case'),
      topFindingCategory: topFinding ? topFinding.category : 'OPERATIONAL_ROUTINE',
      urgencyReason: urgency
    };
  });

  // Sort descending by priority score
  prioritized.sort((a, b) => b.priorityScore - a.priorityScore);

  // Assign ranks
  return prioritized.map((item, idx) => ({
    ...item,
    rank: idx + 1
  }));
}
