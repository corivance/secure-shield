# Secure Shield — Engineering Rules

Conventions every change must follow. This file is the **distilled, enforced rulebook**; the
**authoritative specs** are [features.md](features.md)When in doubt, those win — but
do not contradict the rules below, which are non-negotiable.

> **Legend:** 🔒 = machine-enforced (a check fails / build breaks if violated) · ▢ = convention (review-enforced).

---

## Stack (do not change without being asked)

- **Frontend:** React 18 + Vite · Jotai (UI state) + TanStack Query (server state) · Tailwind · react-i18next · Axios.
- **Backend:** Node.js v20 + Express, **ES Modules** (`import`/`export`, `"type": "module"`). MongoDB 7 (Mongoose) · Redis 7 · Bull queues, mongoose package.
- ▢ **JavaScript only — never TypeScript.** No `.ts`/`.tsx`, no type annotations, interfaces, or generics.

---

## Backend layering — strict, one direction

```
Routes → Controllers → Services → Repositories → Models
         (+ Middlewares, Workers)
```

**Please use ES6 arrow functions throughout the codebase. Avoid traditional function declarations (function foo() {}) and exported function declarations (export async function foo() {}). Use arrow functions instead (const foo = () => {} or const foo = async () => {}).**

- ▢ **Routes**: wire HTTP → controller. Wrap every async handler in `asyncHandler(...)`. Gate with `auth` + `requirePermission('slug')` / `planGate('feature')`.
- ▢ **Controllers**: validate input, call services, shape the response. Throw `AppError(message, status, CODE, details)` for operational errors. No business logic, no direct DB writes beyond trivial reads.
- ▢ **Services**: business logic, AI calls, queue management.
- ▢ **Repositories are the ONLY place that touches Mongoose / models.** Services and controllers should **never** import from `../models/` or call `Model.find/create/...` directly — go through a repository. (Existing exceptions live in some controllers; do not add new ones.)
- ▢ **Workers** (`src/workers/`): Bull queue processors, run as separate processes.
- ▢ **Repositories return Mongoose docs/queries; services/controllers return plain results.** Keep query logic out of services.

## Frontend layering — strict

```
Pages (compose only) → Hooks (server state) + Components (UI) → Services (HTTP) → apiClient
                                                                  Store (Jotai, UI state only)
```

- 🔒 **Pages = orchestration only.** A file in `frontend/src/pages/` must **not**:
  1. import `apiClient`/`bareClient` or call raw `fetch(` — all HTTP lives in `src/services/*.js`;
  2. call `useQuery(`/`useMutation(` inline — those live in custom hooks in `src/hooks/*.js`;
  3. exceed **500 lines** — extract reusable UI into `src/components/<area>/*.jsx`.
  Importing a service or a custom hook **into** a page is correct and expected.
- ▢ **Components = UI only.** No business logic; prefer hooks/services over `apiClient` (the page rule is enforced; keep components clean by the same spirit).
- ▢ **Hooks** own all `useQuery`/`useMutation`. Keep query keys stable — they drive the cache.
- ▢ **Services** are the only place that calls `apiClient`. Each fn is thin and returns `r.data`.
- ▢ **No hardcoded API URLs in components/pages** — all endpoints come from `src/constants/apiEndpoints.js`.
- ▢ **No hardcoded platform text/branding** (name, logo, colors, emails) — read from the platform settings API via `usePublicSettings()` / `usePlatformSettings()`.
- ▢ **Store** (`src/store/*Atom.js`) holds Jotai atoms for **UI/client state only** — never server data (that's TanStack Query's job).

**Before claiming a frontend change is done, run `npm run lint:structure` in `frontend/` — it must pass.**

**Use ONLY the following color palette: Black (#000000), Charcoal (#73787C), Gray (#C5C6C7), Pale Blue (#D7E5F0), Beige (#C9AD93), Taupe (#554940), and Soft Green (#879A77). Avoid any other colors. Maintain a muted, sophisticated, modern aesthetic with balanced color distribution.**

**Use a centralized Context-based ConfirmProvider for all confirmation dialogs. Do not use window.confirm or create component-specific confirmation modals. All confirmations must use await confirm(...) from the shared context.**

---

## Secrets & configuration

- ▢ **API/provider keys are NEVER in `.env` or code.** They live in MongoDB (`ai_key_configs`), **AES-256 encrypted**, managed via Admin → API Keys. Resolve them with `resolveKey(keyName)`.
- **Only infrastructure secrets belong in `.env`:** `MONGODB_URI`, `REDIS_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `AES_ENCRYPTION_KEY`.
- All platform-visible config (limits, contact text, name/logo/color) is API-driven and DB-backed — nothing hardcoded.

## Auth, RBAC & security

- ▢ **RBAC is fully database-driven — no hardcoded role checks.** Gate access with `requirePermission('content.create')` etc.; the sidebar resolves from `GET /menus/my`. The **only** sanctioned role check is the super-admin bypass: `if (req.user.roleSlug === 'super-admin') return next();` (in `planGate`).
- ▢ **Sensitive model fields use `select: false`** (`passwordHash`, `refreshToken`, `approvalToken`) and must never be returned to clients. Use `user.toPublic()`.
- Passwords: bcrypt-hashed via the model `pre('save')` hook (assign plaintext to `passwordHash`, never hash manually). JWT access + refresh; logout blacklists the token in Redis; refresh tokens rotate.

## API response contract

Every endpoint returns this shape — match it exactly:
```js
// success
{ success: true, message: "string", data: {} }
// error  (produced by errorHandler from AppError)
{ success: false, message: "string", error: { code: "ERROR_CODE", details: {} } }
```

## Commands

```bash
# frontend (cd frontend)
npm run lint:structure   # 🔒 page-structure guardrail — must pass before "done"
npm run build            # runs prebuild (lint:structure) then vite build
npm run dev

# backend (cd backend)
npm run dev              # node --watch src/app.js
npm test                 # node --test
npm run seed             # idempotent seed (roles, permissions, menus, plans, super admin)

# whole stack
./start.sh               # docker (mongo+redis) → seed → backend → workers → frontend
```

If you add a new mechanical rule, encode it as a check (see `frontend/scripts/check-structure.mjs`) so it's enforced, not just documented.

---

## Working style

- ▢ Match the surrounding code — naming, comment density, file layout, idioms. Read a neighbouring file before writing a new one.
- ▢ Preserve behaviour when refactoring: same endpoints, params, query keys, toasts, UX.
- ▢ No placeholder names in generated/sample content ("Company A"). Use realistic, specific names with context.
- ▢ Keep pages thin and push reuse into `components/` (UI), `hooks/` (server state), `services/` (HTTP), `constants/` (strings). When a page approaches 500 lines, split it.

**Anything not covered here:** consult [FEATURES.md](FEATURES.md) and follow the established pattern in nearby code. Do not invent new architectural patterns without being asked.
