# Architecture Notes — LinkBot Dashboard

> Written: 2026-03-13
> Last updated: 2026-03-22
> Purpose: Honest assessment of current state, patterns, and targeted refactoring recommendations.

---

## Phase 1 — Auth + Hardening (completed 2026-03-22)

- **Supabase magic link auth** — `app/login/page.tsx`, `app/auth/callback/route.ts`
- **Route protection** — `proxy.ts` (Next.js 16 equivalent of middleware); redirects unauthenticated users to `/login`
- **RLS policies** — all 6 tables updated to `auth.uid() is not null`; `supabase-migration-v4-auth-rls.sql`
- **Server/browser Supabase split** — `lib/supabase.ts` (browser, no cookies), `lib/supabase-server.ts` (server, reads auth cookies via `@supabase/ssr`)
- **REST API routes** — `/api/tasks`, `/api/tasks/[id]`, `/api/projects`, `/api/projects/[id]` with consistent `{ data }` / `{ error }` shapes; auth via `lib/api-auth.ts`
- **Error handling** — all silent `catch` blocks replaced with error state + UI banners; no swallowed failures anywhere

---

## Phase 2 — Sync Infrastructure (completed 2026-03-22)

### What was built

**Database** (`supabase-migration-v6-sync.sql`, `supabase-migration-v7-sync-triggers.sql`):
- `tasks` and `projects` gain four sync columns: `external_id`, `sync_source`, `last_synced_at`, `sync_status`
- `sync_queue` table — idempotency log for all inbound/outbound sync events
- `agent_logs` table — structured audit trail for OpenClaw agent activity
- Postgres trigger `sync_queue_local_trigger()` fires on INSERT/UPDATE/DELETE on both tables; skips rows where `sync_source = 'openclaw'` to prevent echo loops

**API routes** (all authenticated via `x-openclaw-api-key` header, using service role client):
- `POST /api/sync/inbound` — idempotency-checked upsert from OpenClaw into tasks/projects; conflict detection for local modifications; writes sync_queue entry, applies operation, marks processed, failed, or 409 conflict
- `GET /api/sync/outbound` — pull endpoint; returns records modified since `?since=` timestamp for a given `?table=`
- `POST /api/sync/log` — writes structured entries to `agent_logs`
- `GET /api/sync/queue` — returns sync_queue items, filterable by `?status=`

**UI**:
- `/logs` page — merged feed of `agent_logs` and `activity_log` entries; reverse-chronological; filterable by project and agent; agent badges color-coded (openclaw=amber, discovery=blue, design=purple, dev=teal); activity entries badged as '📋 Activity'

**Supporting infrastructure**:
- `lib/supabase-service.ts` — service role client (bypasses RLS); used only by sync routes
- `lib/sync-auth.ts` — validates `x-openclaw-api-key` / `Authorization: Bearer` against `OPENCLAW_API_KEY` env var
- `OPENCLAW_API_KEY` stored in macOS Keychain (`linkbot-dashboard` / `openclaw_api_key`) and Vercel env vars
- `SUPABASE_SERVICE_ROLE_KEY` added to Vercel env vars

### Key decisions

- **Service role for sync routes, not anon key** — sync requests arrive from OpenClaw without a Supabase JWT, so the anon key would be blocked by RLS. Service role bypasses RLS entirely and is kept server-side only.
- **Trigger skips `sync_source = 'openclaw'` at the row level** — checked inside the function body (not as a `WHEN` clause) so the logic is visible and easy to change. This is the echo-loop prevention.
- **Idempotency on inbound** — `idempotency_key` is unique-constrained in `sync_queue`; duplicate POSTs return 200 immediately without re-applying the operation.
- **`agent_logs` is append-only** — no update or delete routes; the API only exposes POST (write) and the dashboard reads it directly via Supabase client.

---

---

## 1. Codebase Structure Overview

> Updated 2026-03-22 to reflect current state (post Phase 1 auth + Phase 2 sync).

```
linkbot-dashboard/
├── app/
│   ├── layout.tsx              Server component — fetches initial data, renders Sidebar
│   ├── page.tsx                Dashboard home (server component, QuickStats + ProjectHealthCards)
│   ├── globals.css             CSS variables + utility classes
│   ├── favicon.ico
│   ├── login/page.tsx          Magic-link auth page
│   ├── auth/callback/route.ts  Supabase auth redirect handler
│   ├── projects/
│   │   ├── page.tsx            Project list
│   │   └── [id]/page.tsx       Project detail (PRD, tasks, metadata)
│   ├── my-tasks/page.tsx       Personal task list + DailyPriorityStack
│   ├── kanban/page.tsx         Drag-drop board (@hello-pangea/dnd)
│   ├── metrics/page.tsx        Token usage + spend charts
│   ├── activity/page.tsx       Activity feed
│   ├── logs/page.tsx           Agent logs (OpenClaw audit trail)
│   ├── memory/page.tsx         GitHub-backed AI memory viewer/editor
│   ├── settings/page.tsx       Config
│   └── api/
│       ├── memory/             GitHub-backed AI memory CRUD
│       │   ├── core/route.ts
│       │   ├── projects/route.ts
│       │   └── projects/[slug]/route.ts
│       ├── tasks/              REST API for tasks
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── projects/           REST API for projects
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       └── sync/               OpenClaw sync API (auth: x-openclaw-api-key)
│           ├── inbound/route.ts   Upsert from OpenClaw into Supabase
│           ├── outbound/route.ts  Pull dashboard changes for OpenClaw
│           ├── log/route.ts       Append to agent_logs
│           └── queue/route.ts     Inspect sync_queue
├── components/
│   ├── layout/
│   │   └── Sidebar.tsx         Nav sidebar
│   ├── dashboard/
│   │   ├── QuickStats.tsx      KPI summary row
│   │   └── ProjectHealthCard.tsx Per-project health widget
│   ├── kanban/
│   │   ├── KanbanBoard.tsx     Board container
│   │   ├── KanbanColumn.tsx    Column (status lane)
│   │   └── KanbanCard.tsx      Draggable task card
│   ├── projects/
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectHeader.tsx
│   │   ├── PRDSection.tsx
│   │   ├── ProjectMetadata.tsx
│   │   └── ProjectTaskSummary.tsx
│   ├── tasks/
│   │   ├── TaskCard.tsx
│   │   ├── TaskModal.tsx
│   │   ├── DailyPriorityStack.tsx
│   │   └── QuickAddTask.tsx
│   ├── shared/
│   │   ├── StatusBadge.tsx
│   │   ├── ColorDot.tsx
│   │   ├── EmptyState.tsx
│   │   └── ActivityFeed.tsx
│   └── *.tsx                   Legacy root-level components (prefer domain-organized versions)
├── lib/
│   ├── supabase.ts             Browser Supabase client (no-op proxy if env missing)
│   ├── supabase-server.ts      Server Supabase client (reads auth cookies via @supabase/ssr)
│   ├── supabase-service.ts     Service role client (bypasses RLS; sync routes only)
│   ├── actions.ts              Server actions ('use server') for all mutations
│   ├── api-auth.ts             Auth helper for REST API routes
│   └── sync-auth.ts            Validates x-openclaw-api-key for sync routes
├── types/
│   └── index.ts                All shared TypeScript interfaces
├── memory/                     GitHub-backed AI memory files
├── proxy.ts                    Route protection (middleware equivalent)
└── ARCHITECTURE_NOTES.md       This file
```

Tech stack: **Next.js 16 / React 19 / TypeScript / Tailwind v4 / Supabase / @hello-pangea/dnd**
Deployment: Vercel

---

## 2. Patterns in Use

### Routing
- Multi-page App Router: `/`, `/projects`, `/projects/[id]`, `/my-tasks`, `/kanban`, `/metrics`, `/activity`, `/logs`, `/memory`, `/settings`, `/login`
- Route protection via `proxy.ts` — unauthenticated requests redirect to `/login`

### Auth
- Supabase magic-link auth; session cookies managed by `@supabase/ssr`
- Browser client (`lib/supabase.ts`) — no cookies, for client components
- Server client (`lib/supabase-server.ts`) — reads auth cookies, for server components and API routes
- Service role client (`lib/supabase-service.ts`) — bypasses RLS; used **only** by sync routes

### State Management
- Plain `useState` per page — no Zustand, Redux, or Context
- Mutations go through server actions (`lib/actions.ts`); on success, client re-fetches via `loadAll()`
- Prop drilling for callbacks (`onTasksChange`, `onProjectsChange`)

### Data Fetching
- `app/layout.tsx` is a **server component** — fetches initial data, passes to children
- Most pages are **client components** that fetch via `useEffect` + Supabase browser client
- No caching, no pagination, no real-time subscriptions (see REC-4)

### API Routes
- `/api/memory/*` — GitHub REST API, uses `GITHUB_TOKEN` server-side
- `/api/tasks/*`, `/api/projects/*` — REST CRUD, authenticated via `lib/api-auth.ts`
- `/api/sync/*` — OpenClaw sync; authenticated via `x-openclaw-api-key` header, uses service role client

### Styling
- **CSS variables** in `globals.css` (`--bg-base`, `--text-primary`, `--accent`, etc.)
- **Inline `style={{}}` props** dominate — Tailwind v4 installed but barely used
- Utility classes: `.btn-primary`, `.btn-ghost`, `.btn-danger`, `.card`
- Dark theme only; avoid mixing Tailwind utilities and inline styles in the same component

### Demo Mode
- Detected via `NEXT_PUBLIC_SUPABASE_URL` missing at component mount
- Demo data is hardcoded (see issue 4.10 — still present)

---

## 3. What Is Working Well

- **Developer velocity** — inline styles mean zero context-switching; you can read exactly what a component looks like without hunting through CSS files or Tailwind intellisense.
- **No-op proxy pattern** in `lib/supabase.ts` makes demo mode transparent to components.
- **Types are centralised** in `types/index.ts` — single source of truth for all interfaces.
- **@hello-pangea/dnd** drag-drop is well-integrated with minimal custom code.
- **Demo mode** gives a working first-run experience without any setup.
- **`loadAll` simplicity** — one function, one Promise.all, easy to reason about.
- **API routes** (`/api/memory/`, `/api/sync/*`) follow Next.js conventions and keep credentials server-side.
- **Sync infrastructure** — idempotency, conflict detection, and echo-loop prevention all in place and tested.
- **Unified activity feed** — `/logs` merges agent_logs and activity_log for comprehensive audit trail.
- **Test coverage** — Vitest suite covers auth, sync operations, idempotency, conflict detection, and error paths.

---

## 4. Tech Debt and Architectural Issues

### 4.1 Monolithic Page Component
`app/page.tsx` is ~350 lines and handles: routing decisions, demo mode, all data fetching, metric computation, filter state, and rendering. It is already the hardest file to change safely and will compound with each feature added.

### 4.2 No Real Server-Side Rendering
All data fetching is client-side. The page arrives as an empty shell; Supabase is queried after hydration. This means:
- No SEO value (minor issue for a dashboard).
- Visible loading flash on every page load.
- The Supabase anon key is public — acceptable only if Row Level Security is correctly configured. There is no evidence of RLS policies in the repo.

### 4.3 Exposed Supabase Anon Key
`NEXT_PUBLIC_SUPABASE_ANON_KEY` is intentionally client-visible. This is the standard Supabase pattern, but it requires RLS to be the actual security boundary. If RLS is not enforced on all tables, any authenticated user can read/write all data.

### 4.4 Full Refetch on Every Mutation
`loadAll()` is passed as `onTasksChange` to `KanbanBoard`. Every drag-drop reloads all six Supabase tables. For small data sets this is fine; at scale it creates unnecessary load and causes visible flicker.

### 4.5 Metric Computation in Client Render
`totalSpend`, `spendByProjectMap`, `doneThisWeek`, and all token aggregations are computed in `loadAll()` on every data refresh. For larger data sets this should move to Supabase views or server-side aggregation.

### 4.6 Inline Style Sprawl
With 8 component files each using `style={{}}` exclusively, there is no systematic design token enforcement. The CSS variables exist in `globals.css` but are referenced inconsistently — some components use `var(--accent)`, others hard-code `#3b82f6`. Drift is inevitable.

### 4.7 No Error Boundaries
The top-level catch in `loadAll()` sets an error string, but components themselves have no error boundaries. A render-time error in a child component will crash the entire page.

### 4.8 Test Coverage (Partial)
Sync API and auth are fully tested (25+ tests in Vitest). However, UI components (Dashboard, KanbanBoard, MetricsPanel, etc.) lack unit tests, and the entire system lacks E2E tests (Playwright/Cypress).

### 4.9 `globals.css` / Tailwind Mismatch
Tailwind v4 is installed and PostCSS is configured, but the codebase does not use Tailwind utility classes in components. The build pipeline processes CSS through Tailwind unnecessarily (minor build cost, major conceptual confusion for future contributors).

### 4.10 Hard-coded Demo Data
`DEFAULT_PROJECTS` and all demo tasks/activity live in `page.tsx`. This couples the demo experience to the page component and makes demo data hard to update or test independently.

---

## 5. Refactoring Recommendations

These are recommendations only. No code has been changed.

---

### REC-1: Move Data Fetching to Server Components or API Routes
**Priority: High**

Extract data fetching from `page.tsx` into either:
- A Server Component wrapper that passes data as props, or
- Dedicated `/api/dashboard` route that returns aggregated data.

This removes the Supabase client from the browser bundle, centralises auth, and enables caching.

**Rationale:** Client-side Supabase queries require exposing the anon key and trusting RLS. A server-side fetch keeps credentials on the server and is the recommended pattern for Next.js App Router.

---

### REC-2: Split `page.tsx` into Domain Modules
**Priority: High**

Extract:
- `lib/metrics.ts` — metric computation logic (`computeMetrics(tasks, spend, tokens)`)
- `lib/demo-data.ts` — demo projects, tasks, activity
- A `useDashboard()` hook — state + loadAll + handlers

`page.tsx` should only compose layout. This makes each piece independently testable.

**Rationale:** At 350 lines today, this file will exceed 600 lines within one or two feature additions. Extraction now has low risk; later it requires untangling more side effects.

---

### REC-3: Introduce a Design Token Layer
**Priority: Medium**

Choose one of:
- Commit to Tailwind v4 utility classes with a `tailwind.config.ts` that maps CSS variables to token names, or
- Remove Tailwind and use CSS Modules with the existing variables.

Mixed patterns (inline styles + CSS vars + Tailwind) make it impossible to maintain visual consistency at scale.

**Rationale:** Several components already hard-code colour values that duplicate CSS variable values (`#3b82f6` vs `var(--accent)`). A single source of truth for tokens prevents this.

---

### REC-4: Replace Full Refetch with Optimistic Updates
**Priority: Medium**

For task drag-drop (the most frequent mutation):
1. Update local state immediately.
2. Fire the Supabase update in the background.
3. Roll back on error.

`onTasksChange` currently calls `loadAll()` — replace this with a targeted task-list update.

**Rationale:** Eliminates visible refetch flicker on drag-drop. Supabase real-time subscriptions (`supabase.channel()`) are a further option.

---

### REC-5: Add Row Level Security Documentation and Verification
**Priority: High (security)**

Add a `supabase/RLS_POLICY.md` (or inline comments in the migration SQL) documenting what RLS policies protect each table. If policies are missing, add them before deploying to a multi-user environment.

**Rationale:** The anon key is public. Without RLS, any user who finds the key can read or write all rows in all tables.

---

### REC-6: Add an Error Boundary at the Page Level
**Priority: Low-Medium**

Wrap the main content in a React Error Boundary component that renders a recovery UI instead of a blank page on unexpected render errors.

**Rationale:** Crash isolation. A bug in `KanbanBoard` or `MetricsPanel` should not bring down the whole dashboard.

---

### REC-7: Extract and Test Metric Computation
**Priority: Low**

`computeMetrics()` (once extracted per REC-2) is pure data transformation — ideal for unit tests. Test edge cases: zero data, missing `project_id`, future `updated_at` timestamps.

**Rationale:** Metric bugs are silent. Tests give confidence that token cost, spend totals, and task counts are correct.

---

### REC-8: Add E2E Test Suite ✅ (Partially Addressed)
**Priority: Medium**

Create Playwright or Cypress tests for critical user flows:
- Login via magic link
- Create/update/delete tasks
- Drag-drop on kanban board
- Sync cycle (manual push/pull via sync API)

The sync infrastructure is unit-tested, but end-to-end workflows are untested.

**Rationale:** UI regressions are common during refactoring. E2E tests catch them early.

---

*End of architecture notes.*
