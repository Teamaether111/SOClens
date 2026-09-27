import { Finding, Case, Alert, Asset, Investigation, Escalation } from '../types';

export interface NegativeSpaceGap {
  id: string;
  cseId: string;
  gapType: 'MONITORING_COVERAGE_GAP' | 'ESCALATION_RECORD_GAP' | 'INVESTIGATION_RECORD_GAP' | 'DETECTION_CATEGORY_GAP' | 'OPERATIONAL_ACTIVITY_GAP';
  title: string;
  expectedMetric: string;
  expectedValue: number | string;
  observedMetric: string;
  observedValue: number | string;
  gapDescription: string;
  evidence: Record<string, any>;
  confidence: number;
  recommendedReview: string;
}

/**
 * Negative Space Engine
 * Identifies evidence that SHOULD exist based on asset criticality, case severity,
 * and sectoral baselines, but DOES NOT exist in the submitted operational telemetry.
 */
export function runNegativeSpaceEngine(
  cseId: string,
  assets: Asset[],
  alerts: Alert[],
  cases: Case[],
  investigations: Investigation[],
  escalations: Escalation[]
): { findings: Finding[]; gaps: NegativeSpaceGap[] } {
  const findings: Finding[] = [];
  const gaps: NegativeSpaceGap[] = [];
  const now = new Date().toISOString();

  // 1. Critical Asset Monitoring Gap
  const criticalAssets = assets.filter(a => a.criticality === 'CRITICAL');
  const monitoredCriticalAssets = criticalAssets.filter(a => a.isMonitored);
  const unmonitoredCriticalCount = criticalAssets.length - monitoredCriticalAssets.length;

  if (unmonitoredCriticalCount > 0) {
    const gap: NegativeSpaceGap = {
      id: `ns_gap_mon_${cseId}`,
      cseId,
      gapType: 'MONITORING_COVERAGE_GAP',
      title: 'Potential Monitoring Coverage Gap',
      expectedMetric: 'Critical Assets with Active Monitoring Evidence',
      expectedValue: criticalAssets.length,
      observedMetric: 'Critical Assets with Observed Telemetry',
      observedValue: monitoredCriticalAssets.length,
      gapDescription: `${unmonitoredCriticalCount} critical infrastructure asset(s) lack active monitoring telemetry.`,
      evidence: {
        totalCriticalAssets: criticalAssets.length,
        monitoredCriticalCount: monitoredCriticalAssets.length,
        gapCount: unmonitoredCriticalCount,
        unmonitoredAssetSamples: criticalAssets.filter(a => !a.isMonitored).slice(0, 8).map(a => ({
          id: a.id,
          name: a.name,
          ip: a.ipAddress,
          type: a.assetType
        }))
      },
      confidence: 0.95,
      recommendedReview: 'Review monitoring coverage for identified assets.'
    };
    gaps.push(gap);

    findings.push({
      id: `fnd_neg_mon_${cseId}`,
      cseId,
      category: 'NEGATIVE_SPACE',
      severity: 'CRITICAL',
      title: 'Potential Negative-Space Gap: Missing Critical Asset Monitoring Coverage',
      reason: `Expected continuous SOC visibility on ${criticalAssets.length} critical assets, but observed active telemetry on only ${monitoredCriticalAssets.length}.`,
      expectedWorkflow: `All Registered Critical Assets (${criticalAssets.length}) → Continuous Telemetry Feed → Active Detection Coverage`,
      observedWorkflow: `Partial Telemetry (${monitoredCriticalAssets.length} / ${criticalAssets.length} Monitored) — Gap of ${unmonitoredCriticalCount} Unmonitored Assets`,
      evidence: gap.evidence,
      confidence: 0.95,
      recommendedReview: gap.recommendedReview,
      status: 'NEW',
      createdAt: now
    });
  }

  // 2. Critical Case Escalation Record Gap
  const criticalCases = cases.filter(c => c.severity === 'CRITICAL');
  const escalatedCaseIds = new Set(escalations.map(e => e.caseId));
  const unescalatedCriticalCases = criticalCases.filter(c => !escalatedCaseIds.has(c.id));

  if (unescalatedCriticalCases.length > 0) {
    const gap: NegativeSpaceGap = {
      id: `ns_gap_esc_${cseId}`,
      cseId,
      gapType: 'ESCALATION_RECORD_GAP',
      title: 'Potential Escalation Record Gap in Critical Incidents',
      expectedMetric: 'Critical Severity Cases with Multi-Agency Escalation Evidence',
      expectedValue: criticalCases.length,
      observedMetric: 'Critical Cases with Recorded Escalations',
      observedValue: criticalCases.length - unescalatedCriticalCases.length,
      gapDescription: `${unescalatedCriticalCases.length} critical incident(s) were processed without recorded external or executive escalation evidence.`,
      evidence: {
        totalCriticalCases: criticalCases.length,
        observedEscalations: criticalCases.length - unescalatedCriticalCases.length,
        missingEscalationCases: unescalatedCriticalCases.slice(0, 5).map(c => ({
          caseId: c.id,
          title: c.title,
          status: c.status,
          createdAt: c.createdAt
        }))
      },
      confidence: 0.91,
      recommendedReview: 'Review incident escalation logs and verify whether critical security breaches were handled without external disclosure.'
    };
    gaps.push(gap);

    findings.push({
      id: `fnd_neg_esc_${cseId}`,
      cseId,
      category: 'NEGATIVE_SPACE',
      severity: 'HIGH',
      title: 'Potential Negative-Space Gap: Unrecorded Escalations for High-Impact Incidents',
      reason: `In ${unescalatedCriticalCases.length} critical cases, expected formal escalation records were entirely absent from submitted audit evidence.`,
      expectedWorkflow: 'Critical Incident Identification → Escalation Ticket to CERT/NCIIPC within Mandated Timeframe',
      observedWorkflow: 'Critical Incident Identification → Local Resolution without External Escalation Records',
      evidence: gap.evidence,
      confidence: 0.91,
      recommendedReview: gap.recommendedReview,
      status: 'NEW',
      createdAt: now
    });
  }

  // 3. Expected Alert Category Gap (Detection Blind Spot)
  // Standard critical sector baseline expects at least MALWARE and UNAUTHORIZED_ACCESS alerts
  const observedCategories = new Set(alerts.map(a => a.category));
  const expectedEssentialCategories: ('MALWARE' | 'UNAUTHORIZED_ACCESS' | 'EXFILTRATION')[] = [
    'MALWARE',
    'UNAUTHORIZED_ACCESS'
  ];

  const missingCategories = expectedEssentialCategories.filter(cat => !observedCategories.has(cat));
  if (missingCategories.length > 0 && alerts.length > 30) {
    const gap: NegativeSpaceGap = {
      id: `ns_gap_cat_${cseId}`,
      cseId,
      gapType: 'DETECTION_CATEGORY_GAP',
      title: 'Potential Detection Category Blind Spot',
      expectedMetric: 'Baseline Critical Sector Threat Categories Observed',
      expectedValue: expectedEssentialCategories.join(', '),
      observedMetric: 'Observed Threat Categories in Telemetry',
      observedValue: Array.from(observedCategories).join(', ') || 'None',
      gapDescription: `Expected alert signals for core category '${missingCategories.join(', ')}' were completely absent despite ${alerts.length} total logged alerts.`,
      evidence: {
        totalAlerts: alerts.length,
        missingCategories,
        presentCategories: Array.from(observedCategories)
      },
      confidence: 0.82,
      recommendedReview: 'Review SIEM use-case rules and sensor signatures for missing threat classes.'
    };
    gaps.push(gap);

    findings.push({
      id: `fnd_neg_cat_${cseId}`,
      cseId,
      category: 'NEGATIVE_SPACE',
      severity: 'MEDIUM',
      title: 'Potential Negative-Space Gap: Complete Absence of Core Threat Signatures',
      reason: `Expected telemetry across standard attack vectors; observed zero alerts for category: ${missingCategories.join(', ')}.`,
      expectedWorkflow: 'Multi-layer Perimeter/Host Sensors → Broad spectrum threat detection across MITRE ATT&CK categories',
      observedWorkflow: `Restricted detection spectrum; 0 detections registered in ${missingCategories.join(', ')}`,
      evidence: gap.evidence,
      confidence: 0.82,
      recommendedReview: gap.recommendedReview,
      status: 'NEW',
      createdAt: now
    });
  }

  // 4. Low Operational Activity Gap compared to asset scale
  if (assets.length > 25 && alerts.length < 5) {
    const gap: NegativeSpaceGap = {
      id: `ns_gap_act_${cseId}`,
      cseId,
      gapType: 'OPERATIONAL_ACTIVITY_GAP',
      title: 'Potential Operational Activity Gap',
      expectedMetric: 'Expected Baseline Alert Volume based on Asset Estate Size',
      expectedValue: `> ${Math.floor(assets.length * 0.8)} alerts/cycle`,
      observedMetric: 'Observed Alert Volume',
      observedValue: `${alerts.length} alerts`,
      gapDescription: `Asset count of ${assets.length} systems generated only ${alerts.length} alerts during the full reporting cycle.`,
      evidence: {
        assetCount: assets.length,
        alertCount: alerts.length,
        activityRatio: Number((alerts.length / assets.length).toFixed(3))
      },
      confidence: 0.85,
      recommendedReview: 'Verify SOC telemetry ingestion pipelines and confirm whether log shippers are operating normally.'
    };
    gaps.push(gap);

    findings.push({
      id: `fnd_neg_act_${cseId}`,
      cseId,
      category: 'NEGATIVE_SPACE',
      severity: 'HIGH',
      title: 'Potential Negative-Space Gap: Sub-Baseline Telemetry Volume for Asset Scale',
      reason: `Telemetry volume is disproportionately subdued relative to the ${assets.length} registered critical infrastructure systems.`,
      expectedWorkflow: `Enterprise Fleet (${assets.length} assets) → Regular Event Flow & Baseline Alerting (~${Math.floor(assets.length * 0.8)}+ alerts)`,
      observedWorkflow: `Near-silent sensor telemetry (${alerts.length} total alerts) — indicates potential collector disconnect`,
      evidence: gap.evidence,
      confidence: 0.85,
      recommendedReview: gap.recommendedReview,
      status: 'NEW',
      createdAt: now
    });
  }

  return { findings, gaps };
}
