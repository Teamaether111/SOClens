import { CSEEntity, PeerGroup, Finding } from '../types';
import { CSEFeatures } from './features';

export interface CSEPeerDeviation {
  cseId: string;
  peerGroupId: string;
  metric: string;
  cseValue: number;
  peerMedian: number;
  peerMean: number;
  deviationPoints: number;
  isSignificant: boolean;
  message: string;
}

export function computePeerGroups(
  cses: CSEEntity[],
  featuresMap: Map<string, CSEFeatures>
): { peerGroups: PeerGroup[]; deviations: Map<string, CSEPeerDeviation[]>; findings: Finding[] } {
  const groupsMap = new Map<string, { cses: CSEEntity[]; features: CSEFeatures[] }>();

  for (const cse of cses) {
    const feat = featuresMap.get(cse.id);
    if (!feat) continue;

    const groupKey = `${cse.sector}_${cse.criticality}`;
    if (!groupsMap.has(groupKey)) {
      groupsMap.set(groupKey, { cses: [], features: [] });
    }
    const grp = groupsMap.get(groupKey)!;
    grp.cses.push(cse);
    grp.features.push(feat);
  }

  const peerGroups: PeerGroup[] = [];
  const deviations = new Map<string, CSEPeerDeviation[]>();
  const findings: Finding[] = [];
  const now = new Date().toISOString();

  const getMedian = (nums: number[]) => {
    if (nums.length === 0) return 0;
    const sorted = [...nums].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  const getMean = (nums: number[]) => {
    if (nums.length === 0) return 0;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
  };

  for (const [key, { cses: groupCses, features }] of groupsMap.entries()) {
    const [sector, criticality] = key.split('_') as [any, any];

    const escalationRates = features.map(f => f.escalationRate * 100);
    const invTimes = features.map(f => f.medianInvestigationTimeMinutes);
    const closureTimes = features.map(f => f.medianClosureTimeMinutes);
    const coverages = features.map(f => f.monitoringCoverage * 100);
    const repeats = features.map(f => f.repeatAlertRate * 100);
    const reopens = features.map(f => f.caseReopenRate * 100);

    const peerGroup: PeerGroup = {
      id: `pg_${key.toLowerCase()}`,
      sector,
      criticality,
      cseCount: groupCses.length,
      stats: {
        medianEscalationRate: Number(getMedian(escalationRates).toFixed(1)),
        medianInvestigationTimeMinutes: Number(getMedian(invTimes).toFixed(1)),
        medianClosureTimeMinutes: Number(getMedian(closureTimes).toFixed(1)),
        medianMonitoringCoverage: Number(getMedian(coverages).toFixed(1)),
        medianRepeatAlertRate: Number(getMedian(repeats).toFixed(1)),
        medianCaseReopenRate: Number(getMedian(reopens).toFixed(1))
      }
    };
    peerGroups.push(peerGroup);

    // Compute deviation for each CSE in this group
    for (const cse of groupCses) {
      const feat = featuresMap.get(cse.id)!;
      const cseDevs: CSEPeerDeviation[] = [];

      // Check Escalation Rate deviation
      const cseEscPct = feat.escalationRate * 100;
      const escDiff = Number((cseEscPct - peerGroup.stats.medianEscalationRate).toFixed(1));
      if (escDiff <= -30) {
        cseDevs.push({
          cseId: cse.id,
          peerGroupId: peerGroup.id,
          metric: 'Escalation Rate',
          cseValue: cseEscPct,
          peerMedian: peerGroup.stats.medianEscalationRate,
          peerMean: Number(getMean(escalationRates).toFixed(1)),
          deviationPoints: escDiff,
          isSignificant: true,
          message: 'Significant peer deviation requiring contextual review.'
        });

        findings.push({
          id: `fnd_peer_esc_${cse.id}`,
          cseId: cse.id,
          category: 'PEER_DEVIATION',
          severity: 'MEDIUM',
          title: 'Potential Peer Deviation: Substantially Lower Escalation Rate than Sector Cohort',
          reason: `Entity escalation rate (${cseEscPct}%) diverges by ${escDiff} percentage points from peer median (${peerGroup.stats.medianEscalationRate}%).`,
          expectedWorkflow: `Escalation rate roughly aligned with ${cse.sector} ${cse.criticality} peer median (~${peerGroup.stats.medianEscalationRate}%)`,
          observedWorkflow: `Observed Escalation Rate: ${cseEscPct}% (Peer Median: ${peerGroup.stats.medianEscalationRate}%)`,
          evidence: {
            cseRate: `${cseEscPct}%`,
            peerMedian: `${peerGroup.stats.medianEscalationRate}%`,
            divergence: `${escDiff} pp`,
            cohortSize: groupCses.length
          },
          confidence: 0.81,
          recommendedReview: 'Evaluate sectoral reporting procedures to determine if local criteria for escalation differ from peer norms.',
          status: 'NEW',
          createdAt: now
        });
      }

      // Check Monitoring Coverage deviation
      const cseCovPct = feat.monitoringCoverage * 100;
      const covDiff = Number((cseCovPct - peerGroup.stats.medianMonitoringCoverage).toFixed(1));
      if (covDiff <= -15) {
        cseDevs.push({
          cseId: cse.id,
          peerGroupId: peerGroup.id,
          metric: 'Monitoring Coverage',
          cseValue: cseCovPct,
          peerMedian: peerGroup.stats.medianMonitoringCoverage,
          peerMean: Number(getMean(coverages).toFixed(1)),
          deviationPoints: covDiff,
          isSignificant: true,
          message: 'Significant peer deviation requiring contextual review.'
        });
      }

      deviations.set(cse.id, cseDevs);
    }
  }

  return { peerGroups, deviations, findings };
}
