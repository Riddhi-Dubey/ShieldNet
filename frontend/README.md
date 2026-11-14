# ScamShield + ScamTrace Frontend

> Cyber Intelligence & Proactive Scam Defense Platform

## 1. Overview
ScamShield + ScamTrace is a cybersecurity platform combining citizen protection with investigative network correlation.

- **ScamShield (Protection)**: Citizen-facing defense tools including AI Message Checker, Lookalike URL Scanner, Live AI Safety Assistant, Scam Awareness Quiz, and a Consent-Gated Incident Reporting workflow.
- **ScamTrace (Investigation)**: Analyst-facing intelligence engine featuring Universal Entity Search, Cytoscape.js interactive network exploration, Recharts threat analytics, dataset provenance tracking, and formal investigation dossiers.

---

## 2. Tech Stack
- **Framework**: React 18 + Vite
- **Routing**: React Router v6
- **Network Visualizer**: Cytoscape.js (cose layout, multi-hop expansion, entity coloring)
- **Data Visualizations**: Recharts
- **Icons**: Lucide React
- **HTTP Client**: Axios with structured FastAPI error parsing

---

## 3. Directory Layout
```text
frontend/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx           # Top navigation, status indicator, emergency helpline & privacy trigger
│   │   ├── Sidebar.jsx          # Collapsible dual-module sidebar
│   │   ├── StatCard.jsx         # Telemetry metrics cards
│   │   ├── RiskBadge.jsx        # Standardized Low/Medium/High/Critical & Synthetic badges
│   │   ├── SearchBar.jsx        # Universal search bar with auto-type detection
│   │   ├── NetworkGraph.jsx     # Cytoscape.js canvas with filters & zoom controls
│   │   ├── EvidencePanel.jsx    # Dataset provenance and analytical limitations display
│   │   ├── ReportPreview.jsx    # Mandatory pre-submission review & consent checkbox
│   │   ├── LoadingState.jsx     # Loaders, error boundaries, and empty states
│   │   ├── EmergencyModal.jsx   # Immediate 1930 Helpline & bank freeze guide
│   │   └── PrivacyModal.jsx     # Privacy-first architecture documentation
│   ├── pages/
│   │   ├── Landing.jsx          # Public product introduction & feature overview
│   │   ├── Dashboard.jsx        # Real-time backend KPI statistics & live telemetry
│   │   ├── MessageChecker.jsx   # AI SMS/message threat analysis & warning signals
│   │   ├── URLChecker.jsx       # Domain reputation, lookalike, and protocol scanner
│   │   ├── Chatbot.jsx          # Conversational safety advisor (anti-OTP safeguards)
│   │   ├── Quiz.jsx             # Categorized cybersecurity awareness quiz
│   │   ├── ReportForm.jsx       # Structured incident report with consent gate
│   │   ├── InvestigationSearch.jsx # Universal cross-vector entity search
│   │   ├── NetworkExplorer.jsx  # Interactive Cytoscape graph explorer
│   │   ├── EntityInvestigation.jsx # Deep-dive entity profile with 1-hop links
│   │   ├── Analytics.jsx        # Recharts distribution and category trends
│   │   ├── DataSources.jsx      # CSV dataset ingestion & provenance tracker
│   │   └── InvestigationReport.jsx # Printable/Exportable threat dossier
│   ├── services/
│   │   └── api.js               # Centralized Axios client for all FastAPI endpoints
│   ├── styles/
│   │   └── theme.css            # Dark cybersecurity theme custom properties & utilities
│   ├── App.jsx                  # Main routing configuration
│   └── main.jsx                 # React root mount
├── package.json
└── vite.config.js
```

---

## 4. Getting Started

### Install Dependencies
```bash
cd frontend
npm install
```

### Configure Backend URL
Create or modify `.env` in `frontend/`:
```env
VITE_API_URL=http://localhost:8000
```
*(By default, Vite also proxies `/api` directly to `http://localhost:8000`)*

### Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build
```bash
npm run build
```
The optimized bundle is output to `frontend/dist/`.
