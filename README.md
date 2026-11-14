# ShieldNet: ScamShield + Intelligent Scam Network Mapper

An integrated cybersecurity platform uniting citizen-facing scam defense (**ScamShield**) with forensic entity investigation and fraud syndicate intelligence (**ScamTrace**).

Built for local execution without paid external API keys, featuring explainable risk heuristics, NetworkX graph intelligence, Cytoscape interactive graph exploration, and strict server-side privacy consent gating.

---

## 1. System Architecture

```
ShieldNet/
├── frontend/               # React 18 + Vite SPA
│   ├── src/
│   │   ├── components/     # NetworkGraph (Cytoscape), RiskBadge, SearchBar, etc.
│   │   ├── pages/          # Dashboard, MessageChecker, URLChecker, Quiz,
│   │   │                   # Chatbot, InvestigationSearch, EntityInvestigation,
│   │   │                   # NetworkExplorer, Analytics, DataSources, ReportForm
│   │   ├── services/api.js # Centralized Axios API client with error handling
│   │   └── App.jsx         # Router & navigation layout
│   ├── package.json
│   └── vite.config.js
│
└── backend/                # FastAPI + SQLAlchemy + SQLite + NetworkX
    ├── app/
    │   ├── api/            # REST API endpoints (Health, ScamShield, ScamTrace,
    │   │                   # Dashboard, Datasets, Analytics, Reports, Auth)
    │   ├── database/       # SQLite engine, models & synthetic demonstration data
    │   ├── graph/          # NetworkX multi-hop traversal, clusters, centrality
    │   ├── ml/             # Phishing URL lexical feature extraction & classifier
    │   ├── models/         # 10 SQLAlchemy ORM models
    │   ├── schemas/        # Pydantic v2 validation & response schemas
    │   ├── security/       # PII redaction, regex validation, server-side consent
    │   ├── services/       # Explainable message/URL heuristics, chatbot, risk scoring
    │   └── main.py         # Application entry point with CORS configuration
    ├── tests/              # 49 automated unit and end-to-end integration tests
    └── requirements.txt
```

---

## 2. Integrated Features

### ScamShield (Citizen Digital Protection)
- **Suspicious Message Checker (`/shield/message`)**:
  - Explainable weighted heuristic analysis detecting urgency tactics, advance payment demands, OTP/PIN harvesting, prize lures, and impersonation.
  - Generates clear next steps, threat verdicts, and warning signal breakdowns.
  - In-memory processing with **Zero Storage Guarantee** (raw messages are never stored without explicit user consent).
- **Phishing URL Checker (`/shield/url`)**:
  - Heuristic domain inspection detecting IP hosts, typosquatting tokens, suspicious TLDs, and protocol security flags.
  - Fallback ML phishing classifier with graceful degradation if offline.
- **AI Cyber Safety Advisor (`/shield/chat`)**:
  - Interactive expert chatbot grounded in verified cybersecurity playbooks (RBI guidelines, 1930 Helpline, cybercrime.gov.in).
  - Redacts sensitive numbers and account details prior to response generation.
- **Scam Awareness & Defensive Readiness Quiz (`/shield/quiz`)**:
  - Interactive quiz covering modern fraud lures (digital arrest scams, UPI QR reversals, fake job tasks).
  - Server-side answer evaluation and educational guidance.
- **Report-a-Scam & Incident Reporting (`/shield/report`)**:
  - Two-stage submission with automated PII sanitization (redacts OTPs, PINs, passwords).
  - Strict **Server-Side Consent Enforcement**: Threat indicators are only ingested into the ScamTrace intelligence network if the user grants explicit consent.

### ScamTrace (Threat Intelligence & Network Mapper)
- **Universal Entity Search (`/trace/search`)**:
  - Multi-vector search across Phone Numbers, URLs/Domains, Bank Accounts/UPI VPAs, and Crypto Wallets.
  - Multi-hop traversal querying 1-3 degrees of separation.
  - Crucial non-punitive safety principle: Unknown entities display clear uncorroborated warnings and are **never** falsely assumed to be safe.
- **Entity Investigation Dossier (`/trace/investigate/:id`)**:
  - Forensic profiles displaying composite risk scores, graph centrality, evidence provenance, and direct 1-hop connections.
- **Interactive Network Explorer (`/trace/network`)**:
  - Cytoscape visualization with force-directed layouts (`cose`, `concentric`, `breadthfirst`).
  - Distinguishes verified evidence, dataset-derived records, and synthetic demonstration patterns.
  - Dynamic filtering by entity type (`phone`, `url`, `bank`, `wallet`) and threat severity tiers.
- **Threat Analytics & Telemetry (`/trace/analytics` & `/trace/dashboard`)**:
  - Real-time KPI counters, threat distribution charts, entity classification breakdowns, and fraud category volumes.
  - Centrality rankings identifying high-risk syndicate hubs.
- **Dataset Ingestion (`/trace/datasets`)**:
  - CSV file ingestion engine supporting PaySim, PhishTank, Elliptic, and custom formats.
  - Provenance tracking, record counts, and ingestion logs.
- **Forensic Dossier Export (`/trace/report/:id`)**:
  - Complete downloadable investigation reports in CSV and Markdown formats.

---

## 3. Quickstart & Run Instructions (Windows)

### Prerequisites
- Python 3.10+ (Python 3.12 verified)
- Node.js 18+ and npm

---

### Step 1: Start the Backend (FastAPI)

1. Open PowerShell or Command Prompt:
   ```powershell
   cd "C:\Users\Riddhi Dubey\Desktop\ShieldNet"
   ```

2. (Optional) Activate your Python virtual environment if configured:
   ```powershell
   # If using venv:
   .\venv\Scripts\Activate.ps1
   ```

3. Install required Python packages:
   ```powershell
   python -m pip install -r backend/requirements.txt
   ```

4. Initialize the database with synthetic baseline threat records (if not already seeded):
   ```powershell
   python -c "from backend.app.database.init_db import init_db; init_db()"
   ```

5. Launch the FastAPI server with Uvicorn:
   ```powershell
   python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

   - **Backend API**: `http://127.0.0.1:8000`
   - **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
   - **Health Check**: `http://127.0.0.1:8000/api/health`

---

### Step 2: Start the Frontend (React + Vite)

1. Open a second PowerShell or Command Prompt window:
   ```powershell
   cd "C:\Users\Riddhi Dubey\Desktop\ShieldNet\frontend"
   ```

2. Ensure environment configuration points to the backend:
   The `frontend/.env` file is set to:
   ```env
   VITE_API_URL=http://localhost:8000
   ```

3. Launch the development server:
   ```powershell
   npm run dev
   ```
   *(If PowerShell execution policy restricts npm, use `cmd.exe /c "npm run dev"`)*

4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

---

## 4. Running Automated Tests

Run the complete 49-test suite (covering models, security redaction, risk scoring, NetworkX graph algorithms, ScamShield services, ScamTrace endpoints, and frontend-to-backend integration):

```powershell
python -m pytest backend/tests/ -v
```

All 49 unit and integration tests execute locally in under 7 seconds.

---

## 5. Security & Privacy Safeguards

- **Zero Storage Guarantee**: Suspicious messages submitted for analysis are evaluated in memory and discarded without persistence unless the citizen files a consented report.
- **Automatic PII Redaction**: Passwords, OTP codes, PINs, and full payment account credentials are automatically redacted before any internal processing or preview rendering.
- **Server-Side Consent Gate**: Reports submitted without valid, active consent records are logged solely as local citizen incident records and are barred from ingestion into the public ScamTrace graph.
- **Synthetic Data Labeling**: All generated demonstration entities and relationships carry explicit `SYNTHETIC` provenance flags to prevent synthetic correlation from being mistaken for verified criminal intelligence.
- **Explainability**: Risk scores are accompanied by granular evidence snippets, heuristic weight contributions, and investigative disclaimers.
