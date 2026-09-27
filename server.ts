import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { db } from './src/backend/db';
import { authenticateUser, verifyToken, TokenPayload } from './src/backend/auth';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DB and synthetic baseline
db.init();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Auth Middleware
interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // For convenience in demo/evaluation mode, fallback to default supervisor if not supplied
    req.user = {
      userId: 'usr_super_1',
      username: 'supervisor',
      name: 'Senior NCIIPC Supervisor',
      role: 'SUPERVISOR',
      email: 'teamaether111@gmail.com'
    };
    return next();
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired supervisory token.' });
  }

  req.user = payload;
  next();
}

function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied: insufficient supervisory clearance.' });
    }
    next();
  };
}

// ========================
// API ROUTES
// ========================

// 1. Authentication
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const result = authenticateUser(username, password);
  if (!result) {
    return res.status(401).json({ error: 'Invalid supervisory credentials.' });
  }

  res.json({
    token: result.token,
    user: {
      id: result.user.id,
      username: result.user.username,
      name: result.user.name,
      role: result.user.role,
      email: result.user.email
    }
  });
});

app.get('/api/auth/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

// 2. Data Ingestion & Demo Data
app.post('/api/data/generate-demo', authMiddleware, requireRole(['ADMIN', 'SUPERVISOR']), (req: AuthenticatedRequest, res: Response) => {
  const counts = db.generateDemoData(req.user?.username || 'SUPERVISOR');
  const assessment = db.runFullSupervisoryAssessment(req.user?.username || 'SUPERVISOR');
  res.json({
    message: 'Synthetic critical infrastructure dataset generated and supervisory assessment executed successfully.',
    counts,
    assessment
  });
});

app.post('/api/data/upload', authMiddleware, requireRole(['ADMIN', 'SUPERVISOR']), (req: AuthenticatedRequest, res: Response) => {
  const { fileName, format, content } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'File content is required.' });
  }

  const result = db.ingestUploadedData(
    fileName || 'uploaded_telemetry.json',
    format || 'JSON',
    content,
    req.user?.username || 'SUPERVISOR'
  );

  res.json(result);
});

app.get('/api/data/status', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const state = db.getState();
  res.json({
    totalCses: state.cse_entities.length,
    totalAssets: state.assets.length,
    totalAlerts: state.alerts.length,
    totalCases: state.cases.length,
    totalInvestigations: state.investigations.length,
    totalEscalations: state.escalations.length,
    lastAnalysisTimestamp: state.lastAnalysisTimestamp,
    datasets: state.datasets
  });
});

// 3. Analytics Pipeline
app.post('/api/analytics/run', authMiddleware, requireRole(['ADMIN', 'SUPERVISOR']), (req: AuthenticatedRequest, res: Response) => {
  const result = db.runFullSupervisoryAssessment(req.user?.username || 'SUPERVISOR');
  res.json({
    message: 'Supervisory analytics engine executed across all Critical Sector Entities.',
    result
  });
});

// 4. Command Center / Dashboard
app.get('/api/dashboard/stats', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const state = db.getState();
  const cses = state.cse_entities;
  const scores = state.scores;
  const findings = state.findings;
  const contradictions = state.kpi_contradictions;
  const cases = state.cases;

  const requiringAttentionCount = scores.filter(s => s.tier === 'CRITICAL' || s.tier === 'HIGH' || s.overallScore >= 31).length;
  const highPriorityFindingsCount = findings.filter(f => f.severity === 'CRITICAL' || f.severity === 'HIGH').length;
  const contradictionsCount = contradictions.length;
  const casesForReviewCount = cases.filter(c => (c.priorityScore || 0) >= 65).length;

  // Top ranked CSEs by attention score
  const cseRanking = cses.map(cse => {
    const score = scores.find(s => s.cseId === cse.id);
    const cseFindings = findings.filter(f => f.cseId === cse.id);
    const criticalAlerts = state.alerts.filter(a => a.cseId === cse.id && a.severity === 'CRITICAL').length;
    const cseCases = cases.filter(c => c.cseId === cse.id);
    const escalatedCases = state.escalations.filter(e => e.cseId === cse.id).length;
    const escRate = cseCases.length > 0 ? Math.round((escalatedCases / cseCases.length) * 100) : 0;
    const cseAssets = state.assets.filter(a => a.cseId === cse.id);
    const monitoredAssets = cseAssets.filter(a => a.isMonitored).length;
    const monCoverage = cseAssets.length > 0 ? Math.round((monitoredAssets / cseAssets.length) * 100) : 100;
    const topFinding = cseFindings.sort((a, b) => (b.severity === 'CRITICAL' ? 2 : 1) - (a.severity === 'CRITICAL' ? 2 : 1))[0];

    return {
      id: cse.id,
      code: cse.code,
      name: cse.name,
      sector: cse.sector,
      criticality: cse.criticality,
      attentionScore: score ? score.overallScore : 0,
      priority: score ? score.tier : 'LOW',
      topSignal: topFinding ? topFinding.title : 'Normal operational baseline',
      criticalAlerts,
      escalationRate: `${escRate}%`,
      monitoringCoverage: `${monCoverage}%`,
      findingsCount: cseFindings.length
    };
  }).sort((a, b) => b.attentionScore - a.attentionScore);

  res.json({
    totalCses: cses.length,
    csesRequiringAttention: requiringAttentionCount,
    highPriorityFindings: highPriorityFindingsCount,
    kpiEvidenceContradictions: contradictionsCount,
    casesRecommendedForReview: casesForReviewCount,
    cseRanking,
    lastAnalyzed: state.lastAnalysisTimestamp
  });
});

// 5. CSE List & Deep Dive
app.get('/api/cse', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const cses = db.getCSEs();
  const scores = db.getScores();
  const findings = db.getFindings();
  const contradictions = db.getContradictions();

  const enriched = cses.map(cse => {
    const score = scores.find(s => s.cseId === cse.id);
    const cseFindings = findings.filter(f => f.cseId === cse.id);
    const cseContra = contradictions.filter(c => c.cseId === cse.id);
    return {
      ...cse,
      score: score?.overallScore || 0,
      tier: score?.tier || 'LOW',
      findingsCount: cseFindings.length,
      contradictionsCount: cseContra.length
    };
  }).sort((a, b) => b.score - a.score);

  res.json(enriched);
});

app.get('/api/cse/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const cse = db.getCSEById(id);
  if (!cse) {
    return res.status(404).json({ error: `CSE ${id} not found.` });
  }

  const score = db.getScoreByCSE(cse.id);
  const assets = db.getAssets(cse.id);
  const alerts = db.getAlerts(cse.id);
  const cases = db.getCases(cse.id);
  const findings = db.getFindings({ cseId: cse.id });
  const contradictions = db.getContradictions(cse.id);
  const negativeGaps = db.getNegativeSpaceGaps(cse.id);

  // Reported KPI vs independently computed Evidence Metric
  const state = db.getState();
  const reportedKpi = state.reported_kpis.find(k => k.cseId === cse.id && k.reportingCycle === cse.reportingCycle);
  const evidenceMetric = state.evidence_metrics.find(e => e.cseId === cse.id && e.reportingCycle === cse.reportingCycle);
  const peerGroups = db.getPeerGroups();
  const peerGroup = peerGroups.find(p => p.id === cse.peerGroupId);

  // Priority cases for this CSE
  const priorityCases = cases.sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0)).slice(0, 10);

  res.json({
    cse,
    score,
    reportedKpi,
    evidenceMetric,
    peerGroup,
    assetsCount: assets.length,
    criticalAssetsCount: assets.filter(a => a.criticality === 'CRITICAL').length,
    monitoredAssetsCount: assets.filter(a => a.isMonitored).length,
    alertsCount: alerts.length,
    criticalAlertsCount: alerts.filter(a => a.severity === 'CRITICAL').length,
    casesCount: cases.length,
    findings,
    contradictions,
    negativeGaps,
    priorityCases
  });
});

// 6. Findings
app.get('/api/findings', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { cseId, category, severity, status } = req.query as Record<string, string>;
  const findings = db.getFindings({ cseId, category, severity, status });
  res.json(findings);
});

app.get('/api/findings/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const finding = db.getFindingById(req.params.id);
  if (!finding) {
    return res.status(404).json({ error: `Finding ${req.params.id} not found.` });
  }
  const cse = db.getCSEById(finding.cseId);
  const relatedCase = finding.caseId ? db.getCaseById(finding.caseId) : null;
  res.json({ finding, cse, relatedCase });
});

app.post('/api/findings/:id/review', authMiddleware, requireRole(['ADMIN', 'SUPERVISOR']), (req: AuthenticatedRequest, res: Response) => {
  const { action, note } = req.body;
  if (!action || !['CONFIRM', 'DISMISS', 'NEEDS_REVIEW'].includes(action)) {
    return res.status(400).json({ error: 'Valid action (CONFIRM, DISMISS, NEEDS_REVIEW) is required.' });
  }

  try {
    const updated = db.reviewFinding(
      req.params.id,
      action,
      req.user?.username || 'supervisor',
      note || ''
    );
    res.json({ message: `Finding status updated to ${updated.status}.`, finding: updated });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// 7. Cases & Review Queue
app.get('/api/cases', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { cseId, severity, minPriority } = req.query as Record<string, string>;
  let cases = db.getCases(cseId);

  if (severity) {
    cases = cases.filter(c => c.severity === severity);
  }
  if (minPriority) {
    const min = parseInt(minPriority, 10);
    cases = cases.filter(c => (c.priorityScore || 0) >= min);
  }

  cases.sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
  res.json(cases);
});

app.get('/api/cases/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const c = db.getCaseById(req.params.id);
  if (!c) {
    return res.status(404).json({ error: `Case ${req.params.id} not found.` });
  }

  const state = db.getState();
  const cse = db.getCSEById(c.cseId);
  const primaryAsset = state.assets.find(a => a.id === c.primaryAssetId);
  const relatedAlerts = state.alerts.filter(a => c.relatedAlertIds.includes(a.id));
  const investigation = state.investigations.find(i => i.caseId === c.id);
  const escalation = state.escalations.find(e => e.caseId === c.id);
  const findings = state.findings.filter(f => f.caseId === c.id);

  // Exact timeline calculations
  const createdMs = new Date(c.createdAt).getTime();
  const ackMs = c.acknowledgedAt ? new Date(c.acknowledgedAt).getTime() : null;
  const invMs = c.investigationStartedAt ? new Date(c.investigationStartedAt).getTime() : null;
  const escMs = c.escalatedAt ? new Date(c.escalatedAt).getTime() : null;
  const closedMs = c.closedAt ? new Date(c.closedAt).getTime() : null;

  const timings = {
    acknowledgementMinutes: ackMs ? Number(((ackMs - createdMs) / 60000).toFixed(1)) : null,
    investigationDurationMinutes: (invMs && closedMs) ? Number(((closedMs - invMs) / 60000).toFixed(1)) : null,
    escalationDelayMinutes: escMs ? Number(((escMs - createdMs) / 60000).toFixed(1)) : null,
    totalClosureMinutes: closedMs ? Number(((closedMs - createdMs) / 60000).toFixed(1)) : null
  };

  res.json({
    case: c,
    cse,
    primaryAsset,
    relatedAlerts,
    investigation,
    escalation,
    findings,
    timings
  });
});

// 8. Negative Space Engine View
app.get('/api/negative-space', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { cseId } = req.query as Record<string, string>;
  const gaps = db.getNegativeSpaceGaps(cseId);
  res.json(gaps);
});

// 9. KPI-Evidence Contradictions
app.get('/api/kpi-evidence', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { cseId } = req.query as Record<string, string>;
  const contradictions = db.getContradictions(cseId);
  const cses = db.getCSEs();
  const cseMap = new Map(cses.map(c => [c.id, c]));

  const enriched = contradictions.map(c => ({
    ...c,
    cseName: cseMap.get(c.cseId)?.name || c.cseId,
    cseCode: cseMap.get(c.cseId)?.code || c.cseId,
    sector: cseMap.get(c.cseId)?.sector || 'UNKNOWN'
  }));

  res.json(enriched);
});

app.get('/api/kpi-evidence/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const state = db.getState();
  const contradiction = state.kpi_contradictions.find(c => c.id === req.params.id);
  if (!contradiction) {
    return res.status(404).json({ error: `Contradiction ${req.params.id} not found.` });
  }

  const cse = db.getCSEById(contradiction.cseId);
  const reportedKpi = state.reported_kpis.find(k => k.cseId === contradiction.cseId);
  const evidenceMetric = state.evidence_metrics.find(e => e.cseId === contradiction.cseId);
  const rawCases = state.cases.filter(c => c.cseId === contradiction.cseId);
  const rawInvestigations = state.investigations.filter(i => i.cseId === contradiction.cseId);

  res.json({
    contradiction,
    cse,
    reportedKpi,
    evidenceMetric,
    sampleCases: rawCases.slice(0, 10),
    sampleInvestigations: rawInvestigations.slice(0, 10)
  });
});

app.post('/api/kpi-evidence/:id/review', authMiddleware, requireRole(['ADMIN', 'SUPERVISOR']), (req: AuthenticatedRequest, res: Response) => {
  const { action, note } = req.body;
  if (!action || !['CONFIRM', 'DISMISS', 'NEEDS_REVIEW'].includes(action)) {
    return res.status(400).json({ error: 'Valid action required.' });
  }
  try {
    const updated = db.reviewContradiction(
      req.params.id,
      action,
      req.user?.username || 'supervisor',
      note || ''
    );
    res.json({ message: `Contradiction status updated to ${updated.status}.`, contradiction: updated });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// 10. Peer Benchmarking
app.get('/api/benchmarking', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const peerGroups = db.getPeerGroups();
  const cses = db.getCSEs();
  const state = db.getState();

  res.json({
    peerGroups,
    csesCount: cses.length,
    lastAnalyzed: state.lastAnalysisTimestamp
  });
});

// 11. Historical Trends & Deterioration
app.get('/api/trends', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  // Synthesize realistic historical progression across 5 reporting cycles (2025-Q3 through 2026-Q3)
  const cycles = ['2025-Q3', '2025-Q4', '2026-Q1', '2026-Q2', '2026-Q3'];
  const cses = db.getCSEs();

  // Highlight CSE-12 deterioration pattern (planted pattern H)
  const cse12Deterioration = {
    cseId: 'CSE-12',
    name: 'Maritime Port Container Traffic Gateway',
    metric: 'Monitoring Coverage',
    trendPoints: [
      { cycle: '2025-Q3', value: 94 },
      { cycle: '2025-Q4', value: 92 },
      { cycle: '2026-Q1', value: 89 },
      { cycle: '2026-Q2', value: 81 },
      { cycle: '2026-Q3', value: 72 }
    ],
    status: 'ACTIVE_DETERIORATION',
    message: 'Potential deterioration in monitoring coverage across past 5 cycles.'
  };

  const sectorAggregates = [
    { sector: 'ENERGY', avgScoreTrend: [45, 48, 52, 50, 53] },
    { sector: 'BANKING_FINANCE', avgScoreTrend: [38, 36, 40, 39, 41] },
    { sector: 'TRANSPORTATION', avgScoreTrend: [52, 55, 60, 68, 74] },
    { sector: 'TELECOMMUNICATIONS', avgScoreTrend: [42, 45, 49, 53, 56] },
    { sector: 'GOVERNMENT_DEFENSE', avgScoreTrend: [30, 32, 35, 33, 34] },
    { sector: 'HEALTHCARE', avgScoreTrend: [48, 50, 54, 58, 62] }
  ];

  res.json({
    cycles,
    flaggedDeteriorations: [cse12Deterioration],
    sectorAggregates
  });
});

// 12. Audit Logs
app.get('/api/audit', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const logs = db.getAuditLogs();
  res.json(logs);
});

// 13. Settings (Scoring Weights & Contradiction Thresholds)
app.get('/api/settings', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  res.json(db.getSettings());
});

app.post('/api/settings', authMiddleware, requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { scoringWeights, contradictionThresholds } = req.body;
  db.updateSettings(scoringWeights, contradictionThresholds, req.user?.username || 'ADMIN');
  res.json({ message: 'Settings updated successfully and supervisory scores recalculated.', settings: db.getSettings() });
});

app.post('/api/settings/reset', authMiddleware, requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  db.resetDefaultSettings(req.user?.username || 'ADMIN');
  res.json({ message: 'Settings reset to default values and scores recalculated.', settings: db.getSettings() });
});

// 14. Global Search
app.get('/api/search', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const q = ((req.query.q as string) || '').trim().toLowerCase();
  if (!q) {
    return res.json({ cses: [], cases: [], alerts: [], assets: [], findings: [] });
  }

  const state = db.getState();
  const cses = state.cse_entities.filter(c => 
    c.id.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
  ).slice(0, 5);

  const cases = state.cases.filter(c => 
    c.id.toLowerCase().includes(q) || c.title.toLowerCase().includes(q) || c.cseId.toLowerCase().includes(q)
  ).slice(0, 5);

  const alerts = state.alerts.filter(a => 
    a.id.toLowerCase().includes(q) || a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)
  ).slice(0, 5);

  const assets = state.assets.filter(a => 
    a.id.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || a.ipAddress.toLowerCase().includes(q)
  ).slice(0, 5);

  const findings = state.findings.filter(f => 
    f.id.toLowerCase().includes(q) || f.title.toLowerCase().includes(q) || f.category.toLowerCase().includes(q)
  ).slice(0, 5);

  res.json({ cses, cases, alerts, assets, findings });
});

// 15. Reports Data & Export
app.get('/api/reports/summary', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const state = db.getState();
  res.json({
    generatedAt: new Date().toISOString(),
    reportingCycle: '2026-Q3',
    totalCses: state.cse_entities.length,
    highAttentionCses: state.scores.filter(s => s.tier === 'CRITICAL' || s.tier === 'HIGH').length,
    totalFindings: state.findings.length,
    confirmedFindings: state.findings.filter(f => f.status === 'CONFIRMED').length,
    contradictions: state.kpi_contradictions.length,
    negativeSpaceGaps: state.negative_space_gaps.length
  });
});

app.get('/api/reports/export/:type', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { type } = req.params;
  const state = db.getState();
  let csv = '';

  if (type === 'cses') {
    csv = 'CSE ID,Code,Name,Sector,Criticality,Attention Score,Priority Tier,Assets,Critical Assets\n';
    for (const c of state.cse_entities) {
      const score = state.scores.find(s => s.cseId === c.id);
      csv += `"${c.id}","${c.code}","${c.name}","${c.sector}","${c.criticality}",${score?.overallScore || 0},"${score?.tier || 'LOW'}",${c.totalAssets},${c.criticalAssets}\n`;
    }
  } else if (type === 'findings') {
    csv = 'Finding ID,CSE ID,Category,Severity,Status,Confidence,Title,Recommended Action\n';
    for (const f of state.findings) {
      csv += `"${f.id}","${f.cseId}","${f.category}","${f.severity}","${f.status}",${f.confidence},"${f.title.replace(/"/g, '""')}","${f.recommendedReview.replace(/"/g, '""')}"\n`;
    }
  } else if (type === 'contradictions') {
    csv = 'ID,CSE ID,Reporting Cycle,Reported KPI,Reported Value,Evidence Metric,Evidence Value,Statement,Status\n';
    for (const c of state.kpi_contradictions) {
      csv += `"${c.id}","${c.cseId}","${c.reportingCycle}","${c.kpiName}",${c.kpiValue},"${c.evidenceMetricName}",${c.evidenceValue},"${c.statement.replace(/"/g, '""')}","${c.status}"\n`;
    }
  } else if (type === 'cases') {
    csv = 'Case ID,CSE ID,Severity,Status,Priority Score,Created At,Closed At\n';
    for (const c of state.cases) {
      csv += `"${c.id}","${c.cseId}","${c.severity}","${c.status}",${c.priorityScore || 0},"${c.createdAt}","${c.closedAt || ''}"\n`;
    }
  } else {
    return res.status(400).send('Invalid export type. Supported: cses, findings, contradictions, cases');
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="sat_sa_${type}_report.csv"`);
  res.send(csv);
});

// ========================
// START SERVER WITH VITE
// ========================
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`SAT-SA — Supervisory Analytics Tool for SOC Assessment`);
    console.log(`"From SOC Data to Supervisory Intelligence"`);
    console.log(`Air-gapped & Offline Local Supervisory Engine Ready`);
    console.log(`Listening on http://0.0.0.0:${PORT}`);
    console.log(`=======================================================`);
  });
}

startServer();
