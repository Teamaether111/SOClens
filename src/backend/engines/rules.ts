import { Finding, Case, Alert, Asset, Investigation, Escalation } from '../types';

/**
 * Rules Engine for Execution Gaps, Investigation Weaknesses, and Workflow Flaws
 */
export function runRuleEngine(
  cseId: string,
  assets: Asset[],
  alerts: Alert[],
  cases: Case[],
  investigations: Investigation[],
  escalations: Escalation[]
): Finding[] {
  const findings: Finding[] = [];
  const now = new Date().toISOString();

  const assetMap = new Map(assets.map(a => [a.id, a]));
  const alertMap = new Map(alerts.map(a => [a.id, a]));
  const caseMap = new Map(cases.map(c => [c.id, c]));
  const investigationMap = new Map(investigations.map(i => [i.caseId, i]));
  const escalationMap = new Map(escalations.map(e => [e.caseId, e]));

  // RULE 1: Critical alert/case closed without escalation evidence
  for (const c of cases) {
    if (c.severity === 'CRITICAL' && (c.status === 'CLOSED' || c.status === 'RESOLVED')) {
      const hasEscalation = escalationMap.has(c.id);
      if (!hasEscalation) {
        findings.push({
          id: `fnd_rule1_${c.id}`,
          cseId,
          caseId: c.id,
          assetId: c.primaryAssetId,
          category: 'EXECUTION_GAP',
          severity: 'HIGH',
          title: 'Potential Execution Gap: Critical Incident Closed Without Escalation Evidence',
          reason: 'Critical severity case was closed without any recorded escalation to Sectoral CERT, CISO Desk, or NCIIPC.',
          expectedWorkflow: 'Critical Alert → Triage → Investigation → Multi-tiered Escalation → Remediation → Closure',
          observedWorkflow: 'Critical Alert → Triage → Direct Closure (No Escalation Record)',
          evidence: {
            caseId: c.id,
            caseTitle: c.title,
            severity: c.severity,
            createdAt: c.createdAt,
            closedAt: c.closedAt,
            closureReason: c.closureReason || 'Marked closed without notes',
            escalationRecordPresent: false
          },
          confidence: 0.92,
          recommendedReview: 'Review case workflow and verify whether standard critical escalation procedures were bypassed or omitted.',
          status: 'NEW',
          createdAt: now
        });
      }
    }
  }

  // RULE 2: Critical alert closed unusually quickly (< 12 minutes from creation)
  for (const c of cases) {
    if (c.severity === 'CRITICAL' && c.closedAt && c.createdAt) {
      const durationMin = (new Date(c.closedAt).getTime() - new Date(c.createdAt).getTime()) / 60000;
      if (durationMin > 0 && durationMin < 12) {
        const inv = investigationMap.get(c.id);
        findings.push({
          id: `fnd_rule2_${c.id}`,
          cseId,
          caseId: c.id,
          assetId: c.primaryAssetId,
          category: 'EXECUTION_GAP',
          severity: 'HIGH',
          title: 'Potential Execution Gap: Unusually Rapid Critical Case Closure',
          reason: `Critical case closed in only ${durationMin.toFixed(1)} minutes, suggesting superficial or automated closure without forensic rigor.`,
          expectedWorkflow: 'Critical Alert → In-depth Forensic Investigation (>30 min) → Threat Containment → Verified Closure',
          observedWorkflow: `Critical Alert → Rapid Closure (${durationMin.toFixed(1)} min)`,
          evidence: {
            caseId: c.id,
            durationMinutes: Number(durationMin.toFixed(1)),
            closureTimestamp: c.closedAt,
            investigationNotesLength: inv?.notes ? inv.notes.length : 0,
            artifactsCollected: inv?.evidenceArtifactCount || 0
          },
          confidence: 0.88,
          recommendedReview: 'Review case root-cause analysis to verify if resolution occurred prematurely without containment.',
          status: 'NEW',
          createdAt: now
        });
      }
    }
  }

  // RULE 3: Alert acknowledged but investigation evidence is missing
  for (const c of cases) {
    if (c.acknowledgedAt && !c.investigationStartedAt && !investigationMap.has(c.id)) {
      findings.push({
        id: `fnd_rule3_${c.id}`,
        cseId,
        caseId: c.id,
        assetId: c.primaryAssetId,
        category: 'INVESTIGATION_WEAKNESS',
        severity: 'MEDIUM',
        title: 'Potential Investigation Weakness: Case Acknowledged But Lacks Investigation Record',
        reason: 'Case timestamp indicates operator acknowledgement was logged, but no investigation artifacts or notes were ever filed.',
        expectedWorkflow: 'Acknowledgement → Active Investigation Docket Initiated → Findings Logged',
        observedWorkflow: 'Acknowledgement → Stalled Pipeline (Zero Investigation Records)',
        evidence: {
          caseId: c.id,
          acknowledgedAt: c.acknowledgedAt,
          daysSinceAck: Math.floor((Date.now() - new Date(c.acknowledgedAt).getTime()) / 86400000),
          status: c.status
        },
        confidence: 0.85,
        recommendedReview: 'Audit operator shift logs to ascertain whether investigative findings were lost or unrecorded.',
        status: 'NEW',
        createdAt: now
      });
    }
  }

  // RULE 4: Repeated alerts on the same asset without remediation evidence
  const assetAlertCount = new Map<string, Alert[]>();
  for (const a of alerts) {
    const arr = assetAlertCount.get(a.assetId) || [];
    arr.push(a);
    assetAlertCount.set(a.assetId, arr);
  }

  for (const [assetId, alertList] of assetAlertCount.entries()) {
    if (alertList.length >= 6) {
      const asset = assetMap.get(assetId);
      // Check cases for this asset
      const assetCases = cases.filter(c => c.primaryAssetId === assetId);
      const hasRemediation = assetCases.some(c => {
        const inv = investigationMap.get(c.id);
        return inv && inv.hasRemediationRecord;
      });

      if (!hasRemediation) {
        findings.push({
          id: `fnd_rule4_${assetId}`,
          cseId,
          assetId,
          category: 'EXECUTION_GAP',
          severity: 'HIGH',
          title: 'Potential Execution Gap: Recurrent High-Frequency Alerts Without Remediation Evidence',
          reason: `Asset received ${alertList.length} repeated alerts across reporting cycle with no verified root-cause remediation recorded.`,
          expectedWorkflow: 'Repetitive Alert Cluster → Root Cause Analysis → Defensive Configuration Change / Patch → Alert Dampening',
          observedWorkflow: `Repetitive Alert Cluster (${alertList.length} alerts) → Superficial Acknowledgements (No Remediation Evidence)`,
          evidence: {
            assetId,
            assetName: asset?.name || 'Unknown Asset',
            ipAddress: asset?.ipAddress || 'N/A',
            alertCount: alertList.length,
            categories: Array.from(new Set(alertList.map(a => a.category)))
          },
          confidence: 0.90,
          recommendedReview: 'Review defensive configuration on host system; verify whether alert fatigue caused persistent suppression of true positives.',
          status: 'NEW',
          createdAt: now
        });
      }
    }
  }

  // RULE 5: Critical asset expected to be monitored but no corresponding evidence exists
  // Handled also in Negative Space Engine, but planted rule checks here
  const unmonitoredCritical = assets.filter(a => a.criticality === 'CRITICAL' && !a.isMonitored);
  if (unmonitoredCritical.length > 0) {
    findings.push({
      id: `fnd_rule5_${cseId}`,
      cseId,
      category: 'MONITORING_BLIND_SPOT',
      severity: 'CRITICAL',
      title: 'Potential Monitoring Blind Spot: Critical Sector Assets Without Telemetry Integration',
      reason: `${unmonitoredCritical.length} Tier-1 critical assets in asset inventory lack active SIEM/SOC sensor coverage.`,
      expectedWorkflow: 'All Registered Critical Assets (100%) → Active Syslog/EDR Stream → SOC Health Monitoring',
      observedWorkflow: `${unmonitoredCritical.length} Critical Assets Missing Active Sensor Telemetry`,
      evidence: {
        totalCriticalAssets: assets.filter(a => a.criticality === 'CRITICAL').length,
        unmonitoredCriticalCount: unmonitoredCritical.length,
        sampleUnmonitoredAssets: unmonitoredCritical.slice(0, 5).map(a => ({ id: a.id, name: a.name, ip: a.ipAddress, type: a.assetType }))
      },
      confidence: 0.95,
      recommendedReview: 'Review monitoring coverage and network sensor placement for identified critical infrastructure assets.',
      status: 'NEW',
      createdAt: now
    });
  }

  // RULE 6: Investigation contains insufficient workflow evidence
  for (const inv of investigations) {
    const wordCount = (inv.notes || '').trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 15 && inv.evidenceArtifactCount === 0) {
      const c = caseMap.get(inv.caseId);
      if (c && (c.severity === 'CRITICAL' || c.severity === 'HIGH')) {
        findings.push({
          id: `fnd_rule6_${inv.id}`,
          cseId,
          caseId: inv.caseId,
          category: 'INVESTIGATION_WEAKNESS',
          severity: 'MEDIUM',
          title: 'Potential Investigation Weakness: Sub-Standard Investigation Depth on High-Severity Incident',
          reason: `Investigation record contains only ${wordCount} words and 0 attached telemetry artifacts for a ${c.severity} case.`,
          expectedWorkflow: 'High/Critical Alert Investigation → Comprehensive Technical Notes (>50 words) + Forensic Artifacts',
          observedWorkflow: `High/Critical Alert Investigation → Nominal Note (${wordCount} words) + Zero Artifacts`,
          evidence: {
            caseId: c.id,
            investigationId: inv.id,
            investigator: inv.investigatorName,
            wordCount,
            artifactsAttached: inv.evidenceArtifactCount,
            noteSnippet: inv.notes.substring(0, 100)
          },
          confidence: 0.84,
          recommendedReview: 'Examine SOC analyst triage procedures and enforce minimum documentation standards for high-severity events.',
          status: 'NEW',
          createdAt: now
        });
      }
    }
  }

  // RULE 7: Operational workload significantly differs from expected activity
  if (alerts.length > 50 && cases.length < 3) {
    findings.push({
      id: `fnd_rule7_${cseId}`,
      cseId,
      category: 'DETECTION_WEAKNESS',
      severity: 'HIGH',
      title: 'Potential Detection Weakness: Unusually Low Case Creation Despite Elevated Alert Volume',
      reason: `Entity logged ${alerts.length} raw security alerts but generated only ${cases.length} formal cases, indicating alert neglect or uncalibrated correlation rules.`,
      expectedWorkflow: 'Raw Alerts → Correlation Rules → Case Generation (~8-20% ratio) → Triage',
      observedWorkflow: `${alerts.length} Raw Alerts → Disproportionately Few (${cases.length}) Formal Cases (<6% ratio)`,
      evidence: {
        totalAlerts: alerts.length,
        totalCases: cases.length,
        caseToAlertRatio: Number((cases.length / alerts.length).toFixed(3))
      },
      confidence: 0.86,
      recommendedReview: 'Evaluate SIEM correlation rules and determine whether alerts are being discarded without human or automated qualification.',
      status: 'NEW',
      createdAt: now
    });
  }

  return findings;
}
