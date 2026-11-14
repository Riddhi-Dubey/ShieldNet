# ShieldNet: ScamShield + Intelligent Scam Network Mapper

An enterprise-grade, integrated cybersecurity intelligence platform uniting citizen-facing scam defense (**ScamShield**) with forensic entity investigation, multi-hop threat graph analytics, and case management (**ScamTrace**).

Built as a single, unified web application featuring calibrated Machine Learning classifiers, explainable compound risk heuristics, NetworkX multi-hop graph intelligence, Cytoscape.js interactive graph exploration, structured case management, verifiable threat timelines, strict server-side cryptographic consent gating, and a zero-storage transient scanning architecture.

---

## 1. System Architecture & Single Unified Application

ShieldNet operates as a cohesive full-stack web application combining a modern React 18 single-page application with a high-performance FastAPI asynchronous backend:

```
ShieldNet/
├── frontend/                         # React 18 + Vite Production SPA
│   ├── src/
│   │   ├── components/               # Cytoscape Graph, Timeline, EvidencePanel,
│   │   │                             # PrivacyModal, RiskBadge, SearchBar, Navbar
│   │   ├── pages/                    # Landing, Dashboard, MessageChecker, URLChecker,
│   │   │                             # Quiz, Chatbot, Search, EntityInvestigation,
│   │   │                             # CaseManagement, NetworkExplorer, Analytics
│   │   ├── services/api.js           # Centralized Axios API client (cold-start retries,
│   │   │                             # report downloads, error handling)
│   │   └── App.jsx                   # React Router v6 unified navigation layout
│   ├── package.json
│   └── vite.config.js
│
├── backend/                          # FastAPI + SQLAlchemy + SQLite + Scikit-Learn
│   ├── app/
│   │   ├── api/                      # REST Endpoints (ScamShield, ScamTrace, Cases,
│   │   │                             # Dashboard, Analytics, Reports, Auth, Health)
│   │   ├── database/                 # SQLite engine, models & synthetic demo seeds
│   │   ├── graph/                    # NetworkX multi-hop traversal & centrality
│   │   ├── ml/                       # Calibrated ML Models & Training Pipelines:
│   │   │                             # - Message: TF-IDF + Calibrated Logistic Regression
│   │   │                             # - URL: HistGradientBoosting (16 structural features)
│   │   ├── models/                   # 12 SQLAlchemy ORM models (Entity, Case, Report, etc.)
│   │   ├── schemas/                  # Pydantic v2 schemas with input boundaries
│   │   ├── security/                 # PII redaction, URL sanitization, server-side consent, RBAC
│   │   ├── services/                 # Compound heuristics, timeline synthesis,
│   │   │                             # report_generator.py (ASCII .txt dossiers),
│   │   │                             # llm_explainer.py (privacy-first opt-in explainer)
│   │   └── main.py                   # FastAPI entrypoint, restricted CORS, rate limiting
│   ├── data/processed/               # Documented training datasets (message & phishing)
│   ├── tests/                        # 57 automated unit, security & integration tests
│   └── requirements.txt
│
├── main.py                           # Root deployment entrypoint (Render / Cloud web service)
├── requirements.txt                  # Root dependencies for cloud platform buildpacks
├── render.yaml                       # Infrastructure-as-code deployment configuration
└── README.md
```

---

## 2. Integrated Features & Core Capabilities

### ScamShield (Citizen Digital Protection)
- **Compound Suspicious Message Checker (`/shield/message`)**:
  - Explainable compound risk scoring detecting brand impersonation (SBI, HDFC, Police, CBI), urgent coercion (KYC deactivation, power cutoff, arrest), advance fee demands, and malicious links.
  - Zero false-negative reassurance: Compound threats trigger a +35 point multiplier directly elevating phishing SMS lures to High or Critical risk.
  - Strictly in-memory processing: Raw message strings execute statelessly in volatile RAM and are **never persisted to disk or database** during transient scans.
  - Input boundary enforcement: Max 3,000 characters with live character counter and automatic stale result clearance on input change.
  - Downloadable Plain-Text Assessment Dossier (`.txt`): Generates a structured ASCII report that **excludes raw user message content by default** to preserve privacy.
  - Optional Privacy-Preserving AI Explainer: Integrates with external LLMs (Groq, Gemini, OpenAI) **only with explicit user opt-in consent**, transmitting exclusively sanitized indicators and non-sensitive structural tokens.

- **Calibrated ML Phishing URL Scanner (`/shield/url`)**:
  - 16 explainable lexical & structural features (Punycode `xn--`, IP-based hosts, embedded credentials, high-abuse TLDs, Shannon entropy, nested subdomains, sensitive keywords).
  - Powered by a calibrated `HistGradientBoosting` classifier trained with balanced HTTPS distribution across phishing and benign samples to eliminate SSL presence bias.
  - Zero-SSRF architecture: Syntactic and lexical URL parsing without external network requests to untrusted destination servers.
  - Sensitive parameter redaction: Automatically sanitizes query parameters (`token`, `auth`, `password`, `key`, `secret`, `signature`, `session`, `otp`) and user-info components (`user:pass@host`).
  - Transparent **HTTPS Transport Security Caveat**: Explicitly educates users that HTTPS only encrypts transit and does not prove website authenticity (over 80% of phishing sites use valid SSL certificates).

- **AI Cyber Safety Advisor (`/shield/chat`)**:
  - Interactive expert chatbot grounded in verified knowledge bases with **official source attribution** (CERT-In Advisories, RBI Master Directions, NPCI Security Circulars, I4C MHA).
  - Explains compound message warnings, URL signals, and emergency steps without ever prompting for user credentials.

- **Scam Awareness Readiness Quiz (`/shield/quiz`)**:
  - Interactive quiz covering modern social engineering vectors (Digital Arrest scams, UPI QR reversals, fake job task lures).

- **Consented Incident Reporting (`/shield/report`)**:
  - Two-stage submission with automated PII sanitization (redacts OTPs, PINs, passwords, Aadhaar, bank accounts, UPI IDs).
  - Strict **Server-Side Consent Gate**: Reports submitted without an active cryptographic consent token are stored locally and permanently barred from the public ScamTrace graph.

### ScamTrace (Threat Intelligence & Network Mapper)
- **Universal Entity Search (`/trace/search`)**:
  - Multi-vector search across Phone Numbers, URLs/Domains, Bank Accounts/UPI VPAs, and Crypto Wallets.
  - Non-punitive safety principle: Unknown entities display clear warnings and are **never** labeled safe (`UNVERIFIED / INSUFFICIENT EVIDENCE`).
- **Investigation Case Management (`/trace/cases`)**:
  - Dedicated workspace for threat analysts to open cases, assign investigators, set priorities (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), attach suspect entities, maintain chronological forensic notes, and export dossiers.
- **Verifiable Threat Timeline (`/api/entities/{id}/timeline`)**:
  - Chronological timeline tracking first observed date, citizen reports filed, inbound/outbound graph relationships, and case associations using real stored timestamps.
- **Interactive Network Explorer (`/trace/network`)**:
  - Cytoscape visualization with multi-hop neighborhood traversal, interactive node focus, filtering by type, evidence status, and risk level, cluster detection, and graph export.
- **Threat Analytics & Telemetry (`/trace/analytics` & `/trace/dashboard`)**:
  - Real-time KPI counters, threat distribution charts, entity classification breakdowns, and fraud category volumes with visible demonstration-data provenance labels (`SYNTHETIC_DEMO`).

---

## 3. Machine Learning Models & Reproducibility

ShieldNet employs two independently trained and calibrated machine learning models alongside deterministic heuristic engines.

### A. Suspicious Message Classifier
- **Model Architecture**: TF-IDF Character & Word N-grams + Calibrated Logistic Regression (`CalibratedClassifierCV(method='sigmoid')`).
- **Training Script**: `backend/app/ml/train_message_model.py`
- **Dataset**: `backend/data/processed/message_dataset.csv`
  - 76 balanced, realistic samples representing genuine Indian and international digital correspondence.
  - **Phishing/Scam (Label 1)**: Bank KYC deactivation (SBI, HDFC, ICICI), electricity disconnection threats, lottery/prize rewards, part-time Telegram task jobs, fake courier delivery lures, and digital arrest threats.
  - **Legitimate/Benign (Label 0)**: Official transactional debit/credit notifications, valid two-factor OTP alerts, personal conversational messages, order dispatch updates, appointment reminders, and airline confirmations.
- **Test Set Evaluation Metrics (Stratified Split)**:
  - **Accuracy**: 89.47%
  - **Precision**: 90.91%
  - **Recall**: 90.91%
  - **F1-Score**: 90.91%
  - **Confusion Matrix**: `[[7, 1], [1, 10]]`
- **Artifacts**: `backend/app/ml/message_model.joblib`, `message_vectorizer.joblib`, `message_metadata.joblib`.

### B. Phishing URL Classifier
- **Model Architecture**: `HistGradientBoostingClassifier` evaluated against Random Forest with 16 lexical and structural features.
- **Training Script**: `backend/app/ml/train_model.py`
- **Dataset**: `backend/data/processed/phishing_dataset.csv`
  - Balanced across phishing and benign samples, with deliberate balancing of HTTPS/HTTP across both classes to eliminate artificial protocol bias (`https_presence`).
- **Extracted Features**:
  1. `url_length`: Total length of the sanitized URL.
  2. `domain_length`: Hostname length.
  3. `path_length`: Length of URI path.
  4. `num_subdomains`: Number of subdomain labels.
  5. `has_ip`: Hostname is a raw IPv4 or IPv6 address.
  6. `has_punycode`: Hostname contains IDN homograph encoding (`xn--`).
  7. `has_at_symbol`: Embedded credentials or `@` redirection symbol.
  8. `has_suspicious_tld`: High-abuse TLDs (`.top`, `.xyz`, `.fit`, `.online`, etc.).
  9. `sensitive_keywords_count`: Presence of target keywords (`login`, `secure`, `kyc`, `bank`, `update`).
  10. `shannon_entropy`: Character randomness score of hostname.
  11. `has_multiple_subdomains`: Deep subdomain nesting (`> 2`).
  12. `has_hyphen_in_domain`: Hyphen presence in hostname.
  13. `https_presence`: SSL protocol indicator (explicitly balanced across classes).
  14. `num_digits`: Digit count in URL.
  15. `num_special_chars`: Count of non-alphanumeric characters.
  16. `has_port`: Non-standard port specification.
- **Test Set Evaluation Metrics (Stratified Split)**:
  - **Accuracy**: 96.43%
  - **Precision**: 100.00%
  - **Recall**: 92.86%
  - **F1-Score**: 96.30%
  - **ROC-AUC**: 0.990
- **Artifacts**: `backend/app/ml/phishing_model.joblib`, `model_metadata.joblib`.

### C. Offline / Missing Model Resiliency
If ML artifact `.joblib` files are missing or unreadable at runtime:
- The system **does not** fail silently or assign a false benign score.
- It automatically activates conservative heuristic rules, sets the `is_fallback: True` flag, and presents an explicit uncertainty notice to the user:
  > *"Assessment generated using conservative heuristic rules (statistical ML model offline). Results carry higher uncertainty."*

---

## 4. Privacy, Security & Data Handling Safeguards

1. **Zero-Retention Transient Scanning**:
   - The endpoints `POST /api/analyse/message` and `POST /api/analyse/url` perform **0 database writes and 0 disk logging** of submitted text.
   - Analysis executes statelessly in volatile RAM and is immediately garbage-collected upon response dispatch.
2. **Pre-Analysis PII Redaction**:
   - Passwords, OTP codes, PINs, Aadhaar numbers, PAN cards, CVVs, phone numbers, and payment credentials are automatically redacted prior to any downstream evaluation or graph insertion.
3. **Sensitive URL Parameter Stripping**:
   - Sensitive query parameters (`token`, `auth`, `password`, `key`, `secret`, `signature`, `session`, `otp`) and user-info components (`user:pass@host`) are systematically scrubbed and replaced with `[REDACTED]`.
4. **Downloadable Analysis Dossiers (`.txt`)**:
   - Plain-text assessment reports **omit the raw submitted user text by default**, providing only a privacy-redacted preview, timestamp, risk score breakdown, detected indicators, and safety recommendations.
5. **Strict CORS Policy**:
   - Wildcard `*` origins are strictly prohibited when credentials are enabled.
   - Allowed origins are restricted to configured domains via `ALLOWED_ORIGINS` (defaulting to local development ports `5173` and `3000`).
6. **SSRF Immunity**:
   - The URL scanner statically extracts syntactic and lexical features without performing HTTP/DNS resolution requests to untrusted targets.
7. **Demonstration Data Provenance**:
   - All synthetic and benchmark entities are explicitly labeled `SYNTHETIC_DEMO` or `PAYSIM_SIMULATED` to prevent confusion with live law enforcement intelligence.

---

## 5. Assessment Scope & Legal Disclaimers

> [!IMPORTANT]
> **Assessment Scope Notice**: All risk scores, threat tiers, and warnings generated by ShieldNet represent automated heuristic and machine-learning assessments based on statistical indicators and observed threat patterns. They do **not** constitute definitive legal, financial, or forensic determinations of fraud.
>
> A low-risk assessment indicates that known scam signatures and heuristic red flags were not detected in the provided input; it does **not** guarantee that a message, sender, or website is authentic or safe. Always verify independently through official, confirmed channels.

---

## 6. Quickstart & Installation Instructions

### Prerequisites
- **Python**: 3.10 to 3.12 (Python 3.12 verified)
- **Node.js**: 18+ and npm
- **Git**

---

### Step 1: Clone and Configure Environment

1. Clone the repository:
   ```bash
   git clone https://github.com/Riddhi-Dubey/ShieldNet.git
   cd ShieldNet
   ```

2. Configure backend environment:
   ```bash
   cp backend/.env.example backend/.env
   ```
   *Key variables in `backend/.env`:*
   - `ALLOWED_ORIGINS`: Comma-separated list of allowed frontend origins (e.g., `http://localhost:5173,http://localhost:3000`).
   - `DATABASE_URL`: `sqlite:///./scamshield.db` (local SQLite database).
   - `SECRET_KEY`: Random 32-byte secret string for JWT and cryptographic consent signing.
   - `RATE_LIMIT_PER_MINUTE`: Request throttle (default: `60`).
   - `GROQ_API_KEY`, `GEMINI_API_KEY`, `OPENAI_API_KEY`: *(Optional)* Optional API keys for the opt-in AI Explainer layer.

---

### Step 2: Set Up and Run the Backend

1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Initialize the database and train the calibrated ML models:
   ```bash
   python -c "from backend.app.database.init_db import init_db; init_db()"
   python -m backend.app.ml.train_model
   python -m backend.app.ml.train_message_model
   ```

3. Launch the FastAPI backend server:
   ```bash
   python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   - **Backend API**: `http://127.0.0.1:8000`
   - **Interactive Swagger Documentation**: `http://127.0.0.1:8000/docs`
   - **API Health Check**: `http://127.0.0.1:8000/api/health`

---

### Step 3: Set Up and Run the Frontend

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Ensure `frontend/.env` points to your backend instance:
   ```env
   VITE_API_URL=http://localhost:8000
   ```

4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   - **Web Application**: `http://localhost:5173`

5. *(Optional)* Verify production build:
   ```bash
   npm run build
   ```

---

## 7. Running the Automated Test Suite

ShieldNet includes an extensive 57-test automated verification suite covering:
- Authentication & JWT RBAC
- Cryptographic consent tokens and server-side enforcement
- PII redaction and sensitive query parameter sanitization
- Compound risk scoring and non-linear threat boosting
- NetworkX multi-hop graph traversal and cluster detection
- Zero-storage verification on transient scans
- Input length boundary enforcement
- Plain-text assessment report generation
- Strict CORS configuration and SSRF prevention
- Complete frontend-to-backend API contract integration

Run the test suite with:
```bash
python -m pytest backend/tests/ -v
```

*All 57 tests execute locally in ~5 seconds with a 100% pass rate.*

---

## 8. Cloud Deployment Guide

### Backend Deployment (Render / Cloud Web Service)
1. In your Render dashboard, create a new **Web Service** connected to your repository.
2. Select runtime: **Python 3**.
3. **Build Command**:
   ```bash
   pip install -r requirements.txt
   ```
4. **Start Command**:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
5. Configure environment variables in Render:
   - `PYTHON_VERSION`: `3.12.0`
   - `ALLOWED_ORIGINS`: Your Vercel frontend URL (e.g., `https://shieldnet.vercel.app`)
   - `SECRET_KEY`: *(Auto-generate or enter a secure 32-character string)*
   - `DATABASE_URL`: `sqlite:///./scamshield.db`

### Frontend Deployment (Vercel)
1. Import your GitHub repository into Vercel.
2. Set **Root Directory** to `frontend`.
3. Framework Preset: **Vite**.
4. Configure Environment Variable:
   - `VITE_API_URL`: Your deployed Render backend URL (e.g., `https://shieldnet-backend.onrender.com`).
5. Click **Deploy**.

---

## 9. Competition Demonstration Walkthrough

For hackathon judges and evaluation panels, follow this 3-minute reproducible evaluation path:

1. **Step 1: Suspicious Message Assessment (`/shield/message`)**:
   - Click the built-in **SBI KYC Suspension** sample.
   - Observe the compound threat boost elevating the score to **100/100 CRITICAL RISK**.
   - Review the explainable warning signals, the explicit assessment scope notice, and click **Download Assessment Report (.txt)** to verify that raw text is excluded from the generated dossier.
2. **Step 2: Phishing URL Analysis (`/shield/url`)**:
   - Scan `http://sbi-card-reward-redeem.online/login.php`.
   - Observe the ML confidence (98%+), structural warnings (high-abuse `.online` TLD, credential harvesting keywords), and the **HTTPS Transport Security Observation**.
3. **Step 3: Consented Incident Reporting (`/shield/report`)**:
   - Submit a sample complaint containing a live OTP.
   - Click "Proceed to Preview" to verify that the OTP was automatically stripped (`[REDACTED_OTP]`).
   - Check the explicit consent checkbox to share sanitized indicators with ScamTrace.
4. **Step 4: Threat Intelligence Search (`/trace/search`)**:
   - Search `+91 98765 00001`.
   - View the composite threat profile, direct 1-hop connections, and the **Verifiable Threat Timeline**.
5. **Step 5: Case Management Workspace (`/trace/cases`)**:
   - Open a case (e.g., "Operation Ghost Mules"), attach the investigated entity, log an investigator note, and export the forensic dossier in Markdown or CSV.
