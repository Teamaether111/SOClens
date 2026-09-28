import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import * as XLSX from 'xlsx';
import {
  User, CSEEntity, Asset, Alert, Case, Investigation, Escalation,
  Finding, Anomaly, Score, PeerGroup, SupervisorReview, AuditLog,
  Dataset, ReportedKPI, EvidenceMetric, KPIContradiction,
  ScoringWeights, ContradictionThresholds
} from './types';
import { generateSyntheticDataset } from './generator';
import { computeCSEFeatures, computeEvidenceMetrics, CSEFeatures } from './engines/features';
import { runRuleEngine } from './engines/rules';
import { runNegativeSpaceEngine, NegativeSpaceGap } from './engines/negativespace';
import { runContradictionEngine, DEFAULT_CONTRADICTION_THRESHOLDS } from './engines/contradictions';
import { IsolationForestModel } from './isolation_forest';
import { computePeerGroups, CSEPeerDeviation } from './engines/benchmarking';
import { computeAttentionScore, DEFAULT_SCORING_WEIGHTS } from './engines/scoring';
import { prioritizeCases, PrioritizedCase } from './engines/case_prioritization';

export interface DatabaseState {
  users: User[];
  cse_entities: CSEEntity[];
  assets: Asset[];
  alerts: Alert[];
  cases: Case[];
  investigations: Investigation[];
  escalations: Escalation[];
  findings: Finding[];
  anomalies: Anomaly[];
  scores: Score[];
  peer_groups: PeerGroup[];
  supervisor_reviews: SupervisorReview[];
  audit_logs: AuditLog[];
  datasets: Dataset[];
  reported_kpis: ReportedKPI[];
  evidence_metrics: EvidenceMetric[];
  kpi_contradictions: KPIContradiction[];
  negative_space_gaps: NegativeSpaceGap[];
  scoring_weights: ScoringWeights;
  contradiction_thresholds: ContradictionThresholds;
  lastAnalysisTimestamp: string | null;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'sat_sa_database.json');

export class DatabaseManager {
  private state: DatabaseState;
  private isLoaded = false;

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): DatabaseState {
    const salt = bcrypt.genSaltSync(10);
    const supervisorHash = bcrypt.hashSync('supervisor123', salt);
    const adminHash = bcrypt.hashSync('admin123', salt);
    const viewerHash = bcrypt.hashSync('viewer123', salt);

    const initialUsers: User[] = [
      {
        id: 'usr_super_1',
        username: 'supervisor',
        name: 'Senior NCIIPC Supervisor',
        role: 'SUPERVISOR',
        email: 'teamaether111@gmail.com',
        passwordHash: supervisorHash
      },
      {
        id: 'usr_admin_1',
        username: 'admin',
        name: 'System Administrator',
        role: 'ADMIN',
        email: 'admin.sat@nciipc.gov.in',
        passwordHash: adminHash
      },
      {
        id: 'usr_viewer_1',
        username: 'viewer',
        name: 'Sectoral Observer',
        role: 'VIEWER',
        email: 'observer@cert-in.org.in',
        passwordHash: viewerHash
      }
    ];

    return {
      users: initialUsers,
      cse_entities: [],
      assets: [],
      alerts: [],
      cases: [],
      investigations: [],
      escalations: [],
      findings: [],
      anomalies: [],
      scores: [],
      peer_groups: [],
      supervisor_reviews: [],
      audit_logs: [
        {
          id: 'aud_init_0',
          timestamp: new Date().toISOString(),
          user: 'SYSTEM',
          action: 'SYSTEM_BOOT',
          objectType: 'SYSTEM',
          objectId: 'SYS_0',
          oldValue: null,
          newValue: 'SOClens Supervisory Intelligence Platform Initialized'
        }
      ],
      datasets: [],
      reported_kpis: [],
      evidence_metrics: [],
      kpi_contradictions: [],
      negative_space_gaps: [],
      scoring_weights: { ...DEFAULT_SCORING_WEIGHTS },
      contradiction_thresholds: { ...DEFAULT_CONTRADICTION_THRESHOLDS },
      lastAnalysisTimestamp: null
    };
  }

  public init(): void {
    if (this.isLoaded) return;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.state = {
          ...this.getInitialState(),
          ...parsed,
          scoring_weights: parsed.scoring_weights || { ...DEFAULT_SCORING_WEIGHTS },
          contradiction_thresholds: parsed.contradiction_thresholds || { ...DEFAULT_CONTRADICTION_THRESHOLDS }
        };
      } else {
        // Automatically populate synthetic demo data and run assessment on first boot!
        this.generateDemoData('SYSTEM');
        this.runFullSupervisoryAssessment('SYSTEM');
      }
    } catch (err) {
      console.error('Failed to load database from disk, using fresh state', err);
    }
    this.isLoaded = true;
  }

  public save(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database to disk', err);
    }
  }

  public logAudit(user: string, action: string, objectType: string, objectId: string, oldValue: string | null, newValue: string | null, ipAddress?: string): void {
    const log: AuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      user,
      action,
      objectType,
      objectId,
      oldValue,
      newValue,
      ipAddress
    };
    this.state.audit_logs.unshift(log);
    // Keep max 1000 logs
    if (this.state.audit_logs.length > 1000) {
      this.state.audit_logs = this.state.audit_logs.slice(0, 1000);
    }
    this.save();
  }

  public generateDemoData(user = 'SUPERVISOR'): { recordCounts: Record<string, number> } {
    const demo = generateSyntheticDataset();
    this.state.cse_entities = demo.cses;
    this.state.assets = demo.assets;
    this.state.alerts = demo.alerts;
    this.state.cases = demo.cases;
    this.state.investigations = demo.investigations;
    this.state.escalations = demo.escalations;
    this.state.reported_kpis = demo.reportedKpis;

    const datasetId = `dts_${Date.now()}`;
    const dataset: Dataset = {
      id: datasetId,
      fileName: 'nciipc_synthetic_q3_operational_telemetry.json',
      format: 'SYNTHETIC',
      recordCount: demo.alerts.length + demo.cases.length + demo.assets.length,
      validationStatus: 'VALID',
      warnings: [],
      errors: [],
      uploadedBy: user,
      uploadedAt: new Date().toISOString(),
      analyzedAt: null
    };
    this.state.datasets.unshift(dataset);

    this.logAudit(user, 'DEMO_DATA_GENERATION', 'DATASET', datasetId, null, `Generated 20 CSEs, ${demo.assets.length} assets, ${demo.alerts.length} alerts, ${demo.cases.length} cases.`);

    this.save();

    return {
      recordCounts: {
        cses: demo.cses.length,
        assets: demo.assets.length,
        alerts: demo.alerts.length,
        cases: demo.cases.length,
        investigations: demo.investigations.length,
        escalations: demo.escalations.length,
        reportedKpis: demo.reportedKpis.length
      }
    };
  }

  public runFullSupervisoryAssessment(user = 'SUPERVISOR'): {
    totalFindings: number;
    kpiContradictionsCount: number;
    negativeSpaceGapsCount: number;
    anomaliesCount: number;
    scoresSummary: Record<string, number>;
  } {
    const startTime = Date.now();
    const cses = this.state.cse_entities;
    if (cses.length === 0) {
      this.generateDemoData(user);
    }

    const reportingCycle = '2026-Q3';
    const allFindings: Finding[] = [];
    const allEvidenceMetrics: EvidenceMetric[] = [];
    const allContradictions: KPIContradiction[] = [];
    const allNegativeSpaceGaps: NegativeSpaceGap[] = [];
    const featuresMap = new Map<string, CSEFeatures>();

    // 1. Compute features and Evidence_Metrics independently per CSE
    for (const cse of this.state.cse_entities) {
      const cseAssets = this.state.assets.filter(a => a.cseId === cse.id);
      const cseAlerts = this.state.alerts.filter(a => a.cseId === cse.id);
      const cseCases = this.state.cases.filter(c => c.cseId === cse.id);
      const cseInvs = this.state.investigations.filter(i => i.cseId === cse.id);
      const cseEscs = this.state.escalations.filter(e => e.cseId === cse.id);

      const features = computeCSEFeatures(cse.id, cseAssets, cseAlerts, cseCases, cseInvs, cseEscs);
      featuresMap.set(cse.id, features);

      const evMetric = computeEvidenceMetrics(cse.id, reportingCycle, cseCases, cseInvs);
      allEvidenceMetrics.push(evMetric);

      // Rule Engine Execution
      const ruleFindings = runRuleEngine(cse.id, cseAssets, cseAlerts, cseCases, cseInvs, cseEscs);
      allFindings.push(...ruleFindings);

      // Negative Space Engine Execution
      const { findings: nsFindings, gaps: nsGaps } = runNegativeSpaceEngine(
        cse.id, cseAssets, cseAlerts, cseCases, cseInvs, cseEscs
      );
      allFindings.push(...nsFindings);
      allNegativeSpaceGaps.push(...nsGaps);

      // KPI-Evidence Contradiction Engine Execution
      // Signal A: Reported KPI
      const reportedKpi = this.state.reported_kpis.find(k => k.cseId === cse.id && k.reportingCycle === reportingCycle);
      // Signal B: evMetric (computed completely independently)
      const { contradictions: cseContra, findings: contraFindings } = runContradictionEngine(
        cse.id,
        reportedKpi,
        evMetric,
        cseCases.length,
        this.state.contradiction_thresholds
      );
      allContradictions.push(...cseContra);
      allFindings.push(...contraFindings);
    }

    this.state.evidence_metrics = allEvidenceMetrics;
    this.state.kpi_contradictions = allContradictions;
    this.state.negative_space_gaps = allNegativeSpaceGaps;

    // 2. Peer Benchmarking Engine
    const { peerGroups, deviations, findings: peerFindings } = computePeerGroups(this.state.cse_entities, featuresMap);
    this.state.peer_groups = peerGroups;
    allFindings.push(...peerFindings);

    // 3. Isolation Forest Anomaly Detection
    const featureNames = [
      'closure_time',
      'investigation_time',
      'escalation_rate',
      'repeat_alert_rate',
      'monitoring_coverage',
      'investigation_completeness',
      'critical_alert_ratio',
      'case_reopen_rate'
    ];

    const trainingData: number[][] = [];
    const cseList = this.state.cse_entities;
    for (const cse of cseList) {
      const f = featuresMap.get(cse.id)!;
      trainingData.push([
        f.medianClosureTimeMinutes,
        f.medianInvestigationTimeMinutes,
        f.escalationRate,
        f.repeatAlertRate,
        f.monitoringCoverage,
        f.investigationCompleteness,
        f.criticalAlertRatio,
        f.caseReopenRate
      ]);
    }

    const ifModel = new IsolationForestModel(featureNames, 100, 256);
    ifModel.fit(trainingData);

    const anomalies: Anomaly[] = [];
    for (let i = 0; i < cseList.length; i++) {
      const cse = cseList[i];
      const row = trainingData[i];
      const result = ifModel.explainSample(row, cse.id, trainingData.length);

      const anomalyObj: Anomaly = {
        id: `anom_${cse.id}_${reportingCycle}`,
        cseId: cse.id,
        reportingCycle,
        anomalyScore: result.anomalyScore,
        isAnomaly: result.isAnomaly,
        contributingMetrics: result.contributingMetrics,
        explanation: result.explanation,
        createdAt: new Date().toISOString()
      };
      anomalies.push(anomalyObj);

      if (result.isAnomaly) {
        allFindings.push({
          id: `fnd_anom_${cse.id}`,
          cseId: cse.id,
          category: 'OPERATIONAL_ANOMALY',
          severity: 'HIGH',
          title: 'Potential Operational Anomaly: Unsupervised Telemetry Distribution Outlier',
          reason: result.explanation,
          expectedWorkflow: 'Operational parameters clustering within typical critical sector variance bounds.',
          observedWorkflow: `Isolation Forest anomaly score: ${result.anomalyScore} (Threshold: 0.62)`,
          evidence: {
            anomalyScore: result.anomalyScore,
            contributingMetrics: result.contributingMetrics
          },
          confidence: Number(result.anomalyScore.toFixed(2)),
          recommendedReview: 'Review SOC operational workflow for unusual shifts in resolution velocity or repeat alert cascades.',
          status: 'NEW',
          createdAt: new Date().toISOString()
        });
      }
    }
    this.state.anomalies = anomalies;

    // Preserve existing supervisor reviews / confirmed statuses
    const existingStatusMap = new Map(this.state.findings.map(f => [f.id, { status: f.status, note: f.supervisorNote, reviewedBy: f.reviewedBy, reviewedAt: f.reviewedAt }]));
    for (const f of allFindings) {
      if (existingStatusMap.has(f.id)) {
        const prev = existingStatusMap.get(f.id)!;
        f.status = prev.status;
        f.supervisorNote = prev.note;
        f.reviewedBy = prev.reviewedBy;
        f.reviewedAt = prev.reviewedAt;
      }
    }
    this.state.findings = allFindings;

    // 4. Supervisory Attention Score Engine
    const scoresMap = new Map<string, Score>();
    const scoresList: Score[] = [];

    for (const cse of this.state.cse_entities) {
      const cseDevs = deviations.get(cse.id) || [];
      const anom = anomalies.find(a => a.cseId === cse.id);
      // Historical deterioration: plant CSE-12 as having historical deterioration
      const hasDeterioration = cse.id === 'CSE-12';

      const score = computeAttentionScore(
        cse.id,
        reportingCycle,
        allFindings,
        anom,
        allContradictions,
        cseDevs,
        hasDeterioration,
        this.state.scoring_weights
      );
      scoresMap.set(cse.id, score);
      scoresList.push(score);
    }
    this.state.scores = scoresList;

    // 5. Case Prioritization Queue
    const prioritized = prioritizeCases(this.state.cases, allFindings, this.state.cse_entities, scoresMap);
    this.state.cases = prioritized;

    this.state.lastAnalysisTimestamp = new Date().toISOString();

    const duration = Date.now() - startTime;
    this.logAudit(
      user,
      'ANALYSIS_EXECUTION',
      'ANALYTICS_ENGINE',
      reportingCycle,
      null,
      `Supervisory assessment executed in ${duration}ms. ${allFindings.length} findings, ${allContradictions.length} contradictions, ${allNegativeSpaceGaps.length} negative space gaps.`
    );

    this.save();

    const tierCounts = {
      CRITICAL: scoresList.filter(s => s.tier === 'CRITICAL').length,
      HIGH: scoresList.filter(s => s.tier === 'HIGH').length,
      MODERATE: scoresList.filter(s => s.tier === 'MODERATE').length,
      LOW: scoresList.filter(s => s.tier === 'LOW').length
    };

    return {
      totalFindings: allFindings.length,
      kpiContradictionsCount: allContradictions.length,
      negativeSpaceGapsCount: allNegativeSpaceGaps.length,
      anomaliesCount: anomalies.filter(a => a.isAnomaly).length,
      scoresSummary: tierCounts
    };
  }

  // Getters
  public getState(): DatabaseState {
    return this.state;
  }

  public getUsers(): User[] {
    return this.state.users;
  }

  public getCSEs(): CSEEntity[] {
    return this.state.cse_entities;
  }

  public getCSEById(id: string): CSEEntity | undefined {
    return this.state.cse_entities.find(c => c.id === id || c.code === id);
  }

  public getAssets(cseId?: string): Asset[] {
    if (cseId) return this.state.assets.filter(a => a.cseId === cseId);
    return this.state.assets;
  }

  public getAlerts(cseId?: string): Alert[] {
    if (cseId) return this.state.alerts.filter(a => a.cseId === cseId);
    return this.state.alerts;
  }

  public getCases(cseId?: string): Case[] {
    if (cseId) return this.state.cases.filter(c => c.cseId === cseId);
    return this.state.cases;
  }

  public getCaseById(id: string): Case | undefined {
    return this.state.cases.find(c => c.id === id);
  }

  public getFindings(filter?: { cseId?: string; category?: string; severity?: string; status?: string }): Finding[] {
    let result = this.state.findings;
    if (!filter) return result;

    if (filter.cseId) result = result.filter(f => f.cseId === filter.cseId);
    if (filter.category) result = result.filter(f => f.category === filter.category);
    if (filter.severity) result = result.filter(f => f.severity === filter.severity);
    if (filter.status) result = result.filter(f => f.status === filter.status);

    return result;
  }

  public getFindingById(id: string): Finding | undefined {
    return this.state.findings.find(f => f.id === id);
  }

  public getScores(): Score[] {
    return this.state.scores;
  }

  public getScoreByCSE(cseId: string): Score | undefined {
    return this.state.scores.find(s => s.cseId === cseId);
  }

  public getContradictions(cseId?: string): KPIContradiction[] {
    if (cseId) return this.state.kpi_contradictions.filter(c => c.cseId === cseId);
    return this.state.kpi_contradictions;
  }

  public getNegativeSpaceGaps(cseId?: string): NegativeSpaceGap[] {
    if (cseId) return this.state.negative_space_gaps.filter(g => g.cseId === cseId);
    return this.state.negative_space_gaps;
  }

  public getPeerGroups(): PeerGroup[] {
    return this.state.peer_groups;
  }

  public getAuditLogs(): AuditLog[] {
    return this.state.audit_logs;
  }

  public getSettings(): { scoringWeights: ScoringWeights; contradictionThresholds: ContradictionThresholds } {
    return {
      scoringWeights: this.state.scoring_weights,
      contradictionThresholds: this.state.contradiction_thresholds
    };
  }

  public updateSettings(weights?: Partial<ScoringWeights>, thresholds?: Partial<ContradictionThresholds>, user = 'ADMIN'): void {
    const oldWeights = JSON.stringify(this.state.scoring_weights);
    if (weights) {
      this.state.scoring_weights = { ...this.state.scoring_weights, ...weights };
    }
    if (thresholds) {
      this.state.contradiction_thresholds = { ...this.state.contradiction_thresholds, ...thresholds };
    }
    this.logAudit(user, 'UPDATE_SETTINGS', 'SETTINGS', 'CONFIG_1', oldWeights, JSON.stringify(this.state.scoring_weights));
    // Re-evaluate assessment dynamically with new weights/thresholds
    this.runFullSupervisoryAssessment(user);
    this.save();
  }

  public resetDefaultSettings(user = 'ADMIN'): void {
    this.state.scoring_weights = { ...DEFAULT_SCORING_WEIGHTS };
    this.state.contradiction_thresholds = { ...DEFAULT_CONTRADICTION_THRESHOLDS };
    this.logAudit(user, 'RESET_SETTINGS', 'SETTINGS', 'CONFIG_1', 'custom', 'defaults');
    this.runFullSupervisoryAssessment(user);
    this.save();
  }

  public reviewFinding(
    findingId: string,
    action: 'CONFIRM' | 'DISMISS' | 'NEEDS_REVIEW',
    supervisorUsername: string,
    note: string
  ): Finding {
    const finding = this.state.findings.find(f => f.id === findingId);
    if (!finding) {
      throw new Error(`Finding ${findingId} not found`);
    }

    const prevStatus = finding.status;
    let newStatus: Finding['status'] = 'UNDER_REVIEW';
    if (action === 'CONFIRM') newStatus = 'CONFIRMED';
    else if (action === 'DISMISS') newStatus = 'DISMISSED';
    else if (action === 'NEEDS_REVIEW') newStatus = 'UNDER_REVIEW';

    finding.status = newStatus;
    finding.supervisorNote = note;
    finding.reviewedBy = supervisorUsername;
    finding.reviewedAt = new Date().toISOString();

    // Record review record
    const revRecord: SupervisorReview = {
      id: `rev_${Date.now()}`,
      findingId,
      cseId: finding.cseId,
      supervisorUsername,
      action,
      previousStatus: prevStatus,
      newStatus,
      note,
      timestamp: new Date().toISOString()
    };
    this.state.supervisor_reviews.unshift(revRecord);

    // Audit log
    this.logAudit(
      supervisorUsername,
      `FINDING_${action}`,
      'FINDING',
      findingId,
      prevStatus,
      newStatus
    );

    this.save();
    return finding;
  }

  public reviewContradiction(
    contradictionId: string,
    action: 'CONFIRM' | 'DISMISS' | 'NEEDS_REVIEW',
    supervisorUsername: string,
    note: string
  ): KPIContradiction {
    const contradiction = this.state.kpi_contradictions.find(c => c.id === contradictionId);
    if (!contradiction) {
      throw new Error(`Contradiction ${contradictionId} not found`);
    }

    const prevStatus = contradiction.status;
    let newStatus: KPIContradiction['status'] = 'UNDER_REVIEW';
    if (action === 'CONFIRM') newStatus = 'CONFIRMED';
    else if (action === 'DISMISS') newStatus = 'DISMISSED';
    else if (action === 'NEEDS_REVIEW') newStatus = 'UNDER_REVIEW';

    contradiction.status = newStatus;
    contradiction.supervisorNote = note;

    this.logAudit(
      supervisorUsername,
      `CONTRADICTION_${action}`,
      'KPI_CONTRADICTION',
      contradictionId,
      prevStatus,
      newStatus
    );

    this.save();
    return contradiction;
  }

  public ingestUploadedData(
    fileName: string,
    format: 'CSV' | 'JSON' | 'XML' | 'SQL' | 'XLSX' | string,
    rawText: string,
    user = 'SUPERVISOR'
  ): {
    datasetId: string;
    recordCount: number;
    warnings: string[];
    errors: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];
    let canonicalRecords: {
      case_id: string;
      entity_id: string;
      activity: string;
      timestamp: string;
      severity: string;
      asset_id: string;
      actor_id?: string;
      type?: string;
      status?: string;
      slaCompliance?: number;
      closureRate?: number;
      escalationRate?: number;
    }[] = [];

    // Canonical normalizer
    const toCanonical = (raw: any, index: number) => {
      const caseId = String(
        raw.case_id || raw.caseId || raw.caseID || raw.id || raw.ticket_id || raw.docket_id || `CAS-ING-${Date.now()}-${index}`
      ).trim();
      const entityId = String(
        raw.entity_id || raw.cseId || raw.cse_id || raw.entity || raw.org_id || 'CSE-01'
      ).trim();
      const activity = String(
        raw.activity || raw.title || raw.action || raw.event || raw.category || raw.operation || 'Triage & Case Resolution'
      ).trim();
      const timestamp = String(
        raw.timestamp || raw.createdAt || raw.created_at || raw.time || raw.datetime || new Date().toISOString()
      ).trim();
      const rawSeverity = String(raw.severity || raw.priority || raw.level || 'HIGH').toUpperCase().trim();
      const severity = ['CRITICAL', 'HIGH', 'MODERATE', 'LOW'].includes(rawSeverity) ? rawSeverity : 'HIGH';
      const assetId = String(
        raw.asset_id || raw.assetId || raw.primaryAssetId || raw.system_id || raw.host || 'AST-1001'
      ).trim();
      const actorId = String(
        raw.actor_id || raw.actorId || raw.analyst || raw.user || raw.assigned_to || 'SOC-OPERATOR-1'
      ).trim();

      const type = raw.type || (raw.slaCompliance !== undefined ? 'REPORTED_KPI' : raw.category || raw.activity?.toLowerCase().includes('alert') ? 'ALERT' : 'CASE');

      return {
        case_id: caseId,
        entity_id: entityId,
        activity,
        timestamp,
        severity,
        asset_id: assetId,
        actor_id: actorId,
        type,
        status: raw.status || 'CLOSED',
        slaCompliance: raw.slaCompliance !== undefined ? parseFloat(raw.slaCompliance) : undefined,
        closureRate: raw.closureRate !== undefined ? parseFloat(raw.closureRate) : undefined,
        escalationRate: raw.escalationRate !== undefined ? parseFloat(raw.escalationRate) : undefined
      };
    };

    try {
      const effectiveFormat = (format || 'JSON').toUpperCase();

      // 1. JSON Parser
      if (effectiveFormat === 'JSON' || fileName.toLowerCase().endsWith('.json')) {
        let json: any;
        try {
          json = JSON.parse(rawText);
        } catch (jsonErr: any) {
          throw new Error(`Failed parsing JSON file "${fileName}": Syntax error (${jsonErr.message}). Verify JSON brackets and quotation syntax.`);
        }
        const items = Array.isArray(json) ? json : json.records || json.cases || json.data || [json];
        if (!Array.isArray(items) || items.length === 0) {
          throw new Error(`JSON file "${fileName}" contains no record array or payload elements.`);
        }
        canonicalRecords = items.map((item, idx) => toCanonical(item, idx));
      }

      // 2. CSV Parser
      else if (effectiveFormat === 'CSV' || fileName.toLowerCase().endsWith('.csv')) {
        const lines = rawText.split(/\r?\n/).filter(l => l.trim().length > 0);
        if (lines.length < 2) {
          throw new Error(`CSV file "${fileName}" contains insufficient tabular rows (found ${lines.length} lines; header + data rows required).`);
        }
        // Split header handling quotes
        const parseCSVLine = (line: string) => {
          const result: string[] = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"' || char === "'") {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim().replace(/^["']|["']$/g, ''));
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim().replace(/^["']|["']$/g, ''));
          return result;
        };

        const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[\s_-]/g, ''));
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          if (values.length === 0 || (values.length === 1 && values[0] === '')) continue;
          const rowObj: Record<string, string> = {};
          headers.forEach((h, colIdx) => {
            rowObj[h] = values[colIdx] || '';
          });
          canonicalRecords.push(toCanonical(rowObj, i));
        }
      }

      // 3. XML Parser (Structured legacy SIEM / ticketing export)
      else if (effectiveFormat === 'XML' || fileName.toLowerCase().endsWith('.xml')) {
        if (!rawText.includes('<') || !rawText.includes('>')) {
          throw new Error(`Malformed XML in "${fileName}": No XML tags or markup discovered in file payload.`);
        }

        // Check for unbalanced or truncated XML
        const openRoot = rawText.match(/<([a-zA-Z0-9_-]+)[\s>]/);
        if (!openRoot) {
          throw new Error(`Malformed XML structure in "${fileName}": Could not identify opening root element.`);
        }

        const tagMatches = rawText.match(/<(case|record|ticket|entry|row|alert)[\s\S]*?<\/\1>/gi);
        if (!tagMatches || tagMatches.length === 0) {
          throw new Error(`XML parsing failure in "${fileName}": No valid <case>, <record>, or <ticket> structured nodes found.`);
        }

        canonicalRecords = tagMatches.map((block, idx) => {
          const extractTag = (tag: string) => {
            const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
            return m ? m[1].trim() : '';
          };
          return toCanonical({
            case_id: extractTag('case_id') || extractTag('caseId') || extractTag('id') || extractTag('ticket_id') || extractTag('docket'),
            entity_id: extractTag('entity_id') || extractTag('cse_id') || extractTag('cseId') || extractTag('entity'),
            activity: extractTag('activity') || extractTag('title') || extractTag('summary') || extractTag('action'),
            timestamp: extractTag('timestamp') || extractTag('created_at') || extractTag('createdAt') || extractTag('date'),
            severity: extractTag('severity') || extractTag('priority') || extractTag('level'),
            asset_id: extractTag('asset_id') || extractTag('assetId') || extractTag('primaryAssetId') || extractTag('system'),
            actor_id: extractTag('actor_id') || extractTag('analyst') || extractTag('owner') || extractTag('operator')
          }, idx);
        });
      }

      // 4. SQL / Database Dump Parser (.sql or .db)
      else if (effectiveFormat === 'SQL' || fileName.toLowerCase().endsWith('.sql') || fileName.toLowerCase().endsWith('.db')) {
        // Look for INSERT INTO statements or values
        const insertRegex = /INSERT\s+INTO\s+[`"']?([a-zA-Z0-9_]+)[`"']?\s*(?:\(([^)]+)\))?\s+VALUES\s*([\s\S]+?)(?:;|$)/gi;
        const matches = [...rawText.matchAll(insertRegex)];

        if (matches.length === 0) {
          // If file has SQL words but malformed syntax
          if (rawText.toLowerCase().includes('insert') || rawText.toLowerCase().includes('create table')) {
            throw new Error(`SQL syntax error in "${fileName}": Database dump contains unclosed or malformed INSERT statement syntax.`);
          }
          throw new Error(`SQL database dump error in "${fileName}": No recognizable 'INSERT INTO' records found in export.`);
        }

        let idx = 0;
        for (const match of matches) {
          const colDefs = match[2] ? match[2].split(',').map(c => c.trim().replace(/[`"'\[\]]/g, '').toLowerCase().replace(/[\s_-]/g, '')) : [];
          const valuesSection = match[3];
          const tuples = valuesSection.matchAll(/\(([^)]+)\)/g);
          
          for (const tuple of tuples) {
            const rawVals = tuple[1].split(',').map(v => v.trim().replace(/^['"]|['"]$/g, ''));
            if (colDefs.length > 0) {
              const rowObj: Record<string, string> = {};
              colDefs.forEach((col, cIdx) => {
                rowObj[col] = rawVals[cIdx] || '';
              });
              canonicalRecords.push(toCanonical(rowObj, idx++));
            } else {
              // Standard positional schema: (case_id, entity_id, activity, timestamp, severity, asset_id, actor_id)
              canonicalRecords.push(toCanonical({
                case_id: rawVals[0],
                entity_id: rawVals[1],
                activity: rawVals[2],
                timestamp: rawVals[3],
                severity: rawVals[4],
                asset_id: rawVals[5],
                actor_id: rawVals[6]
              }, idx++));
            }
          }
        }
      }

      // 5. XLSX Spreadsheet Export Parser
      else if (effectiveFormat === 'XLSX' || fileName.toLowerCase().endsWith('.xlsx')) {
        try {
          let workbook: XLSX.WorkBook;
          if (rawText.startsWith('data:')) {
            const base64Data = rawText.split(',')[1];
            workbook = XLSX.read(base64Data, { type: 'base64' });
          } else {
            workbook = XLSX.read(rawText, { type: 'binary' });
          }

          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new Error(`Spreadsheet workbook "${fileName}" contains no valid sheets.`);
          }

          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows: any[] = XLSX.utils.sheet_to_json(firstSheet);
          if (!rows || rows.length === 0) {
            throw new Error(`Spreadsheet "${fileName}" contains empty worksheet with no data rows.`);
          }

          canonicalRecords = rows.map((r, i) => toCanonical(r, i));
        } catch (excelErr: any) {
          throw new Error(`XLSX spreadsheet parsing failed in "${fileName}": ${excelErr.message}`);
        }
      }

      else {
        throw new Error(`Unsupported export format "${format}" for file "${fileName}". System accepts CSV, JSON, XML, SQL (.sql/.db), or XLSX.`);
      }

    } catch (parseError: any) {
      errors.push(parseError.message || `Parsing error in file ${fileName}`);
    }

    if (errors.length === 0 && canonicalRecords.length === 0) {
      errors.push(`Validation failure in "${fileName}": No parseable case management records converted to canonical schema.`);
    }

    const datasetId = `dts_${Date.now()}`;
    const datasetFormat: Dataset['format'] = (['CSV', 'JSON', 'XML', 'SQL', 'XLSX'].includes(format.toUpperCase()) 
      ? format.toUpperCase() 
      : 'JSON') as Dataset['format'];

    const dataset: Dataset = {
      id: datasetId,
      fileName,
      format: datasetFormat,
      recordCount: canonicalRecords.length,
      validationStatus: errors.length > 0 ? 'ERRORS' : warnings.length > 0 ? 'WARNINGS' : 'VALID',
      warnings,
      errors,
      uploadedBy: user,
      uploadedAt: new Date().toISOString(),
      analyzedAt: null
    };

    this.state.datasets.unshift(dataset);
    this.logAudit(
      user, 
      'DATASET_UPLOAD', 
      'DATASET', 
      datasetId, 
      null, 
      `Uploaded ${fileName} [${format}] (${canonicalRecords.length} canonical records: case_id, entity_id, activity, timestamp, severity, asset_id, actor_id)`
    );

    // Downstream pipeline behaves IDENTICALLY once converted to canonical schema
    if (errors.length === 0 && canonicalRecords.length > 0) {
      let ingestedAlerts = 0;
      let ingestedCases = 0;
      let ingestedKpis = 0;

      for (const rec of canonicalRecords) {
        if (rec.type === 'REPORTED_KPI' || rec.slaCompliance !== undefined) {
          this.state.reported_kpis.push({
            id: `kpi-up-${Date.now()}-${ingestedKpis}`,
            cseId: rec.entity_id || 'CSE-01',
            reportingCycle: '2026-Q3',
            slaCompliance: rec.slaCompliance !== undefined ? rec.slaCompliance : 0.92,
            closureRate: rec.closureRate !== undefined ? rec.closureRate : 0.88,
            escalationRate: rec.escalationRate !== undefined ? rec.escalationRate : 0.85,
            createdAt: rec.timestamp || new Date().toISOString()
          });
          ingestedKpis++;
        } else if (rec.type === 'ALERT') {
          this.state.alerts.push({
            id: rec.case_id.startsWith('ALT') ? rec.case_id : `ALT-${rec.case_id}`,
            cseId: rec.entity_id || 'CSE-01',
            assetId: rec.asset_id || 'AST-1001',
            title: rec.activity,
            category: 'MALWARE',
            severity: rec.severity as any,
            createdAt: rec.timestamp,
            acknowledgedAt: rec.timestamp,
            status: (rec.status || 'CLOSED') as any
          });
          ingestedAlerts++;
        } else {
          // Standard canonical Case Docket
          this.state.cases.push({
            id: rec.case_id.startsWith('CAS') ? rec.case_id : `CAS-${rec.case_id}`,
            cseId: rec.entity_id || 'CSE-01',
            title: rec.activity,
            severity: rec.severity as any,
            relatedAlertIds: [],
            primaryAssetId: rec.asset_id || 'AST-1001',
            status: (rec.status || 'CLOSED') as any,
            createdAt: rec.timestamp,
            acknowledgedAt: rec.timestamp,
            investigationStartedAt: rec.timestamp,
            escalatedAt: rec.timestamp,
            closedAt: rec.timestamp,
            closureReason: 'Resolved by CSE Operations Staff',
            reopenedCount: 0
          });
          ingestedCases++;
        }
      }

      dataset.analyzedAt = new Date().toISOString();
      this.runFullSupervisoryAssessment(user);
    }

    this.save();

    return {
      datasetId,
      recordCount: canonicalRecords.length,
      warnings,
      errors
    };
  }
}

export const db = new DatabaseManager();

