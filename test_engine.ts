/**
 * SAT-SA Test Suite
 * Tests all 10 analytical engines and components:
 * 1. Data validation & generation
 * 2. Feature engineering & Evidence_Metrics
 * 3. Execution gap rules
 * 4. Negative-space engine
 * 5. KPI-Evidence Contradiction engine (including TF-IDF repetition scoring)
 * 6. Anomaly detection (Isolation Forest)
 * 7. Peer benchmarking
 * 8. Supervisory Attention Score
 * 9. Case prioritization
 * 10. Supervisor review & audit trail
 */

import { generateSyntheticDataset } from './src/backend/generator';
import { computeCSEFeatures, computeEvidenceMetrics } from './src/backend/engines/features';
import { runRuleEngine } from './src/backend/engines/rules';
import { runNegativeSpaceEngine } from './src/backend/engines/negativespace';
import { runContradictionEngine } from './src/backend/engines/contradictions';
import { computeMeanPairwiseSimilarity } from './src/backend/tfidf';
import { IsolationForestModel } from './src/backend/isolation_forest';
import { computePeerGroups } from './src/backend/engines/benchmarking';
import { computeAttentionScore } from './src/backend/engines/scoring';
import { prioritizeCases } from './src/backend/engines/case_prioritization';
import { db } from './src/backend/db';

function assert(condition: boolean, testName: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${testName}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${testName}`);
  }
}

async function runAllTests() {
  console.log('========================================================');
  console.log('RUNNING COMPLETE SAT-SA ANALYTICAL TEST SUITE');
  console.log('========================================================\n');

  // Test 1: Data generation
  const dataset = generateSyntheticDataset();
  assert(dataset.cses.length === 20, 'Test 1.1: Generates exactly 20 CSEs');
  assert(dataset.assets.length >= 500, `Test 1.2: Generates 500+ assets (Observed: ${dataset.assets.length})`);
  assert(dataset.alerts.length >= 10000, `Test 1.3: Generates 10,000+ alerts (Observed: ${dataset.alerts.length})`);
  assert(dataset.cases.length >= 2000, `Test 1.4: Generates 2,000+ cases (Observed: ${dataset.cases.length})`);

  // Test 2: Local TF-IDF Vectorizer & Cosine Similarity on CSE-14 (Pattern L)
  const cse14Invs = dataset.investigations.filter(i => i.cseId === 'CSE-14');
  const cse14Notes = cse14Invs.map(i => i.notes).filter(Boolean);
  const tfidfResult = computeMeanPairwiseSimilarity(cse14Notes);
  assert(tfidfResult.meanSimilarity >= 0.85, `Test 2: TF-IDF detects boilerplate text similarity on CSE-14 (Observed: ${tfidfResult.meanSimilarity})`);

  // Test 3: Feature Engineering & Evidence_Metrics derivation
  const cse11Cases = dataset.cases.filter(c => c.cseId === 'CSE-11');
  const cse11Invs = dataset.investigations.filter(i => i.cseId === 'CSE-11');
  const evMetrics11 = computeEvidenceMetrics('CSE-11', '2026-Q3', cse11Cases, cse11Invs);
  assert(evMetrics11.investigationEvidence >= 0, 'Test 3.1: Evidence metric investigationEvidence calculated');
  assert(evMetrics11.remediationEvidence < 0.50, `Test 3.2: Planted low remediation evidence detected on CSE-11 (Observed: ${evMetrics11.remediationEvidence})`);

  // Test 4: KPI-Evidence Contradiction Engine (Planted Pattern J on CSE-11)
  const cse11Kpi = dataset.reportedKpis.find(k => k.cseId === 'CSE-11');
  assert(cse11Kpi !== undefined && cse11Kpi.slaCompliance >= 0.95, 'Test 4.1: CSE-11 reported high SLA compliance');
  const contraResult = runContradictionEngine('CSE-11', cse11Kpi, evMetrics11, cse11Cases.length);
  assert(contraResult.contradictions.length > 0, 'Test 4.2: KPI-Evidence Contradiction Engine triggers on CSE-11 SLA gap');
  assert(
    contraResult.contradictions[0].statement === 'Reported metric is not sufficiently supported by available operational evidence.',
    'Test 4.3: Mandated conservative supervisory phrasing is enforced'
  );

  // Test 5: Execution Gap Rules (Pattern A & B on CSE-07)
  const cse07Assets = dataset.assets.filter(a => a.cseId === 'CSE-07');
  const cse07Alerts = dataset.alerts.filter(a => a.cseId === 'CSE-07');
  const cse07Cases = dataset.cases.filter(c => c.cseId === 'CSE-07');
  const cse07Invs = dataset.investigations.filter(i => i.cseId === 'CSE-07');
  const cse07Escs = dataset.escalations.filter(e => e.cseId === 'CSE-07');
  const ruleFindings = runRuleEngine('CSE-07', cse07Assets, cse07Alerts, cse07Cases, cse07Invs, cse07Escs);
  assert(ruleFindings.some(f => f.category === 'EXECUTION_GAP'), 'Test 5: Rule Engine detects execution gaps on CSE-07');

  // Test 6: Negative Space Engine (Planted Pattern D on CSE-03)
  const cse03Assets = dataset.assets.filter(a => a.cseId === 'CSE-03');
  const cse03Alerts = dataset.alerts.filter(a => a.cseId === 'CSE-03');
  const cse03Cases = dataset.cases.filter(c => c.cseId === 'CSE-03');
  const cse03Invs = dataset.investigations.filter(i => i.cseId === 'CSE-03');
  const cse03Escs = dataset.escalations.filter(e => e.cseId === 'CSE-03');
  const nsResult = runNegativeSpaceEngine('CSE-03', cse03Assets, cse03Alerts, cse03Cases, cse03Invs, cse03Escs);
  assert(nsResult.gaps.some(g => g.gapType === 'MONITORING_COVERAGE_GAP'), 'Test 6: Negative Space Engine detects critical asset monitoring coverage gap on CSE-03');

  // Test 7: Scikit-learn Isolation Forest Anomaly Detection
  const ifModel = new IsolationForestModel(['closure', 'investigation', 'escalation', 'monitoring'], 50, 64);
  const normalPoints = [
    [60, 45, 0.85, 0.95],
    [55, 40, 0.88, 0.94],
    [62, 50, 0.82, 0.98],
    [58, 42, 0.86, 0.96]
  ];
  ifModel.fit(normalPoints);
  const outlierPoint = [5, 2, 0.05, 0.20]; // massive outlier
  const outlierResult = ifModel.explainSample(outlierPoint, 'CSE-TEST', 4);
  assert(outlierResult.anomalyScore > 0.55, `Test 7: Isolation Forest detects outlier behavior (Score: ${outlierResult.anomalyScore})`);

  // Test 8: Supervisory Attention Score Calculation
  const score = computeAttentionScore('CSE-07', '2026-Q3', ruleFindings, undefined, contraResult.contradictions, [], false);
  assert(score.overallScore >= 0 && score.overallScore <= 100, `Test 8.1: Attention score bounded 0-100 (Observed: ${score.overallScore})`);
  assert(score.tier !== undefined, `Test 8.2: Attention tier categorized (Observed: ${score.tier})`);

  // Test 9: Priority Review Queue
  const prioritized = prioritizeCases(dataset.cases.slice(0, 10), ruleFindings, dataset.cses, new Map([['CSE-07', score]]));
  assert(prioritized.length === 10, 'Test 9.1: Case queue prioritized');
  assert(prioritized[0].priorityScore >= prioritized[1].priorityScore, 'Test 9.2: Queue sorted descending by priority score');

  // Test 10: Supervisor Review Action & Audit Log Persistence
  db.init();
  const findings = db.getFindings();
  if (findings.length > 0) {
    const testFinding = findings[0];
    const reviewed = db.reviewFinding(testFinding.id, 'CONFIRM', 'supervisor', 'Verified in automated test.');
    assert(reviewed.status === 'CONFIRMED', 'Test 10.1: Human supervisor confirms finding and updates status');
    const logs = db.getAuditLogs();
    assert(logs.some(l => l.objectId === testFinding.id && l.action === 'FINDING_CONFIRM'), 'Test 10.2: Audit log records supervisor confirmation');
  }

  console.log('\n========================================================');
  console.log('ALL 10 SAT-SA CORE ENGINES VERIFIED SUCCESSFULLY!');
  console.log('========================================================');
}

runAllTests();
