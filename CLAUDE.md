# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start dev server
npm run build        # production build
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit (run this before committing)
npm run format       # Prettier (auto-fix)
npm run format:check # Prettier (check only)
```

There are no automated tests in this project.

## Architecture

**Next.js 14 App Router** + **Supabase** (Auth + PostgreSQL with RLS) + **Tailwind CSS**.

### Route groups

```
src/app/
  (auth)/               # login, activate, recover, reset password
  (protected)/app/      # all authenticated routes, wrapped by AppShell
    page.tsx            # dashboard (/)
    historial/          # history
    informes/           # reports
    perfil/             # profile
    admin/usuaris|entrades|festius
  api/
    reminders/          # Vercel cron: push Web Push reminders (*/15 6-10 UTC Mon-Fri)
    check-missed-clockout/  # Vercel cron: flag open entries (19:00 UTC Mon-Fri = 20/21h CET)
    reports/csv|pdf/    # report export endpoints
    admin/              # admin-only API actions
```

### Data access layers

Page/action → **service** → **repository** → Supabase. Never skip layers in non-trivial cases.

- `src/server/repositories/` — raw Supabase queries, typed returns
- `src/server/services/` — business logic, compose repositories
- `src/features/*/actions.ts` — Server Actions (`'use server'`), validate auth + call services
- `src/server/actions/user.actions.ts` — user management actions (admin)

### Auth

```ts
// In any Server Component or Action:
const context = await requireUser();    // redirects to /login if unauthenticated
const context = await requireRole(["admin"]);  // redirects to /app if wrong role
// context = { user, profile, preferences }
```

`getCurrentUserContext` is `cache()`-wrapped so it's called once per request.

### Two Supabase clients

| Context | Import |
|---|---|
| Server Components, Server Actions | `createClient()` from `@/lib/supabase/server` |
| Client Components (`'use client'`) | `createSupabaseBrowserClient()` from `@/lib/supabase/client` |

Never use the browser client in server code or vice versa.

### Timezone — critical invariant

**All date/time logic must use `APP_TIME_ZONE = "Europe/Madrid"`**, never raw UTC methods.

```ts
import { getDateKey, formatTime, APP_TIME_ZONE } from "@/lib/utils/time";

// ✅ Correct
const today = getDateKey(new Date(), APP_TIME_ZONE);  // "YYYY-MM-DD" in CET/CEST
const label = formatTime(isoString);                  // "HH:MM" in CET/CEST

// ❌ Wrong — breaks at 23:00-00:00 CET or on UTC servers
new Date().toISOString().split("T")[0]
new Date().getDay()
date.toTimeString().slice(0, 5)
```

Use `Intl.DateTimeFormat` with `timeZone: APP_TIME_ZONE` for any other locale formatting.

### Domain types

All shared types live in `src/types/domain.ts`: `AppRole`, `WorkStatus`, `DashboardSnapshot`, `HistorySnapshot`, `ReportSnapshot`, etc. The Supabase-generated schema is at `src/types/database.ts`.

### UI conventions

- Design tokens (`brand`, `ink`, `mist`, `line`, `danger`, `success`, `pause`) defined in `globals.css` — never use ad hoc hex values.
- Reusable primitives: `Button`, `Badge`, `Card` from `src/components/ui/`.
- Modals: overlay `onClick` closes, inner content `stopPropagation`. All modals use `useEscapeKey(onClose)` from `src/hooks/use-escape-key.ts`.
- No `confirm()` or `alert()` — use inline error state and modal confirmation patterns.
- Labels in forms: `className="block text-sm font-semibold text-ink/80"`.

### Feature structure

Each feature under `src/features/` owns its screens, local components, and actions. Shared/cross-feature UI goes in `src/components/`.

### TypeScript

Zero `any`. Use union literal types for status fields. Server Action results follow:
```ts
{ success: true; data?: T } | { success: false; error: string }
```
