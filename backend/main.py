"""
FastAPI Application Entry Point for SAT-SA
Supervisory Analytics Tool for SOC Assessment
"""

from fastapi import FastAPI, HTTPException, Depends, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import os

from backend.engine import PythonAnalyticsEngine

app = FastAPI(
    title="SAT-SA Supervisory Intelligence API",
    description="Supervisory Analytics Tool for SOC Assessment (NCIIPC)",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

analytics_engine = PythonAnalyticsEngine()

class LoginRequest(BaseModel):
    username: str
    password: str

class ReviewRequest(BaseModel):
    action: str  # CONFIRM, DISMISS, NEEDS_REVIEW
    note: Optional[str] = ""

@app.get("/")
def root():
    return {
        "platform": "SAT-SA — Supervisory Analytics Tool for SOC Assessment",
        "tagline": "From SOC Data to Supervisory Intelligence",
        "mandate": "Assisting NCIIPC supervisors in assessing Critical Sector Entity SOC effectiveness",
        "status": "OPERATIONAL",
        "air_gapped": True,
        "offline": True,
        "local_processing": True
    }

@app.get("/api/health")
def health():
    return {"status": "HEALTHY", "timestamp": datetime.utcnow().isoformat()}

@app.post("/api/analytics/evaluate-contradictions")
def evaluate_contradictions(payload: Dict[str, Any]):
    """
    Evaluates reported KPI vs independent evidence metrics.
    """
    cse_id = payload.get("cse_id", "CSE-01")
    reporting_cycle = payload.get("reporting_cycle", "2026-Q3")
    reported_kpi = payload.get("reported_kpi", {})
    cases = payload.get("cases", [])
    investigations = payload.get("investigations", [])

    ev_metrics = analytics_engine.compute_evidence_metrics(cse_id, reporting_cycle, cases, investigations)
    contradictions = analytics_engine.detect_kpi_contradictions(cse_id, reporting_cycle, reported_kpi, ev_metrics)

    return {
        "cse_id": cse_id,
        "reporting_cycle": reporting_cycle,
        "evidence_metrics": ev_metrics,
        "contradictions": contradictions
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
