# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

No test suite exists in this project.

## Architecture

**LinkBot Dashboard** is a personal project management tool ("Project HQ") built with Next.js 15 App Router, React 19, TypeScript, and Supabase.

### Rendering model
- `app/layout.tsx` is a **server component** — fetches initial data and renders the Sidebar
- Most pages (`app/*/page.tsx`) are **client components** that fetch data via `useEffect` + Supabase client directly
- **Server actions** in `lib/actions.ts` (`'use server'`) handle all mutations (create/update/delete)
- `app/api/memory/` routes use GitHub REST API (via `GITHUB_TOKEN`) to read/write AI memory markdown files

### Data layer
- **Supabase** (anon key, public) with RLS enabled — policies allow all operations for anon users
- Client factory in `lib/supabase.ts`: `createClient()` for browser, `createServerClient()` for server components
- If `NEXT_PUBLIC_SUPABASE_URL` is missing, the client returns a no-op proxy and pages render hardcoded demo data
- All TypeScript interfaces are centralized in `types/index.ts`

### Database tables
`projects`, `tasks`, `activity_log`, `sessions`, `spend_log`, `token_usage` — schema in `supabase-schema.sql` with migrations in `supabase-migration-v2.sql` and `supabase-migration-v3.sql`

### State management
- Plain `useState` — no Redux, Zustand, or Context
- Mutations call server actions → on success, client re-fetches via `loadAll()` (full reload pattern)
- Prop drilling for callbacks (`onTasksChange`, `onProjectsChange`)

### Styling conventions
- **CSS variables only** — defined in `app/globals.css` (`--bg-base`, `--text-primary`, `--accent`, etc.)
- **Inline `style={{}}` props dominate** — Tailwind v4 is installed but barely used
- Dark theme only; no light mode
- A few utility classes exist: `.btn-primary`, `.btn-ghost`, `.btn-danger`, `.card`
- Avoid mixing Tailwind utilities and inline styles in the same component

### Component organization
```
components/
  layout/      # Sidebar navigation
  dashboard/   # QuickStats, ProjectHealthCard
  kanban/      # KanbanBoard, KanbanColumn, KanbanCard (uses @hello-pangea/dnd)
  projects/    # ProjectCard, ProjectHeader, PRDSection, etc.
  tasks/       # TaskCard, TaskModal, DailyPriorityStack, QuickAddTask
  shared/      # StatusBadge, ColorDot, EmptyState, ActivityFeed
```

Legacy components exist at `components/*.tsx` (root level) alongside the domain-organized ones — prefer the domain-organized versions.

### Environment variables
| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only — service role key, bypasses RLS; used by sync API routes |
| `GITHUB_TOKEN` | Server-only — GitHub API access for memory routes |
| `OPENCLAW_API_KEY` | Server-only — shared secret for `/api/sync/*` routes; sent as `x-openclaw-api-key` header |

### Key architectural notes
- `app/page.tsx` (Dashboard) is the most complex file — server component with multiple child client components
- The Kanban board page uses drag-drop via `@hello-pangea/dnd`; card updates go through server actions
- Memory pages (`app/memory/`, `app/api/memory/`) interface with GitHub to persist AI context files — this is separate from Supabase
- `ARCHITECTURE_NOTES.md` contains a detailed refactoring roadmap (REC-1 through REC-7) worth reading before making structural changes
