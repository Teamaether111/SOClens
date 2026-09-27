import { 
  CSEEntity, Asset, Alert, Case, Investigation, Escalation, ReportedKPI, User, Sector, Criticality 
} from './types';

export interface GeneratedDemoData {
  cses: CSEEntity[];
  assets: Asset[];
  alerts: Alert[];
  cases: Case[];
  investigations: Investigation[];
  escalations: Escalation[];
  reportedKpis: ReportedKPI[];
}

const SECTORS: Sector[] = [
  'ENERGY',
  'BANKING_FINANCE',
  'TELECOMMUNICATIONS',
  'TRANSPORTATION',
  'GOVERNMENT_DEFENSE',
  'HEALTHCARE'
];

const CSE_NAMES: { name: string; code: string; sector: Sector; criticality: Criticality }[] = [
  { name: 'National Power Grid Southern Region', code: 'CSE-01', sector: 'ENERGY', criticality: 'TIER_1' },
  { name: 'State Bank Electronic Clearing Hub', code: 'CSE-02', sector: 'BANKING_FINANCE', criticality: 'TIER_1' },
  { name: 'Metro Rapid Transit Supervisory Control', code: 'CSE-03', sector: 'TRANSPORTATION', criticality: 'TIER_1' },
  { name: 'National Petroleum Pipeline Supervisory', code: 'CSE-04', sector: 'ENERGY', criticality: 'TIER_1' },
  { name: 'Union Telecom Fiber Infrastructure Ops', code: 'CSE-05', sector: 'TELECOMMUNICATIONS', criticality: 'TIER_2' },
  { name: 'Federated Commercial Clearing Corp', code: 'CSE-06', sector: 'BANKING_FINANCE', criticality: 'TIER_2' },
  { name: 'Aviation Air Traffic Control Communications', code: 'CSE-07', sector: 'TRANSPORTATION', criticality: 'TIER_1' },
  { name: 'Defense Satellite Telemetry Terminal', code: 'CSE-08', sector: 'GOVERNMENT_DEFENSE', criticality: 'TIER_1' },
  { name: 'Regional Atomic Generation Center', code: 'CSE-09', sector: 'ENERGY', criticality: 'TIER_1' },
  { name: 'Central Securities Depository Node', code: 'CSE-10', sector: 'BANKING_FINANCE', criticality: 'TIER_1' },
  { name: 'National Hydroelectric Dispatch Unit', code: 'CSE-11', sector: 'ENERGY', criticality: 'TIER_1' },
  { name: 'Maritime Port Container Traffic Gateway', code: 'CSE-12', sector: 'TRANSPORTATION', criticality: 'TIER_2' },
  { name: 'National Health Data Exchange Fabric', code: 'CSE-13', sector: 'HEALTHCARE', criticality: 'TIER_2' },
  { name: 'State Telecom Microwave Backbone East', code: 'CSE-14', sector: 'TELECOMMUNICATIONS', criticality: 'TIER_2' },
  { name: 'Strategic Nuclear Logistics Network', code: 'CSE-15', sector: 'GOVERNMENT_DEFENSE', criticality: 'TIER_1' },
  { name: 'Inter-Bank Real-Time Settlement Hub', code: 'CSE-16', sector: 'BANKING_FINANCE', criticality: 'TIER_1' },
  { name: 'Regional Emergency Medical Dispatch SOC', code: 'CSE-17', sector: 'HEALTHCARE', criticality: 'TIER_3' },
  { name: 'National Railway Signalling Telemetry', code: 'CSE-18', sector: 'TRANSPORTATION', criticality: 'TIER_1' },
  { name: 'Defense Ordnance Factory Control Hub', code: 'CSE-19', sector: 'GOVERNMENT_DEFENSE', criticality: 'TIER_2' },
  { name: 'Public Health Disease Surveillance Network', code: 'CSE-20', sector: 'HEALTHCARE', criticality: 'TIER_3' }
];

const ASSET_TYPES: Asset['assetType'][] = [
  'SERVER', 'DATABASE', 'FIREWALL', 'SCADA_CONTROLLER', 'WORKSTATION', 'ROUTER'
];

const ALERT_CATEGORIES: Alert['category'][] = [
  'MALWARE', 'UNAUTHORIZED_ACCESS', 'EXFILTRATION', 'DDOS', 'POLICY_VIOLATION', 'CREDENTIAL_STUFFING', 'LATERAL_MOVEMENT'
];

const BOILERPLATE_TEMPLATES = [
  'Standard alert triage performed. Operator reviewed SIEM log entry, inspected source and destination IP addresses, verified host status was normal, and closed ticket per standard operating procedure SOP-SOC-101.',
  'Standard alert triage performed. Operator reviewed SIEM log entry, verified firewall ports and destination address, found routine system traffic, and closed ticket per standard operating procedure SOP-SOC-101.',
  'Standard alert triage performed. Operator checked endpoint antivirus log, validated network flow timestamps, observed expected communications, and concluded investigation per standard operating procedure SOP-SOC-101.',
  'Standard alert triage performed. Operator confirmed host alert, verified port status, noted standard activity, resolved as per baseline procedures SOP-SOC-101.'
];

const DETAILED_CASE_NOTES = [
  'Forensic packet capture analysis revealed persistent TLS beaconing to known Cobalt Strike command-and-control IP 198.51.100.44 on port 443. Memory dump from target server identified injected hollow process svchost.exe. Compromised service account svc_backup was disabled immediately, firewall outbound port blocked, and memory artifact preserved for Sectoral CERT review.',
  'Suspicious lateral SMB connections detected originating from workstation 10.45.2.14 targeting high-value domain controller. Sysmon Event ID 1 indicates Mimikatz memory dump execution against lsass.exe. Host was isolated from corporate VLAN via EDR network containment, active Kerberos tickets invalidated, and full disk forensic image captured.',
  'SQL Injection attack sequence observed targeting patient portal external endpoint /api/v1/lookup. Over 450 UNION SELECT queries identified attempting exfiltration of table schema. Web Application Firewall (WAF) rule 4022 was triggered and custom IP block implemented across reverse proxies. Database audit logs show zero unauthorized data leakage.',
  'Ransomware staging activity observed in staging directory /opt/shared/finance/. Process cryptolocker.bin identified attempting to modify file permissions and encrypt local shares. File system was set to read-only mode, processes terminated via EDR agent, volume shadow copies verified intact, and snapshot restoration initiated.',
  'Distributed Denial of Service (DDoS) reflection attack detected against border BGP router interface. Volume peaked at 48 Gbps UDP amplification traffic from spoofed DNS resolvers. Traffic scrubbing profile activated with sectoral ISP, upstream null-route applied for impacted IP range, and critical services redirected through secondary GRE tunnel.'
];

export function generateSyntheticDataset(): GeneratedDemoData {
  const cses: CSEEntity[] = [];
  const assets: Asset[] = [];
  const alerts: Alert[] = [];
  const cases: Case[] = [];
  const investigations: Investigation[] = [];
  const escalations: Escalation[] = [];
  const reportedKpis: ReportedKPI[] = [];

  const reportingCycle = '2026-Q3';
  const baseTime = new Date('2026-09-01T00:00:00Z').getTime();
  const endTime = new Date('2026-09-25T23:59:59Z').getTime();

  let assetIdCounter = 1000;
  let alertIdCounter = 10000;
  let caseIdCounter = 1000;
  let invIdCounter = 1000;
  let escIdCounter = 1000;

  for (let cseIdx = 0; cseIdx < CSE_NAMES.length; cseIdx++) {
    const meta = CSE_NAMES[cseIdx];
    const cseId = meta.code;

    // Assets count: between 25 and 35 per CSE -> 20 * 30 = 600 assets total
    const numAssets = 25 + Math.floor(Math.random() * 10);
    const cseAssets: Asset[] = [];

    // Planted condition A: CSE-01 has some unescalated critical cases
    const isCse01 = cseId === 'CSE-01';
    // Planted condition D: CSE-03 has 12 critical SCADA assets missing monitoring!
    const isCse03 = cseId === 'CSE-03';
    // Planted condition G: CSE-18 has very low activity
    const isCse18 = cseId === 'CSE-18';
    // Planted condition J: CSE-11 has SLA > 95% but remediation < 45%
    const isCse11 = cseId === 'CSE-11';
    // Planted condition K: CSE-07 has closure > 90% but investigation evidence < 50%
    const isCse07 = cseId === 'CSE-07';
    // Planted condition L: CSE-14 has boilerplate investigation notes (repetition > 0.85)
    const isCse14 = cseId === 'CSE-14';
    // Planted condition C: CSE-09 has repeated alerts on single asset
    const isCse09 = cseId === 'CSE-09';
    // Planted condition E: CSE-05 has cases acknowledged without investigations
    const isCse05 = cseId === 'CSE-05';

    for (let a = 0; a < numAssets; a++) {
      assetIdCounter++;
      const isCritical = a < 8; // first 8 assets are critical
      let isMonitored = true;

      if (isCse03 && isCritical && a < 6) {
        isMonitored = false; // Missing monitoring evidence planted!
      } else if (!isCritical && Math.random() < 0.1) {
        isMonitored = false;
      }

      const asset: Asset = {
        id: `AST-${assetIdCounter}`,
        cseId,
        name: `${meta.sector.substring(0, 3)}_${ASSET_TYPES[a % ASSET_TYPES.length]}_${a + 1}`,
        ipAddress: `10.${10 + cseIdx}.${Math.floor(a / 254) + 1}.${(a % 250) + 2}`,
        assetType: ASSET_TYPES[a % ASSET_TYPES.length],
        criticality: isCritical ? 'CRITICAL' : a < 16 ? 'HIGH' : a < 22 ? 'MEDIUM' : 'LOW',
        isMonitored,
        lastMonitoredAt: isMonitored ? new Date(endTime - Math.random() * 86400000).toISOString() : null
      };
      assets.push(asset);
      cseAssets.push(asset);
    }

    const cseEntity: CSEEntity = {
      id: cseId,
      name: meta.name,
      code: meta.code,
      sector: meta.sector,
      criticality: meta.criticality,
      peerGroupId: `pg_${meta.sector.toLowerCase()}_${meta.criticality.toLowerCase()}`,
      totalAssets: cseAssets.length,
      criticalAssets: cseAssets.filter(a => a.criticality === 'CRITICAL').length,
      contactEmail: `soc.lead@${cseId.toLowerCase().replace('-', '')}.gov.in`,
      reportingCycle,
      status: 'ACTIVE',
      createdAt: '2026-01-15T00:00:00Z'
    };
    cses.push(cseEntity);

    // Number of alerts per CSE: average ~550 alerts per CSE -> 20 * 550 = 10,500+ alerts!
    // Exception: CSE-18 has only 8 alerts (Pattern G)
    const alertCount = isCse18 ? 8 : (530 + Math.floor(Math.random() * 60));
    const cseAlerts: Alert[] = [];

    for (let al = 0; al < alertCount; al++) {
      alertIdCounter++;
      const timeOffset = Math.random() * (endTime - baseTime);
      const createdAt = new Date(baseTime + timeOffset).toISOString();

      // Pick asset
      let targetAsset = cseAssets[Math.floor(Math.random() * cseAssets.length)];
      // If CSE-09, plant 35 repeated alerts on asset #0
      if (isCse09 && al < 35) {
        targetAsset = cseAssets[0];
      }

      const severityDist = Math.random();
      const severity: Alert['severity'] = 
        severityDist < 0.12 ? 'CRITICAL' :
        severityDist < 0.35 ? 'HIGH' :
        severityDist < 0.70 ? 'MEDIUM' : 'LOW';

      const alert: Alert = {
        id: `ALT-${alertIdCounter}`,
        cseId,
        assetId: targetAsset.id,
        title: `${severity} ${ALERT_CATEGORIES[al % ALERT_CATEGORIES.length]} detected on ${targetAsset.name}`,
        category: isCse09 && al < 35 ? 'UNAUTHORIZED_ACCESS' : ALERT_CATEGORIES[al % ALERT_CATEGORIES.length],
        severity,
        createdAt,
        acknowledgedAt: new Date(new Date(createdAt).getTime() + (Math.random() * 3600000)).toISOString(),
        status: 'CLOSED'
      };
      alerts.push(alert);
      cseAlerts.push(alert);
    }

    // Number of cases per CSE: average ~115 cases -> 19 * 115 + 2 = 2,185+ cases!
    // Exception: CSE-18 has 2 cases
    const numCases = isCse18 ? 2 : (108 + Math.floor(Math.random() * 15));

    for (let c = 0; c < numCases; c++) {
      caseIdCounter++;
      const primaryAsset = cseAssets[c % cseAssets.length];
      const timeOffset = Math.random() * (endTime - baseTime);
      const caseCreatedMs = baseTime + timeOffset;
      const createdAt = new Date(caseCreatedMs).toISOString();

      const sevRand = Math.random();
      const severity: Case['severity'] = 
        sevRand < 0.18 ? 'CRITICAL' :
        sevRand < 0.45 ? 'HIGH' :
        sevRand < 0.80 ? 'MEDIUM' : 'LOW';

      // Timestamps
      const ackDelayMs = (2 + Math.random() * 25) * 60000;
      const acknowledgedAt = new Date(caseCreatedMs + ackDelayMs).toISOString();

      // Planted Pattern B on CSE-07: Unusually fast closures (< 10 minutes)
      let durationMs = (30 + Math.random() * 360) * 60000;
      if (isCse07 && Math.random() < 0.6) {
        durationMs = (4 + Math.random() * 5) * 60000; // 4 to 9 minutes!
      }

      const invStartMs = caseCreatedMs + ackDelayMs + (5 * 60000);
      const investigationStartedAt = (!isCse05 || c % 3 !== 0) ? new Date(invStartMs).toISOString() : null;

      const closedAt = new Date(caseCreatedMs + ackDelayMs + durationMs).toISOString();

      const caseObj: Case = {
        id: `CAS-${caseIdCounter}`,
        cseId,
        title: `${severity} Security Incident Docket - ${primaryAsset.name}`,
        severity,
        relatedAlertIds: cseAlerts.slice(c * 2, c * 2 + 2).map(a => a.id),
        primaryAssetId: primaryAsset.id,
        status: 'CLOSED',
        createdAt,
        acknowledgedAt,
        investigationStartedAt,
        escalatedAt: null,
        closedAt,
        closureReason: 'Remediation completed or risk mitigated',
        reopenedCount: Math.random() < 0.08 ? 1 : 0
      };

      // Escalation handling
      // Planted Pattern A: Critical alerts without escalation on CSE-07 and CSE-01
      const isCritical = severity === 'CRITICAL';
      let shouldEscalate = isCritical;
      if (isCse07 && isCritical) {
        shouldEscalate = false; // Planted missing escalation!
      } else if (isCse01 && isCritical && c % 2 === 0) {
        shouldEscalate = false; // Planted missing escalation!
      } else if (!isCritical && Math.random() < 0.15) {
        shouldEscalate = true;
      }

      if (shouldEscalate) {
        escIdCounter++;
        const escTimeMs = caseCreatedMs + (15 + Math.random() * 45) * 60000;
        const escTime = new Date(escTimeMs).toISOString();
        caseObj.escalatedAt = escTime;

        escalations.push({
          id: `ESC-${escIdCounter}`,
          caseId: caseObj.id,
          cseId,
          escalatedTo: isCritical ? 'SECTORAL_CERT' : 'CISO_DESK',
          escalatedAt: escTime,
          reason: `Automated escalation rule: ${severity} impact tier on critical infrastructure asset ${primaryAsset.name}`,
          acknowledgedByRecipient: true
        });
      }

      // Investigation Record Handling
      // Planted Pattern E: Missing investigation records on CSE-05
      const shouldHaveInvestigation = (!isCse05 || c % 3 !== 0);

      if (shouldHaveInvestigation) {
        invIdCounter++;
        let noteText = '';
        let hasRemediationRecord = true;

        if (isCse14) {
          // Planted Pattern L: Boilerplate text across cases! (repetition_rate > 0.85)
          noteText = (c % 10 === 0) 
            ? BOILERPLATE_TEMPLATES[c % BOILERPLATE_TEMPLATES.length] 
            : BOILERPLATE_TEMPLATES[0];
        } else if (isCse11) {
          // Planted Pattern J: High SLA reported, but remediation records missing in >65% cases!
          hasRemediationRecord = c % 4 === 0; // only 25% have remediation records!
          noteText = hasRemediationRecord
            ? DETAILED_CASE_NOTES[c % DETAILED_CASE_NOTES.length]
            : 'Initial triage completed. System administrator alerted. Awaiting patch confirmation.';
        } else if (isCse07) {
          // Planted Pattern K: High closure reported, but short notes (< 50 words) in 65% of cases!
          if (c % 3 === 0) {
            noteText = DETAILED_CASE_NOTES[c % DETAILED_CASE_NOTES.length];
          } else {
            noteText = 'Triage completed. Alert resolved. System operating normally.';
          }
        } else {
          // Normal realistic distribution
          if (Math.random() < 0.75) {
            noteText = DETAILED_CASE_NOTES[c % DETAILED_CASE_NOTES.length];
            hasRemediationRecord = Math.random() < 0.85;
          } else {
            noteText = 'Reviewed anomalous event telemetry. Determined low-risk environmental false positive. Logged for baseline calibration.';
            hasRemediationRecord = Math.random() < 0.40;
          }
        }

        investigations.push({
          id: `INV-${invIdCounter}`,
          caseId: caseObj.id,
          cseId,
          investigatorName: `Analyst_${100 + (c % 12)}`,
          startedAt: caseObj.investigationStartedAt || createdAt,
          completedAt: closedAt,
          notes: noteText,
          evidenceArtifactCount: noteText.length > 100 ? 3 : 1,
          hasRemediationRecord,
          remediationActionSummary: hasRemediationRecord 
            ? 'Endpoint isolated, credentials revoked, firewall egress drop applied, baseline restored.' 
            : null
        });
      }

      cases.push(caseObj);
    }

    // Reported KPIs (Supplied by the CSE itself — Signal A)
    // Planted contradictions:
    // J: CSE-11 reports sla_compliance = 0.98 (98%) while operational remediation_evidence will be ~25-35%!
    // K: CSE-07 reports closure_rate = 0.95 (95%) while operational investigation_evidence (>50 words) will be ~33%!
    let repSla = 0.88 + Math.random() * 0.08;
    let repClosure = 0.86 + Math.random() * 0.08;
    let repEscalation = 0.80 + Math.random() * 0.12;

    if (isCse11) {
      repSla = 0.98; // Planted J!
      repClosure = 0.94;
    } else if (isCse07) {
      repClosure = 0.96; // Planted K!
      repSla = 0.91;
      repEscalation = 0.34; // Planted peer deviation!
    } else if (isCse14) {
      repSla = 0.96;
      repClosure = 0.92;
    }

    reportedKpis.push({
      id: `kpi_${cseId}_${reportingCycle}`,
      cseId,
      reportingCycle,
      slaCompliance: Number(repSla.toFixed(2)),
      closureRate: Number(repClosure.toFixed(2)),
      escalationRate: Number(repEscalation.toFixed(2)),
      createdAt: '2026-09-26T00:00:00Z'
    });
  }

  return {
    cses,
    assets,
    alerts,
    cases,
    investigations,
    escalations,
    reportedKpis
  };
}
