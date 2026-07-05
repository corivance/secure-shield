# 🛡️ SecureShield — Complete Feature Guide

**Agentic AI for Health-Insurance Claim Eligibility & Grievance Resolution (India)**

This document walks through *every* feature in SecureShield — from the moment a new user signs up, all the way through checking a claim, disputing a denial, and managing their account. It is organized as a **user journey** so you can read it top-to-bottom and understand the full experience.

---

## 📑 Table of Contents

1. [Account & Authentication](#1-account--authentication)
2. [Onboarding & Dashboard](#2-onboarding--dashboard)
3. [Policy Upload & Ingestion](#3-policy-upload--ingestion)
4. [Eligibility Check (Core Feature)](#4-eligibility-check-core-feature)
5. [Understanding the Verdict](#5-understanding-the-verdict)
6. [Grievance / Dispute a Denied Claim](#6-grievance--dispute-a-denied-claim)
7. [Medical Chat Assistant](#7-medical-chat-assistant)
8. [History](#8-history)
9. [Audit Trail](#9-audit-trail)
10. [Settings & API Keys](#10-settings--api-keys)
11. [How It Works (Education)](#11-how-it-works-education)
12. [Behind-the-Scenes Capabilities](#12-behind-the-scenes-capabilities)
13. [Feature → Endpoint Map](#13-feature--endpoint-map)

---

## 1. Account & Authentication

The very first thing a user does. Authentication is done using email and password.

### 1.1 Sign Up
- User visits the **Sign Up** page and provides:
  - **Full Name**
  - **Email address**
  - **Password**
- On submit, the account is created.

### 1.2 Log In
- User signs in with **email + password**.
- A **JWT access token** is issued and stored client-side for the session.

### 1.3 Protected Routes & Session Management
- All app pages (upload, check, dispute, chat, history, audit, settings) are **protected** — unauthenticated users are redirected to login.
- Every API request automatically attaches the JWT (`Authorization: Bearer <token>`).
- **API-Key fallback:** for local/CLI/MCP use, the app can auto-fetch a master HMAC API key (`X-API-Key`) when no session exists.

### 1.4 Log Out
- Ends the session and clears the stored token.

---

## 2. Onboarding & Dashboard

- After login, the user lands on the **home/dashboard** with a sidebar navigation to every feature.
- A **CoverageRing** visual and quick-access cards summarize what the user can do next (upload a policy, run a check, etc.).
- **System Info** is fetched (`GET /api/system-info`) to show which AI providers/models are live.

---

## 3. Policy Upload & Ingestion

> **Agent 1 — Policy Agent (ReAct)**

This is where the user teaches the system about *their* insurance policy.

### 3.1 Upload a Policy PDF
- The user drags & drops (or selects) **any health-insurance policy PDF**.
- Validation on upload:
  - File size ≤ **20 MB**
  - **Magic-byte** check (real PDF, not a renamed file)
  - **MIME type** enforcement
- Endpoint: `POST /api/upload-policy`.

### 3.2 Automatic Rule Extraction
The Policy Agent runs a tool pipeline to read and structure the PDF:
- **`pdf_text_extractor`** — pulls raw text (pdf-parse / pdfjs-dist)
- **`pdf_table_extractor`** — pulls tables (premium plans, limits, sub-limits)
- **`irdai_regulation_lookup`** — cross-references clauses against the IRDAI regulations knowledge base
- **`rule_validator`** — validates and **freezes** the extracted rules

### 3.3 Frozen Rules
- Once extracted, rules are **immutable** ("frozen") and stored in the database.
- This guarantees **reproducibility** — the same case always produces the same verdict.

### 3.4 View Policies
- **List all uploaded policies:** `GET /api/policies`
- **View a single policy's details + extracted rules:** `GET /api/policies/{id}`
- Each policy shows: plan name, insurer, sum insured, and the full list of frozen rules (room rent caps, sub-limits, waiting periods, co-pays, deductibles, exclusions).

---

## 4. Eligibility Check (Core Feature)

> **Agent 2 — Case Agent** → **Deterministic Decision Engine** → **Agent 3 — Explanation Agent**

The heart of the product. The user submits a hospital case and gets an instant, auditable verdict.

### 4.1 Submit Patient Case Details
On the **Check Eligibility** page the user fills in:

| Field | Example | Required |
|:------|:--------|:--------:|
| **Policy** (select from uploaded) | Star Health Premier Gold | ✅ |
| Patient Name | Rajesh Kumar | – |
| Patient Age | 45 | – |
| Room Type | General / Semi-Private / Private / Single AC / Deluxe / Suite / ICU | – |
| Room Cost / Day (₹) | 5000 | – |
| Stay Duration (days) | 3 | – |
| Admission Type | Planned / Emergency | – |
| **Procedure / Diagnosis** | Cataract Surgery | ✅ |
| Procedure Cost (₹) | 60000 | – |
| Pre-existing Conditions | Diabetes | – |
| Hospital Name | Apollo | – |
| City | Mumbai | – |
| **Total Claimed Amount (₹)** | 85000 | ✅ |

Endpoint: `POST /api/check-eligibility`.

> **Security:** all case input is sanitized for **prompt-injection** before reaching any LLM.

### 4.2 Case Enrichment (Agent 2)
The Case Agent automatically enriches the raw input:
- **`medical_term_normalizer`** — expands abbreviations (e.g. *CABG → Coronary Artery Bypass Graft*)
- **`icd_procedure_lookup`** — maps the procedure to its **ICD-10-PCS code** (500+ procedures)
- **`city_tier_classifier`** — classifies the city into **IRDAI Tier 1 / 2 / 3** to apply correct room-rent caps
- **`hospital_cost_estimator`** — benchmarks the claimed cost against regional market rates

### 4.3 Deterministic Decision Engine (Zero LLM)
The enriched facts are run through a **6-phase rule engine** — **no LLM involved in any math**:

1. **Exclusions** — is the procedure excluded by the policy?
2. **Room Rent** — apply per-day caps (% of sum insured or absolute ₹), compute shortfall
3. **Sub-limits** — apply procedure-specific caps
4. **Waiting Periods** — validate against procedure-specific waiting times
5. **Deductibles** — subtract policy deductible
6. **Co-pays** — apply co-payment (incl. age-based 20% for 60+)

This is the **"Symbolic Shield"**: the AI extracts parameters, but the *verdict and the money math are pure deterministic code* → **zero hallucination**.

### 4.4 Live Pipeline Progress
- While processing, the UI streams step-by-step progress (e.g. "🔬 Running `icd_procedure_lookup`…") so the user sees the agents at work.

---

## 5. Understanding the Verdict

> **Agent 3 — Explanation Agent**

After the engine runs, the user receives a clear, human-readable result.

### 5.1 The Verdict
One of three outcomes, with a **coverage percentage** and **total eligible amount**:
- ✅ **Approved**
- ⚠️ **Partial** (some amount capped/deducted)
- ❌ **Denied**

### 5.2 Plain-Language Explanation
- **`clause_explainer`** — explains *each triggered rule* in simple language, with the exact clause reference.
- A rule-by-rule breakdown shows claimed vs. eligible vs. shortfall for room rent, sub-limits, co-pay, etc.

### 5.3 Savings Suggestions
- **`savings_calculator`** + **`what_if_analyzer`** — find the maximum savings the patient could get.
  - Example: *"Downgrade from Private to Semi-Private room to avoid ₹X room-rent deduction."*
- The engine is re-run with modified parameters to show **what-if** scenarios.

### 5.4 Visual Coverage
- A **CoverageRing** component visualizes the percentage of the claim that is covered.

---

## 6. Grievance / Dispute a Denied Claim

> **Agent 4 — Grievance Agent** — the unique differentiator

If a claim is **Denied** or **Partial**, the user can turn that "No" into a formal, legally-backed dispute.

### 6.1 Start a Dispute
- From the **Dispute** page, the user launches the grievance pipeline.
- Endpoint: `POST /api/dispute-claim`.

### 6.2 IRDAI / Legal Precedent Search
- **`search_irdai_precedents`** — semantic search (pgvector) across **49 real IRDAI / Ombudsman / NCDRC / Supreme Court rulings** to find precedents that strengthen the user's case.

### 6.3 Formal Grievance Letter
- **`draft_grievance_letter`** — an LLM drafts a professional letter citing the relevant **IRDAI regulations** and precedents.

### 6.4 Professional PDF Report
- **`generate_claim_report_pdf`** — produces a polished PDF (PDFKit) with the full rule-by-rule breakdown and the grievance letter.

### 6.5 Download the Report
- The user can also download the generated PDF directly: `GET /api/download-report/{filename}`.
- **Security:** path-traversal protected via `path.basename()`.

---

## 7. Medical Chat Assistant

> **Agent 5 — Medical Chat Assistant**

A conversational helper for any policy or medical question, using a cost-efficient **3-tier hierarchy**.

### 7.1 Ask a Question
- The user types any question (policy clauses, medical terms, claim process).
- Endpoint: `POST /api/chat`.

### 7.2 3-Tier Answer Resolution
1. **`faq_lookup`** — instant keyword search in a local `faq.json` (FREE, no LLM)
2. **LLM fallback** — multi-provider model if no FAQ match
3. **`google_vision_ocr`** — OCR for uploaded **medical documents / photos** (1000 free requests/month) to read prescriptions, bills, reports

---

## 8. History

- The **History** page lists the user's recent eligibility checks.
- Endpoint: `GET /api/history`.
- Each entry shows the policy, the case, the verdict, coverage %, and the explanation — so the user can revisit any past decision.

---

## 9. Audit Trail

- The **Audit** page shows a full **compliance traceability log**.
- Endpoint: `GET /api/audit-trail`.
- **`audit_trail_logger`** records *every* agent step: which agent ran, what tools were used, inputs/outputs summaries, durations, and success/failure status — keyed by a unique pipeline run ID.
- This makes every verdict fully **auditable and explainable** for regulatory purposes.

---

## 10. Settings & API Keys

- The **Settings** page lets the user manage their account and access.
- **API Key management:** the app can auto-fetch a master API key (`GET /api/auto-key`) for programmatic / CLI / MCP access, stored locally.
- The key enables tool-style access to the same endpoints outside the browser.

---

## 11. How It Works (Education)

- A dedicated **How It Works** page explains the architecture to the user:
  - The 5-agent pipeline
  - The deterministic "Symbolic Shield"
  - Why verdicts never hallucinate
- Helps users trust the system by showing exactly how decisions are made.

---

## 12. Behind-the-Scenes Capabilities

These power the user features but aren't directly clicked by the user:

| Capability | What it does |
|:-----------|:-------------|
| **Multi-Model Failover** | Auto-switches across 10+ models (Cerebras, Groq, Gemini, Grok, OpenRouter) so the app never goes down on free-tier rate limits |
| **Cloudflare AI Gateway** | Semantic caching of LLM responses + analytics |
| **pgvector Semantic Search** | Powers IRDAI precedent search over regulation chunks |
| **LLM Response Cache** | Database-backed cache to avoid repeat LLM costs |
| **Rate Limiting** | Per-IP sliding window: 30 req/min, 200 req/hr |
| **Input Sanitization** | Prompt-injection detection via compiled regex |
| **PDF Validation** | Size, magic-byte, and MIME enforcement |
| **IRDAI Compliance** | Aligned to the Master Circular on Health Insurance (2024, ref IRDAI/HLT/CIR/MISC/77/05/2024) + 2025–26 updates, reviewed Jun 2026: 5-year moratorium, 36-month waiting-period caps, disclosed co-pay & sub-limits, city-tier room-rent caps. Decision support, not legal advice |
| **Health Check** | `GET /api/health` for uptime monitoring |

---

## 13. Feature → Endpoint Map

| User Action | Endpoint | Auth |
|:------------|:---------|:----:|
| Sign up / Log in | User Auth | – |
| Health check | `GET /api/health` | ❌ |
| System info (models live) | `GET /api/system-info` | ❌ |
| Auto-fetch API key | `GET /api/auto-key` | ❌ |
| Upload policy PDF | `POST /api/upload-policy` | 🔐 |
| List policies | `GET /api/policies` | 🔐 |
| View policy + rules | `GET /api/policies/{id}` | 🔐 |
| Run eligibility check | `POST /api/check-eligibility` | 🔐 |
| View check history | `GET /api/history` | 🔐 |
| View audit trail | `GET /api/audit-trail` | 🔐 |
| Chat assistant | `POST /api/chat` | 🔐 |
| Dispute a claim | `POST /api/dispute-claim` | 🔐 |
| Download PDF report | `GET /api/download-report/{file}` | 🔐 |

> 🔐 = requires `Authorization: Bearer <JWT>` or `X-API-Key`.

---

## 🧭 The Full Journey in One Line

**Sign up → log in  → upload your insurance PDF (rules auto-extracted & frozen) → enter a hospital case → get an instant, deterministic Approved/Partial/Denied verdict with a plain-language explanation and savings tips → if denied, generate a formal IRDAI-backed grievance PDF → ask the chat assistant any follow-up → review your history and the full audit trail anytime.**

---

*5 Agents · 18 Tools · Zero Hallucination · Aligned to current IRDAI norms (Master Circular 2024, reviewed Jun 2026)*
