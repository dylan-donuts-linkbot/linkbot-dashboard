# Architecture Notes — LinkBot Dashboard

> Written: 2026-03-13
> Purpose: Honest assessment of current state, patterns, and targeted refactoring recommendations. No code has been changed.

---

## 1. Codebase Structure Overview

```
linkbot-dashboard/
├── app/
│   ├── layout.tsx          Root layout (server component, minimal)
│   ├── page.tsx            Entire dashboard UI (~350 lines, "use client")
│   ├── globals.css         CSS variables + utility classes
│   ├── favicon.ico
│   └── api/
│       └── memory/         (new) GitHub-backed memory CRUD routes
│           ├── core/route.ts
│           ├── projects/route.ts
│           └── projects/[slug]/route.ts
├── components/
│   ├── Header.tsx          Nav bar, project filter, live clock
│   ├── MetricsPanel.tsx    KPI row + token sparkline + spend bars
│   ├── KanbanBoard.tsx     @hello-pangea/dnd drag-drop board
│   ├── TaskCard.tsx        Draggable task card
│   ├── TaskModal.tsx       Create/edit task modal
│   ├── ActivityFeed.tsx    Event log sidebar
│   ├── ProjectModal.tsx    Create project modal
│   └── ContextModal.tsx    Read-only PRD viewer
├── lib/
│   └── supabase.ts         Singleton client with no-op proxy
├── types/
│   └── index.ts            All shared TypeScript interfaces
├── memory/                 (new) GitHub-backed AI memory files
├── MEMORY.md               (new) Core long-term memory file
└── ARCHITECTURE_NOTES.md   This file
```

Tech stack: **Next.js 16 / React 19 / TypeScript / Tailwind v4 / Supabase / @hello-pangea/dnd**
Deployment: Vercel

---

## 2. Patterns in Use

### Routing
- Single page at `/` — the entire app lives in `app/page.tsx`.
- No nested layouts, no parallel routes, no route groups.
- App Router is present but used purely for the root page.

### State Management
- Plain `useState` + `useCallback` in `page.tsx` — no Zustand, Redux, or Context.
- All derived state (metrics, filtered tasks) is computed inline during render.
- `loadAll()` is a single `Promise.all` that refreshes everything from Supabase.

### Data Fetching
- **Client-only**: `"use client"` on the page; data fetching happens entirely in the browser.
- No Server Components for data loading, no `fetch` in `layout.tsx`.
- Direct Supabase queries from the client — the Supabase anon key is exposed to the browser via `NEXT_PUBLIC_*` env vars.
- No caching, no pagination, no real-time subscriptions.

### API Routes (newly added)
- `/api/memory/*` routes use `GITHUB_TOKEN` server-side — correctly secret.
- Standard `fetch` to GitHub REST API with base64 encode/decode.

### Styling
- Heavy use of inline `style={{}}` props throughout all components.
- Tailwind v4 is installed but barely used — a few utility classes on `<html>/<body>`.
- Custom CSS in `globals.css`: CSS variables (`--bg-card`, `--accent`, etc.) and three hand-written button classes (`.btn-primary`, `.btn-ghost`, `.btn-danger`) plus `.card`.
- Font sizes and spacing are hard-coded inline (e.g., `fontSize: 13`, `padding: '9px 14px'`).

### Component Communication
- Callback prop drilling: `page.tsx` → `Header`, `KanbanBoard`, `ActivityFeed`, modals.
- `onTasksChange` passes `loadAll` directly as a prop — components trigger full re-fetches.

### Demo Mode
- Detected via `NEXT_PUBLIC_SUPABASE_URL` check at component mount.
- Entire demo data set hard-coded in `page.tsx`.

---

## 3. What Is Working Well

- **Developer velocity** — inline styles mean zero context-switching; you can read exactly what a component looks like without hunting through CSS files or Tailwind intellisense.
- **No-op proxy pattern** in `lib/supabase.ts` makes demo mode transparent to components.
- **Types are centralised** in `types/index.ts` — single source of truth for all interfaces.
- **@hello-pangea/dnd** drag-drop is well-integrated with minimal custom code.
- **Demo mode** gives a working first-run experience without any setup.
- **`loadAll` simplicity** — one function, one Promise.all, easy to reason about.
- **New API routes** (`/api/memory/`) follow Next.js conventions and keep the token server-side.

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

### 4.8 No Tests
No unit tests, no integration tests, no Playwright/Cypress E2E tests exist. The drag-drop state transitions and metric computation functions are untested.

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

*End of architecture notes.*
