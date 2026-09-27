"""
SQLAlchemy PostgreSQL Database Models for SAT-SA
Supervisory Analytics Tool for SOC Assessment
"""

from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime,
    ForeignKey, Text, JSON
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True)
    username = Column(String(64), unique=True, nullable=False, index=True)
    name = Column(String(128), nullable=False)
    role = Column(String(32), nullable=False)  # ADMIN, SUPERVISOR, VIEWER
    email = Column(String(128), unique=True, nullable=False)
    password_hash = Column(String(256), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class CSEEntity(Base):
    __tablename__ = "cse_entities"

    id = Column(String(64), primary_key=True)
    name = Column(String(256), nullable=False)
    code = Column(String(32), unique=True, nullable=False, index=True)
    sector = Column(String(64), nullable=False, index=True)
    criticality = Column(String(32), nullable=False)
    peer_group_id = Column(String(64), nullable=True)
    total_assets = Column(Integer, default=0)
    critical_assets = Column(Integer, default=0)
    contact_email = Column(String(128), nullable=True)
    reporting_cycle = Column(String(32), nullable=False, default="2026-Q3")
    status = Column(String(32), default="ACTIVE")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    assets = relationship("Asset", back_populates="cse", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="cse", cascade="all, delete-orphan")
    cases = relationship("Case", back_populates="cse", cascade="all, delete-orphan")
    investigations = relationship("Investigation", back_populates="cse", cascade="all, delete-orphan")
    escalations = relationship("Escalation", back_populates="cse", cascade="all, delete-orphan")
    findings = relationship("Finding", back_populates="cse", cascade="all, delete-orphan")
    reported_kpis = relationship("ReportedKPI", back_populates="cse", cascade="all, delete-orphan")
    evidence_metrics = relationship("EvidenceMetric", back_populates="cse", cascade="all, delete-orphan")
    kpi_contradictions = relationship("KPIContradiction", back_populates="cse", cascade="all, delete-orphan")

class Asset(Base):
    __tablename__ = "assets"

    id = Column(String(64), primary_key=True)
    cse_id = Column(String(64), ForeignKey("cse_entities.id"), nullable=False, index=True)
    name = Column(String(128), nullable=False)
    ip_address = Column(String(64), nullable=False)
    asset_type = Column(String(64), nullable=False)
    criticality = Column(String(32), nullable=False)
    is_monitored = Column(Boolean, default=True)
    last_monitored_at = Column(DateTime, nullable=True)

    cse = relationship("CSEEntity", back_populates="assets")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(64), primary_key=True)
    cse_id = Column(String(64), ForeignKey("cse_entities.id"), nullable=False, index=True)
    asset_id = Column(String(64), nullable=False, index=True)
    title = Column(String(256), nullable=False)
    category = Column(String(64), nullable=False)
    severity = Column(String(32), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    acknowledged_at = Column(DateTime, nullable=True)
    status = Column(String(32), default="CLOSED")

    cse = relationship("CSEEntity", back_populates="alerts")

class Case(Base):
    __tablename__ = "cases"

    id = Column(String(64), primary_key=True)
    cse_id = Column(String(64), ForeignKey("cse_entities.id"), nullable=False, index=True)
    title = Column(String(256), nullable=False)
    severity = Column(String(32), nullable=False)
    primary_asset_id = Column(String(64), nullable=False)
    status = Column(String(32), default="CLOSED")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    acknowledged_at = Column(DateTime, nullable=True)
    investigation_started_at = Column(DateTime, nullable=True)
    escalated_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)
    closure_reason = Column(Text, nullable=True)
    reopened_count = Column(Integer, default=0)
    priority_score = Column(Integer, default=0)

    cse = relationship("CSEEntity", back_populates="cases")
    investigations = relationship("Investigation", back_populates="case")
    escalations = relationship("Escalation", back_populates="case")

class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(String(64), primary_key=True)
    case_id = Column(String(64), ForeignKey("cases.id"), nullable=False, index=True)
    cse_id = Column(String(64), ForeignKey("cse_entities.id"), nullable=False, index=True)
    investigator_name = Column(String(128), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    evidence_artifact_count = Column(Integer, default=0)
    has_remediation_record = Column(Boolean, default=False)
    remediation_action_summary = Column(Text, nullable=True)

    cse = relationship("CSEEntity", back_populates="investigations")
    case = relationship("Case", back_populates="investigations")

class Escalation(Base):
    __tablename__ = "escalations"

    id = Column(String(64), primary_key=True)
    case_id = Column(String(64), ForeignKey("cases.id"), nullable=False, index=True)
    cse_id = Column(String(64), ForeignKey("cse_entities.id"), nullable=False, index=True)
    escalated_to = Column(String(64), nullable=False)
    escalated_at = Column(DateTime, default=datetime.utcnow)
    reason = Column(Text, nullable=False)
    acknowledged_by_recipient = Column(Boolean, default=True)

    cse = relationship("CSEEntity", back_populates="escalations")
    case = relationship("Case", back_populates="escalations")

class ReportedKPI(Base):
    """
    Supplied by the CSE itself (Signal A).
    One row per CSE per reporting cycle.
    """
    __tablename__ = "reported_kpis"

    id = Column(String(64), primary_key=True)
    cse_id = Column(String(64), ForeignKey("cse_entities.id"), nullable=False, index=True)
    reporting_cycle = Column(String(32), nullable=False, index=True)
    sla_compliance = Column(Float, nullable=False)  # e.g. 0.98
    closure_rate = Column(Float, nullable=False)    # e.g. 0.94
    escalation_rate = Column(Float, nullable=False) # e.g. 0.88
    created_at = Column(DateTime, default=datetime.utcnow)

    cse = relationship("CSEEntity", back_populates="reported_kpis")

class EvidenceMetric(Base):
    """
    Computed independently from raw case/investigation records (Signal B).
    NEVER copied or derived from reported_kpis.
    One row per CSE per reporting cycle.
    """
    __tablename__ = "evidence_metrics"

    id = Column(String(64), primary_key=True)
    cse_id = Column(String(64), ForeignKey("cse_entities.id"), nullable=False, index=True)
    reporting_cycle = Column(String(32), nullable=False, index=True)
    investigation_evidence = Column(Float, nullable=False)  # ratio > 50 words
    remediation_evidence = Column(Float, nullable=False)    # ratio with remediation record
    case_depth = Column(Float, nullable=False)              # mean word count
    repetition_rate = Column(Float, nullable=False)         # TF-IDF cosine similarity
    computed_at = Column(DateTime, default=datetime.utcnow)

    cse = relationship("CSEEntity", back_populates="evidence_metrics")

class KPIContradiction(Base):
    __tablename__ = "kpi_contradictions"

    id = Column(String(64), primary_key=True)
    cse_id = Column(String(64), ForeignKey("cse_entities.id"), nullable=False, index=True)
    reporting_cycle = Column(String(32), nullable=False)
    kpi_name = Column(String(128), nullable=False)
    kpi_value = Column(Float, nullable=False)
    evidence_metric_name = Column(String(128), nullable=False)
    evidence_value = Column(Float, nullable=False)
    threshold_kpi = Column(Float, nullable=False)
    threshold_evidence = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    statement = Column(Text, nullable=False)
    recommended_review = Column(Text, nullable=False)
    status = Column(String(32), default="NEW")  # NEW, UNDER_REVIEW, CONFIRMED, DISMISSED
    supervisor_note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    cse = relationship("CSEEntity", back_populates="kpi_contradictions")

class Finding(Base):
    __tablename__ = "findings"

    id = Column(String(64), primary_key=True)
    cse_id = Column(String(64), ForeignKey("cse_entities.id"), nullable=False, index=True)
    case_id = Column(String(64), nullable=True)
    asset_id = Column(String(64), nullable=True)
    category = Column(String(64), nullable=False, index=True)
    severity = Column(String(32), nullable=False)
    title = Column(String(256), nullable=False)
    reason = Column(Text, nullable=False)
    expected_workflow = Column(Text, nullable=False)
    observed_workflow = Column(Text, nullable=False)
    evidence = Column(JSON, nullable=True)
    confidence = Column(Float, nullable=False)
    recommended_review = Column(Text, nullable=False)
    status = Column(String(32), default="NEW")
    supervisor_note = Column(Text, nullable=True)
    reviewed_by = Column(String(64), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    cse = relationship("CSEEntity", back_populates="findings")

class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(String(64), primary_key=True)
    cse_id = Column(String(64), ForeignKey("cse_entities.id"), nullable=False, index=True)
    reporting_cycle = Column(String(32), nullable=False)
    anomaly_score = Column(Float, nullable=False)
    is_anomaly = Column(Boolean, default=False)
    contributing_metrics = Column(JSON, nullable=True)
    explanation = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Score(Base):
    __tablename__ = "scores"

    id = Column(String(64), primary_key=True)
    cse_id = Column(String(64), ForeignKey("cse_entities.id"), nullable=False, index=True)
    reporting_cycle = Column(String(32), nullable=False)
    overall_score = Column(Integer, nullable=False)
    tier = Column(String(32), nullable=False)  # LOW, MODERATE, HIGH, CRITICAL
    breakdown = Column(JSON, nullable=True)
    radar_capabilities = Column(JSON, nullable=True)
    computed_at = Column(DateTime, default=datetime.utcnow)

class PeerGroup(Base):
    __tablename__ = "peer_groups"

    id = Column(String(64), primary_key=True)
    sector = Column(String(64), nullable=False)
    criticality = Column(String(32), nullable=False)
    cse_count = Column(Integer, default=0)
    stats = Column(JSON, nullable=True)

class SupervisorReview(Base):
    __tablename__ = "supervisor_reviews"

    id = Column(String(64), primary_key=True)
    finding_id = Column(String(64), nullable=True)
    case_id = Column(String(64), nullable=True)
    contradiction_id = Column(String(64), nullable=True)
    cse_id = Column(String(64), nullable=False)
    supervisor_username = Column(String(64), nullable=False)
    action = Column(String(32), nullable=False)
    previous_status = Column(String(32), nullable=False)
    new_status = Column(String(32), nullable=False)
    note = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(64), primary_key=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    user = Column(String(64), nullable=False)
    action = Column(String(64), nullable=False)
    object_type = Column(String(64), nullable=False)
    object_id = Column(String(64), nullable=False)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    ip_address = Column(String(64), nullable=True)

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(String(64), primary_key=True)
    file_name = Column(String(256), nullable=False)
    format = Column(String(32), nullable=False)
    record_count = Column(Integer, default=0)
    validation_status = Column(String(32), default="VALID")
    warnings = Column(JSON, nullable=True)
    errors = Column(JSON, nullable=True)
    uploaded_by = Column(String(64), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    analyzed_at = Column(DateTime, nullable=True)
