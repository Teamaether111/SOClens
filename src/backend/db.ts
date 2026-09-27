import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
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
          newValue: 'SAT-SA Supervisory Intelligence Platform Initialized'
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
    format: 'CSV' | 'JSON',
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
    let parsedRecords: any[] = [];

    try {
      if (format === 'JSON') {
        const json = JSON.parse(rawText);
        parsedRecords = Array.isArray(json) ? json : json.records || [];
      } else {
        // Simple CSV parsing
        const lines = rawText.split('\n').filter(l => l.trim().length > 0);
        if (lines.length > 1) {
          const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
            const row: Record<string, any> = {};
            for (let h = 0; h < headers.length; h++) {
              row[headers[h]] = cols[h];
            }
            parsedRecords.push(row);
          }
        }
      }
    } catch (e: any) {
      errors.push(`Parse failure: ${e.message}`);
    }

    if (parsedRecords.length === 0) {
      errors.push('No parseable records found in uploaded file.');
    }

    const datasetId = `dts_${Date.now()}`;
    const dataset: Dataset = {
      id: datasetId,
      fileName,
      format,
      recordCount: parsedRecords.length,
      validationStatus: errors.length > 0 ? 'ERRORS' : warnings.length > 0 ? 'WARNINGS' : 'VALID',
      warnings,
      errors,
      uploadedBy: user,
      uploadedAt: new Date().toISOString(),
      analyzedAt: null
    };

    this.state.datasets.unshift(dataset);
    this.logAudit(user, 'DATASET_UPLOAD', 'DATASET', datasetId, null, `Uploaded ${fileName} (${parsedRecords.length} records)`);

    // Ingest alerts / cases / reported kpis if present
    if (errors.length === 0 && parsedRecords.length > 0) {
      let ingestedAlerts = 0;
      let ingestedCases = 0;
      let ingestedKpis = 0;

      for (const rec of parsedRecords) {
        if (rec.type === 'ALERT' || rec.alertId || rec.category) {
          this.state.alerts.push({
            id: rec.id || `ALT-UP-${Date.now()}-${ingestedAlerts}`,
            cseId: rec.cseId || 'CSE-01',
            assetId: rec.assetId || 'AST-1001',
            title: rec.title || 'Ingested Telemetry Alert',
            category: rec.category || 'MALWARE',
            severity: rec.severity || 'HIGH',
            createdAt: rec.createdAt || new Date().toISOString(),
            acknowledgedAt: rec.acknowledgedAt || null,
            status: rec.status || 'CLOSED'
          });
          ingestedAlerts++;
        } else if (rec.type === 'CASE' || rec.caseId) {
          this.state.cases.push({
            id: rec.id || `CAS-UP-${Date.now()}-${ingestedCases}`,
            cseId: rec.cseId || 'CSE-01',
            title: rec.title || 'Ingested Docket',
            severity: rec.severity || 'HIGH',
            relatedAlertIds: [],
            primaryAssetId: rec.primaryAssetId || 'AST-1001',
            status: rec.status || 'CLOSED',
            createdAt: rec.createdAt || new Date().toISOString(),
            acknowledgedAt: rec.acknowledgedAt || null,
            investigationStartedAt: rec.investigationStartedAt || null,
            escalatedAt: rec.escalatedAt || null,
            closedAt: rec.closedAt || null,
            closureReason: rec.closureReason || null,
            reopenedCount: 0
          });
          ingestedCases++;
        } else if (rec.type === 'REPORTED_KPI' || rec.slaCompliance !== undefined) {
          this.state.reported_kpis.push({
            id: rec.id || `kpi-up-${Date.now()}-${ingestedKpis}`,
            cseId: rec.cseId || 'CSE-01',
            reportingCycle: rec.reportingCycle || '2026-Q3',
            slaCompliance: parseFloat(rec.slaCompliance) || 0.90,
            closureRate: parseFloat(rec.closureRate) || 0.85,
            escalationRate: parseFloat(rec.escalationRate) || 0.80,
            createdAt: new Date().toISOString()
          });
          ingestedKpis++;
        }
      }

      dataset.analyzedAt = new Date().toISOString();
      this.runFullSupervisoryAssessment(user);
    }

    this.save();

    return {
      datasetId,
      recordCount: parsedRecords.length,
      warnings,
      errors
    };
  }
}

export const db = new DatabaseManager();
