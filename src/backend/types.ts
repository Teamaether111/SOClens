export type Role = 'ADMIN' | 'SUPERVISOR' | 'VIEWER';

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  email: string;
  passwordHash: string;
}

export type Sector = 'ENERGY' | 'BANKING_FINANCE' | 'TELECOMMUNICATIONS' | 'TRANSPORTATION' | 'GOVERNMENT_DEFENSE' | 'HEALTHCARE';
export type Criticality = 'TIER_1' | 'TIER_2' | 'TIER_3';

export interface CSEEntity {
  id: string;
  name: string;
  code: string;
  sector: Sector;
  criticality: Criticality;
  peerGroupId: string;
  totalAssets: number;
  criticalAssets: number;
  contactEmail: string;
  reportingCycle: string;
  status: 'ACTIVE' | 'PENDING_REVIEW';
  createdAt: string;
}

export interface Asset {
  id: string;
  cseId: string;
  name: string;
  ipAddress: string;
  assetType: 'SERVER' | 'DATABASE' | 'FIREWALL' | 'SCADA_CONTROLLER' | 'WORKSTATION' | 'ROUTER';
  criticality: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  isMonitored: boolean;
  lastMonitoredAt: string | null;
}

export interface Alert {
  id: string;
  cseId: string;
  assetId: string;
  title: string;
  category: 'MALWARE' | 'UNAUTHORIZED_ACCESS' | 'EXFILTRATION' | 'DDOS' | 'POLICY_VIOLATION' | 'CREDENTIAL_STUFFING' | 'LATERAL_MOVEMENT';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  createdAt: string;
  acknowledgedAt: string | null;
  status: 'OPEN' | 'INVESTIGATING' | 'CLOSED';
}

export interface Case {
  id: string;
  cseId: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  relatedAlertIds: string[];
  primaryAssetId: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  acknowledgedAt: string | null;
  investigationStartedAt: string | null;
  escalatedAt: string | null;
  closedAt: string | null;
  closureReason: string | null;
  reopenedCount: number;
  priorityScore?: number;
}

export interface Investigation {
  id: string;
  caseId: string;
  cseId: string;
  investigatorName: string;
  startedAt: string;
  completedAt: string | null;
  notes: string;
  evidenceArtifactCount: number;
  hasRemediationRecord: boolean;
  remediationActionSummary: string | null;
}

export interface Escalation {
  id: string;
  caseId: string;
  cseId: string;
  escalatedTo: 'INTERNAL_CERT' | 'CISO_DESK' | 'SECTORAL_CERT' | 'NCIIPC' | 'VENDOR_RESPONSE';
  escalatedAt: string;
  reason: string;
  acknowledgedByRecipient: boolean;
}

export interface ReportedKPI {
  id: string;
  cseId: string;
  reportingCycle: string;
  slaCompliance: number; // e.g. 0.98 for 98%
  closureRate: number; // e.g. 0.94 for 94%
  escalationRate: number; // e.g. 0.88 for 88%
  createdAt: string;
}

export interface EvidenceMetric {
  id: string;
  cseId: string;
  reportingCycle: string;
  investigationEvidence: number; // ratio of cases with notes > 50 words
  remediationEvidence: number; // ratio of cases with remediation record
  caseDepth: number; // mean word count of investigation notes
  repetitionRate: number; // pairwise cosine similarity of TF-IDF vectors across notes
  computedAt: string;
}

export type ContradictionStatus = 'NEW' | 'UNDER_REVIEW' | 'CONFIRMED' | 'DISMISSED';

export interface KPIContradiction {
  id: string;
  cseId: string;
  reportingCycle: string;
  kpiName: string;
  kpiValue: number;
  evidenceMetricName: string;
  evidenceValue: number;
  thresholdKpi: number;
  thresholdEvidence: number;
  confidence: number; // 0 - 1
  statement: string;
  recommendedReview: string;
  status: ContradictionStatus;
  supervisorNote?: string;
  createdAt: string;
}

export type FindingCategory = 
  | 'EXECUTION_GAP'
  | 'NEGATIVE_SPACE'
  | 'INVESTIGATION_WEAKNESS'
  | 'ESCALATION_WEAKNESS'
  | 'DETECTION_WEAKNESS'
  | 'MONITORING_BLIND_SPOT'
  | 'OPERATIONAL_ANOMALY'
  | 'PEER_DEVIATION'
  | 'HISTORICAL_DETERIORATION'
  | 'KPI_EVIDENCE_CONTRADICTION';

export type FindingSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type FindingStatus = 'NEW' | 'UNDER_REVIEW' | 'CONFIRMED' | 'DISMISSED';

export interface Finding {
  id: string;
  cseId: string;
  caseId?: string;
  assetId?: string;
  category: FindingCategory;
  severity: FindingSeverity;
  title: string;
  reason: string;
  expectedWorkflow: string;
  observedWorkflow: string;
  evidence: Record<string, any>;
  confidence: number; // 0 - 1
  recommendedReview: string;
  status: FindingStatus;
  supervisorNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface Anomaly {
  id: string;
  cseId: string;
  reportingCycle: string;
  anomalyScore: number; // scikit-learn Isolation Forest score
  isAnomaly: boolean;
  contributingMetrics: {
    metric: string;
    observedValue: number;
    expectedRange: [number, number];
    contributionWeight: number;
  }[];
  explanation: string;
  createdAt: string;
}

export interface AttentionScoreBreakdown {
  executionGap: number;
  investigationWeakness: number;
  escalationWeakness: number;
  negativeSpace: number;
  kpiContradiction: number;
  anomaly: number;
  peerDeviation: number;
  historicalDeterioration: number;
}

export interface Score {
  id: string;
  cseId: string;
  reportingCycle: string;
  overallScore: number; // 0 - 100
  tier: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  breakdown: AttentionScoreBreakdown;
  radarCapabilities: {
    threatDetection: number;
    investigation: number;
    escalation: number;
    incidentResponse: number;
    securityOperations: number;
    governanceOversight: number;
    operationalDiscipline: number;
    cyberResilience: number;
  };
  computedAt: string;
}

export interface PeerGroup {
  id: string;
  sector: Sector;
  criticality: Criticality;
  cseCount: number;
  stats: {
    medianEscalationRate: number;
    medianInvestigationTimeMinutes: number;
    medianClosureTimeMinutes: number;
    medianMonitoringCoverage: number;
    medianRepeatAlertRate: number;
    medianCaseReopenRate: number;
  };
}

export interface SupervisorReview {
  id: string;
  findingId?: string;
  caseId?: string;
  contradictionId?: string;
  cseId: string;
  supervisorUsername: string;
  action: 'CONFIRM' | 'DISMISS' | 'NEEDS_REVIEW';
  previousStatus: string;
  newStatus: string;
  note: string;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  objectType: string;
  objectId: string;
  oldValue: string | null;
  newValue: string | null;
  ipAddress?: string;
}

export interface Dataset {
  id: string;
  fileName: string;
  format: 'CSV' | 'JSON' | 'SYNTHETIC';
  recordCount: number;
  validationStatus: 'VALID' | 'WARNINGS' | 'ERRORS';
  warnings: string[];
  errors: string[];
  uploadedBy: string;
  uploadedAt: string;
  analyzedAt: string | null;
}

export interface ScoringWeights {
  executionGap: number; // 0.15
  investigationWeakness: number; // 0.10
  escalationWeakness: number; // 0.10
  negativeSpace: number; // 0.15
  kpiContradiction: number; // 0.15
  anomaly: number; // 0.15
  peerDeviation: number; // 0.10
  historicalDeterioration: number; // 0.10
}

export interface ContradictionThresholds {
  slaComplianceThreshold: number; // 0.95
  remediationEvidenceThreshold: number; // 0.50
  closureRateThreshold: number; // 0.90
  investigationEvidenceThreshold: number; // 0.60
  repetitionRateThreshold: number; // 0.85
}
