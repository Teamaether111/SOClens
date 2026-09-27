# SAT-SA — Supervisory Analytics Tool for SOC Assessment
> *"From SOC Data to Supervisory Intelligence"*
>
> *"SIEMs monitor threats. SAT-SA monitors the effectiveness of the SOC itself."*
>
> *"SAT-SA recommends. Supervisors decide."*
>
> *"A green dashboard is not the same as a working SOC. SAT-SA checks whether the two actually agree."*

---

## 1. Executive Overview

**SAT-SA** is a dedicated supervisory analytics platform engineered for **NCIIPC (National Critical Information Infrastructure Protection Centre)** supervisors to evaluate periodic SOC telemetry and case-management submissions from **Critical Sector Entities (CSEs)** across Energy, Banking & Finance, Telecommunications, Transportation, Defense, and Healthcare.

### What SAT-SA is NOT:
- **NOT** a SOC or SIEM
- **NOT** a real-time perimeter monitoring tool
- **NOT** an automated attack detector
- **NOT** a replacement for human supervisors

### What SAT-SA IS:
A specialized **Supervisory Intelligence System** that analyzes operational evidence to identify:
1. **Execution Gaps** (Documented policy vs observed operational behavior)
2. **Negative-Space Indicators** (Evidence that *should exist* based on asset criticality, but *does not*)
3. **KPI-Evidence Contradictions** (Independent cross-check comparing self-reported performance KPIs against raw docket telemetry and local TF-IDF similarity)
4. **Investigation Weaknesses** (Substantive triage vs superficial / boilerplate closures)
5. **Monitoring Blind Spots** (Unmonitored Tier-1 SCADA / network infrastructure)
6. **Operational Anomalies** (Scikit-Learn Isolation Forest outlier detection across 8 SOC behavioral dimensions)
7. **Peer Deviations** (Sectoral and criticality cohort normalization)
8. **Historical Trajectory Deterioration** (Multi-cycle telemetry degradation)

---

## 2. Core Architectural Innovations

```
CSE SOC DATA (Periodic Feed)
      |
      | CSV / JSON / DB Export
      ↓
DATA INGESTION & VALIDATION
      ↓
DATA NORMALIZATION
      ↓
FEATURE ENGINEERING
      |
      +---------------------+---------------------+---------------------+
      |                     |                     |                     |
      ↓                     ↓                     ↓                     ↓
   RULE ENGINE          STATISTICS           ISOLATION FOREST       KPI-EVIDENCE
  (Rules 1 - 7)        (Cohort Medians)     (Unsupervised ML)      CROSS-CHECK
      |                     |                     |             (Reported vs Ev.)
      +---------------------+---------------------+---------------------+
                                   ↓
                         SUPERVISORY SIGNALS
                                   |
         +----------------+--------+--------+----------------+
         |                |                 |                |
         ↓                ↓                 ↓                ↓
   EXECUTION GAPS   NEGATIVE SPACE   OPERATIONAL ANOMALY   KPI-EVIDENCE
   (Bypassed Proc)  (Absent Evidence)  (Isolation Forest)  CONTRADICTIONS
         |                |                 |                |
         +----------------+--------+--------+----------------+
                                   ↓
                         PEER BENCHMARKING
                                   ↓
                     SUPERVISORY ATTENTION SCORE
                               (0–100)
                                   ↓
                         PRIORITY REVIEW QUEUE
                                   ↓
                        HUMAN SUPERVISOR DECISION
                       (Confirm / Dismiss / Review)
                                   ↓
                           AUDIT LOG TRAIL
```

### Core Innovation 1: Negative Space Engine
Identifies evidence that **should exist** given the entity's critical assets and threat landscape, but **does not exist** in the submitted telemetry:
- Critical SCADA assets lacking SIEM log streams
- Critical incidents closed without mandated CERT/NCIIPC escalations
- Entire MITRE threat categories missing despite elevated alert volume

### Core Innovation 2: KPI-Evidence Contradiction Engine
Cross-checks two genuinely independent signals:
- **Signal A (Reported KPI):** Self-declared by the CSE (`sla_compliance`, `closure_rate`, `escalation_rate`).
- **Signal B (Evidence Metric):** Derived directly and independently from raw case dockets and local TF-IDF text similarity (`remediation_evidence`, `investigation_evidence`, `repetition_rate`, `case_depth`).
- **Conservative Phrasing:** *"Reported metric is not sufficiently supported by available operational evidence."* (Never accuses; flags discrepancy for human review).

---

## 3. Technology Stack & Air-Gapped Operation

- **Frontend:** React, TypeScript, Tailwind CSS, Three.js (3D Network Visualization)
- **Backend:** Node.js/TypeScript Express Server (`server.ts`) + Python FastAPI Service (`backend/`)
- **Data Science & ML:** Scikit-Learn (Isolation Forest, local TF-IDF Vectorizer, Cosine Similarity), NumPy, Pandas
- **Database:** PostgreSQL schema with relational mapping and atomic persistence
- **Air-Gapped & Offline Guarantee:**
  - **Zero** external AI API calls (No OpenAI, No Gemini, No Claude)
  - **Zero** external NLP / embedding services (TF-IDF fit locally per CSE at runtime)
  - **100% offline runnable** in sovereign air-gapped data centers.

---

## 4. Quick Start & Execution

### Running Locally with Docker Compose:
```bash
docker compose up --build
```
- Frontend & Platform: `http://localhost:3000`
- Python FastAPI Backend: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

### Running the Live Applet in AI Studio:
The full-stack development server runs directly on port 3000:
```bash
npm run dev
```

### Running the Automated Analytical Test Suite:
```bash
npx tsx test_engine.ts
```

---

## 5. End-to-End Demo Workflow (Section 35)

1. **Login:** Authenticate as `supervisor` with password `supervisor123`.
2. **Generate Demo Data:** Click **"GENERATE DEMO DATA"** in the top navbar. Generates 20 CSEs, 500+ assets, 10,000+ alerts, 2,000+ cases, and intentionally planted patterns A through L.
3. **Run Assessment:** Click **"RUN ASSESSMENT"**. Executes rule analysis, negative space engine, KPI-evidence cross-check, Isolation Forest, and Attention Scoring.
4. **Command Center:** Inspect top-ranked CSEs, attention scores, and the interactive 3D supervisory network.
5. **Inspect Highest Attention CSE:** Open **CSE-07** or **CSE-11** to view the 8-dimension capability radar chart and side-by-side KPI vs Evidence comparison.
6. **Negative Space View:** Open `/negative-space` to review critical SCADA assets missing monitoring on CSE-03.
7. **KPI Contradictions:** Open `/kpi-evidence` to view CSE-11's 98% reported SLA compliance against only 25% observable remediation records.
8. **Case Prioritization:** Open `/cases` to review the ranked queue, then open the top case to inspect the interactive forensic timeline.
9. **Supervisor Adjudication:** Click **"CONFIRM FINDING"** or **"DISMISS SIGNAL"** with a supervisory note.
10. **Audit Log:** Open `/audit` to verify the immutable audit entry.
11. **Supervisory Reports:** Open `/reports` to download official PDF and CSV dossiers.
