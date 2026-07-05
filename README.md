# 🛡️ SecureShield

**Agentic AI for Health-Insurance Claim Eligibility & Grievance Resolution (India)**

5 Agents · 18 Tools · Zero Hallucination · Aligned to current IRDAI norms (Master Circular 2024, reviewed Jun 2026).

The AI extracts parameters; the **verdict and all money math run in pure deterministic
code** — the *Symbolic Shield*. The same case always produces the same verdict.

> Built to the spec in [FEATURES.MD](FEATURES.MD) and the engineering rules in [CLAUDE.MD](CLAUDE.MD).

---

## Quick start

```bash
./start.sh
```

This deploys SecureShield's own MongoDB + Redis via **`docker stack deploy`**
(Swarm), seeds the database, then runs the API, the Bull worker, and the Vite
frontend.

**Conflict-free ports:** the launcher picks the first **free** host port for each
service (Mongo from `27017`, Redis from `6379`, scanning upward), so it never
fights a host-installed `mongod`/`redis-server` or another project's containers on
the standard ports. Ports already held by SecureShield's own running containers are
reused (Mongo keeps its data volume; ports stay stable across runs). The chosen
ports are written into `backend/.env` (`MONGODB_URI` / `REDIS_URL`), Swarm is
auto-initialised, and stale `secureshield-*` containers from earlier runs are cleared.

> On a busy machine you'll see it land on e.g. Mongo `:27018`, Redis `:6381` — the
> exact ports are printed at the end and saved to `backend/.env`.

Stop the infra stack with `docker stack rm secureshield`.

- Frontend → http://localhost:5173
- API health → http://localhost:4000/api/health
- Seeded admin → `admin@secureshield.in` / `ChangeMe123!`

### Manual

```bash
docker swarm init                    # once, if not already a swarm node
docker stack deploy -c docker-stack.yml secureshield   # mongo + redis
# (or reuse a host-installed mongod/redis-server already on :27017 / :6379)

cd backend
cp .env.example .env
npm install
npm run seed                         # admin, AI key slots, 12 precedents
npm run dev                          # API on :4000
npm run worker                       # (separate shell) Bull dispute worker

cd ../frontend
npm install
npm run dev                          # UI on :5173 (proxies /api → :4000)
```

---

## Architecture

```
Frontend (React 18 + Vite · Jotai + TanStack Query · Tailwind · i18n · Axios)
  Pages (compose only) → Hooks (server state) + Components (UI) → Services (HTTP) → apiClient
                                                                  Store (Jotai, UI state)

Backend (Node 20 + Express, ES Modules · MongoDB/Mongoose · Redis · Bull)
  Routes → Controllers → Services → Repositories → Models
           (+ Middlewares, Workers, Agents, Tools, Engine)
```

### The 5-agent pipeline

| # | Agent | Does |
|---|-------|------|
| 1 | **Policy Agent** | Reads the PDF, extracts & **freezes** rules (`pdf_text_extractor`, `pdf_table_extractor`, `irdai_regulation_lookup`, `rule_validator`) |
| 2 | **Case Agent** | Enriches the case (`medical_term_normalizer`, `icd_procedure_lookup`, `city_tier_classifier`, `hospital_cost_estimator`) |
| – | **Decision Engine** | The deterministic 6-phase *Symbolic Shield* — **zero LLM** |
| 3 | **Explanation Agent** | Plain-language verdict + savings (`clause_explainer`, `savings_calculator`, `what_if_analyzer`) |
| 4 | **Grievance Agent** | IRDAI-backed dispute (`search_irdai_precedents`, `draft_grievance_letter`, `generate_claim_report_pdf`) |
| 5 | **Chat Assistant** | 3-tier resolution (`faq_lookup` → LLM failover → `google_vision_ocr`) |

Plus `audit_trail_logger` — every step is recorded and keyed by a pipeline run ID.

### The deterministic engine (`backend/src/engine/decisionEngine.js`)

Six phases, in order: **exclusions → room rent → sub-limits → waiting periods →
deductibles → co-pays**. No LLM touches the arithmetic, so verdicts never
hallucinate and are fully reproducible. See `backend/test/decisionEngine.test.js`.

---

## Feature → Endpoint map

| Action | Endpoint | Auth |
|--------|----------|:----:|
| Sign up / Log in | `POST /api/auth/signup`, `/login` | – |
| Health | `GET /api/health` | ❌ |
| System info | `GET /api/system-info` | ❌ |
| Auto-fetch API key | `GET /api/auto-key` | ❌ |
| Upload policy PDF | `POST /api/upload-policy` | 🔐 |
| List / view policies | `GET /api/policies`, `/policies/:id` | 🔐 |
| Run eligibility check | `POST /api/check-eligibility` | 🔐 |
| History | `GET /api/history` | 🔐 |
| Audit trail | `GET /api/audit-trail` | 🔐 |
| Chat | `POST /api/chat` | 🔐 |
| Dispute a claim | `POST /api/dispute-claim` | 🔐 |
| Download PDF report | `GET /api/download-report/:file` | 🔐 |

🔐 = `Authorization: Bearer <JWT>` or `X-API-Key`.

---

## Security & compliance

- **JWT** access + refresh; logout blacklists the access token in Redis.
- **RBAC** via `requirePermission()` / `planGate()` with the sanctioned super-admin bypass.
- **Provider keys** are never in `.env` — they live AES-256-GCM encrypted in
  `ai_key_configs` and resolve via `resolveKey()`.
- **Prompt-injection** sanitization on all case/chat input before any LLM.
- **PDF validation** — 20 MB limit, magic-byte + MIME enforcement.
- **Rate limiting** — per-IP sliding window (30/min, 200/hr) in Redis.
- **Path-traversal** protection on report downloads via `path.basename()`.
- **IRDAI norms** — aligned to the Master Circular on Health Insurance (2024,
  ref `IRDAI/HLT/CIR/MISC/77/05/2024`) plus 2025–26 updates: 5-year (60-month)
  moratorium, 36-month waiting-period caps, disclosed co-pay/sub-limits,
  city-tier room-rent caps. Framework + review date live in
  `backend/src/data/complianceFramework.js`. **Decision support, not legal advice.**

---

## Notes on deviations from FEATURES.md

- **Database:** CLAUDE.MD mandates **MongoDB** (non-negotiable). FEATURES.md mentions
  *pgvector*; precedent semantic search is therefore implemented with **in-app cosine
  similarity** over hashed embeddings (`backend/src/utils/embeddings.js`). Swap in a
  real embedding API by populating `Precedent.embedding` at seed time.
- **LLM providers** degrade gracefully: with no keys configured, agents fall back to
  deterministic templates so the whole app remains usable offline. Add real keys via
  the `ai_key_configs` collection (seeded as disabled slots) to activate failover.
- The precedent corpus ships with a curated representative set; expand
  `backend/src/data/precedents.js` toward the full 49 rulings as needed.

---

## Tests

```bash
cd backend && npm test          # deterministic engine (reproducibility, capping, co-pay)
cd frontend && npm run lint:structure   # 🔒 page-structure guardrail
```
