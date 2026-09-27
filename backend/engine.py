"""
FastAPI Python Analytics Engine for SAT-SA
Uses scikit-learn IsolationForest, TfidfVectorizer, cosine_similarity,
NumPy and Pandas for local air-gapped supervisory analytics.
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Any, Tuple
from datetime import datetime

class PythonAnalyticsEngine:
    def __init__(
        self,
        sla_threshold: float = 0.95,
        remediation_threshold: float = 0.50,
        closure_threshold: float = 0.90,
        investigation_threshold: float = 0.60,
        repetition_threshold: float = 0.85
    ):
        self.sla_threshold = sla_threshold
        self.remediation_threshold = remediation_threshold
        self.closure_threshold = closure_threshold
        self.investigation_threshold = investigation_threshold
        self.repetition_threshold = repetition_threshold

    def compute_evidence_metrics(self, cse_id: str, reporting_cycle: str, cases: List[Dict], investigations: List[Dict]) -> Dict[str, Any]:
        """
        Computes Signal B (Evidence Metrics) completely independently from raw case records.
        Never references reported KPIs.
        """
        total_cases = len(cases)
        if total_cases == 0:
            return {
                "investigation_evidence": 0.0,
                "remediation_evidence": 0.0,
                "case_depth": 0.0,
                "repetition_rate": 0.0
            }

        detailed_notes_count = 0
        total_words = 0
        notes = []

        for inv in investigations:
            note_text = inv.get("notes") or ""
            words = note_text.split()
            wc = len(words)
            total_words += wc
            if wc >= 50:
                detailed_notes_count += 1
            if note_text.strip():
                notes.append(note_text)

        investigation_evidence = round(detailed_notes_count / total_cases, 3)
        case_depth = round(total_words / max(len(investigations), 1), 1)

        remediation_count = sum(1 for inv in investigations if inv.get("has_remediation_record", False))
        remediation_evidence = round(remediation_count / total_cases, 3)

        # Repetition rate via local TF-IDF Vectorizer + cosine similarity
        repetition_rate = 0.0
        if len(notes) >= 2:
            vectorizer = TfidfVectorizer(stop_words="english")
            try:
                tfidf_matrix = vectorizer.fit_transform(notes)
                sim_matrix = cosine_similarity(tfidf_matrix)
                # Upper triangle mean (excluding diagonal 1.0)
                n = sim_matrix.shape[0]
                triu_indices = np.triu_indices(n, k=1)
                if len(triu_indices[0]) > 0:
                    repetition_rate = round(float(np.mean(sim_matrix[triu_indices])), 3)
            except Exception:
                repetition_rate = 0.0

        return {
            "cse_id": cse_id,
            "reporting_cycle": reporting_cycle,
            "investigation_evidence": investigation_evidence,
            "remediation_evidence": remediation_evidence,
            "case_depth": case_depth,
            "repetition_rate": repetition_rate
        }

    def detect_kpi_contradictions(self, cse_id: str, reporting_cycle: str, reported_kpi: Dict, evidence_metric: Dict) -> List[Dict]:
        """
        Detects contradictions between Signal A (reported KPI) and Signal B (evidence metric).
        Framing: 'Reported metric is not sufficiently supported by available operational evidence.'
        """
        contradictions = []

        # Rule 1: High SLA, low remediation evidence
        if (
            reported_kpi.get("sla_compliance", 0) >= self.sla_threshold
            and evidence_metric.get("remediation_evidence", 0) < self.remediation_threshold
        ):
            contradictions.append({
                "id": f"kpi_contra_sla_{cse_id}_{reporting_cycle}",
                "cse_id": cse_id,
                "reporting_cycle": reporting_cycle,
                "kpi_name": "Reported SLA Compliance",
                "kpi_value": reported_kpi["sla_compliance"],
                "evidence_metric_name": "Remediation Evidence Ratio",
                "evidence_value": evidence_metric["remediation_evidence"],
                "confidence": 0.93,
                "statement": "Reported metric is not sufficiently supported by available operational evidence.",
                "recommended_review": "Review remediation records supporting the reported SLA compliance figure.",
                "status": "NEW"
            })

        # Rule 2: High closure rate, low investigation evidence
        if (
            reported_kpi.get("closure_rate", 0) >= self.closure_threshold
            and evidence_metric.get("investigation_evidence", 0) < self.investigation_threshold
        ):
            contradictions.append({
                "id": f"kpi_contra_cls_{cse_id}_{reporting_cycle}",
                "cse_id": cse_id,
                "reporting_cycle": reporting_cycle,
                "kpi_name": "Reported Closure Rate",
                "kpi_value": reported_kpi["closure_rate"],
                "evidence_metric_name": "Investigation Evidence Ratio (>50 words)",
                "evidence_value": evidence_metric["investigation_evidence"],
                "confidence": 0.89,
                "statement": "Reported metric is not sufficiently supported by available operational evidence.",
                "recommended_review": "Review investigation docket logs for cases marked as resolved without substantive notes.",
                "status": "NEW"
            })

        # Rule 3: Boilerplate repetition rate
        if evidence_metric.get("repetition_rate", 0) >= self.repetition_threshold:
            contradictions.append({
                "id": f"kpi_contra_rep_{cse_id}_{reporting_cycle}",
                "cse_id": cse_id,
                "reporting_cycle": reporting_cycle,
                "kpi_name": "Independent Case Investigations",
                "kpi_value": 1.0,
                "evidence_metric_name": "Investigation Note Text Similarity (TF-IDF Cosine)",
                "evidence_value": evidence_metric["repetition_rate"],
                "confidence": 0.94,
                "statement": "Investigation notes show unusually high textual similarity, consistent with template-driven rather than case-specific review.",
                "recommended_review": "Sample and manually review a subset of flagged investigation notes.",
                "status": "NEW"
            })

        return contradictions

    def run_isolation_forest(self, features_df: pd.DataFrame) -> List[Dict]:
        """
        Runs scikit-learn Isolation Forest on operational metrics dataframe.
        """
        cols = [
            "median_closure_time", "median_investigation_time", "escalation_rate",
            "repeat_alert_rate", "monitoring_coverage", "investigation_completeness",
            "critical_alert_ratio", "case_reopen_rate"
        ]
        X = features_df[cols].fillna(0).values

        clf = IsolationForest(n_estimators=100, contamination=0.15, random_state=42)
        clf.fit(X)

        # Raw anomaly scores: -1 for anomaly, 1 for normal
        preds = clf.predict(X)
        scores = clf.decision_function(X) # lower = more anomalous
        # Map decision function to 0-1 range where >0.60 is anomaly
        norm_scores = 1.0 / (1.0 + np.exp(scores * 2.0))

        results = []
        for idx, row in features_df.iterrows():
            cse_id = row["cse_id"]
            score_val = float(norm_scores[idx])
            is_anomaly = bool(preds[idx] == -1)

            results.append({
                "cse_id": cse_id,
                "anomaly_score": round(score_val, 3),
                "is_anomaly": is_anomaly,
                "explanation": "Unusual operational behaviour detected in CSE SOC telemetry." if is_anomaly else "Operational metrics conform to baseline distribution."
            })

        return results
