---
trigger: always_on
---

## 1. Filosofia

- **Claredat > cleverness**: codi llegible per qualsevol membre de l'equip.
- **Explícit > implícit**: evita màgia; el codi ha d'explicar-se sol.
- **TypeScript strict sempre**: zero `any`, zero `@ts-ignore` sense justificació.
- **Immutabilitat per defecte**: `const`, evita mutació d'estat directa.
- **Fails fast**: valida a la frontera (inputs, API responses); no deixis errors silenciosos.
- **DRY**: extreu lògica repetida a hooks, utils o components.

---

## 2. Estructura del Projecte (Next.js App Router)

```
antigravity/
├── app/
│   ├── (auth)/             # login, register, reset
│   ├── (dashboard)/        # rutes autenticades
│   ├── api/                # Route Handlers
│   └── layout.tsx
├── components/
│   ├── ui/                 # Button, Input, Modal...
│   └── [feature]/          # components per funcionalitat
├── hooks/                  # Custom React hooks
├── lib/
│   ├── supabase/           # server.ts + client.ts
│   ├── utils/              # funcions pures
│   └── validations/        # esquemes Zod
├── types/
│   └── database.types.ts   # generat per Supabase CLI
├── stores/                 # Zustand
└── supabase/
    ├── migrations/
    └── seed.sql
```

**Regles:**
- Un component per fitxer. Nom fitxer = nom component (PascalCase).
- Cap lògica de negoci als `page.tsx`. Delega a hooks o Server Actions.
- Agrupa per **feature**, no per tipus: `components/time-tracking/` > `components/buttons/`.
- Els `index.ts` només re-exporten; mai contenen lògica.

---

## 3. TypeScript

**`tsconfig.json` obligatori:**
```json
"strict": true,
"noUncheckedIndexedAccess": true,
"exactOptionalPropertyTypes": true,
"noImplicitReturns": true
```

**✅ Correcte:**
```ts
type ApiResponse<T> = { data: T; error: null } | { data: null; error: string };
type UserId = string & { readonly _brand: 'UserId' }; // Branded types

// Patró Result: evita excepcions implícites
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

async function getProfile(id: string): Promise<Result<Profile>> {
  const { data, error } = await supabase.from('profiles').select().eq('id', id).single();
  if (error) return { ok: false, error };
  return { ok: true, value: data };
}
```

**❌ Prohibit:**
```ts
const data: any = await fetch(...)       // Mai 'any'
function getUser(id): object { ... }     // Mai 'object' com a retorn
// @ts-ignore                            // Prohibit sense comentari
```

- Prefereix union types (`'loading' | 'success' | 'error'`) sobre enums numèrics.
- Tipus de BD generats amb: `npx supabase gen types typescript`

---

## 4. React — Components i Hooks

**Ordre dins d'un component:**
1. Imports → 2. Tipus locals → 3. Constants → 4. Hooks → 5. Handlers → 6. Early returns → 7. JSX

**Server vs Client Components:**

| Criteri | Server Component | Client Component (`'use client'`) |
|---|---|---|
| Accés a BD | ✅ Directe | ⚠️ Via Server Actions |
| useState/useEffect | ❌ | ✅ |
| Interactivitat | ❌ | ✅ |
| SEO / rendiment | ✅ Millor | ⚠️ Bundle JS |
| Quan usar | Llistes, pàgines, dades | Forms, modals, animacions |

> **Regla:** empeny `'use client'` cap avall a l'arbre tant com sigui possible.

**Custom Hooks:**
- Sempre prefix `use`. Un hook = una responsabilitat.
- Retorna objectes: `{ data, isLoading, error, refetch }` — mai tuples de >2 elements.

**Gestió d'estat:**

| Tipus | Eina |
|---|---|
| Estat local UI | `useState` / `useReducer` |
| Dades del servidor | React Query / SWR |
| Estat global UI | Zustand |
| Formularis | React Hook Form + Zod |
| URL state | `useSearchParams` |

---

## 5. Next.js

- Usa grups de rutes per organitzar layouts: `(auth)`, `(dashboard)`.
- Cada segment té el seu `loading.tsx`, `error.tsx` i `not-found.tsx`.
- **Totes les mutacions via Server Actions**, no API routes.
- Les Server Actions van a `actions/nom-feature.ts`.

**Patró obligatori per a Server Actions:**
```ts
'use server'
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const Schema = z.object({ userId: z.string().uuid() });

export async function clockIn(input: unknown) {
  // 1. Comprova autenticació
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: 'No autenticat' };

  // 2. Valida input
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'Input invàlid' };

  // 3. Operació BD
  const { error } = await supabase.from('time_entries').insert({ user_id: user.id, clock_in: new Date() });
  if (error) return { success: false, error: error.message };
  return { success: true };
}
```

---

## 6. Supabase

### 6.1 Dos clients, dos contextos

```ts
// lib/supabase/server.ts — Server Components i Server Actions
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
  );
}

// lib/supabase/client.ts — Client Components ('use client')
import { createBrowserClient } from '@supabase/ssr';
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### 6.2 Consultes

- Especifica sempre les columnes: `.select('id, name')` — **mai `.select('*')` en producció**.
- Gestiona sempre l'error: `const { data, error } = await supabase...`
- Usa `.single()` quan esperes exactament un resultat.

### 6.3 Row Level Security (RLS) — OBLIGATORI

```sql
-- Activa RLS a TOTES les taules
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Exemple: cada usuari veu només els seus registres
CREATE POLICY "Users see own entries"
  ON time_entries FOR SELECT
  USING (auth.uid() = user_id);

-- Exemple: admin veu tots
CREATE POLICY "Admins see all"
  ON time_entries FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
```

### 6.4 Variables d'entorn

| Variable | Exposada al client | Ús |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | URL del projecte |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Clau pública (respecta RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ **MAI** | Bypasseja RLS — només scripts servidor |

> ⚠️ **CRÍTIC:** La `SERVICE_ROLE_KEY` bypasseja TOTES les polítiques RLS. Si es filtra, qualsevol pot llegir/modificar/eliminar qualsevol dada. Afegeix-la al `.gitignore`.

### 6.5 Migracions

- Totes les modificacions d'esquema → `supabase migration new nom_migracio`
- **Mai** canvis manuals a producció sense migració versionada.
- Prova sempre a local (`supabase start`) abans de pujar a producció.

---

## 7. Estils — Tailwind CSS + shadcn/ui

- Tailwind per a tot. Ordena classes amb `prettier-plugin-tailwindcss`.
- Extreu classes repetides amb `cva` (class-variance-authority).
- Defineix colors i tipografia al `tailwind.config.ts`, no inline.
- Components de shadcn/ui van a `components/ui/`. No els modifiquis; extén-los.
- **Mobile-first:** comença pels estils mòbil i afegeix breakpoints cap a dalt (`md:`, `lg:`).
- Testa sempre a 375px (mòbil) i 1440px (escriptori).

---

## 8. Convenció de Noms

| Element | Convenció | Exemple |
|---|---|---|
| Components React | PascalCase | `TimeEntryCard.tsx` |
| Hooks | camelCase + `use` | `useTimeEntries.ts` |
| Funcions / variables | camelCase | `clockInUser()` |
| Constants globals | UPPER_SNAKE_CASE | `MAX_BREAK_MINUTES` |
| Fitxers no-components | kebab-case | `time-entries.ts` |
| Taules Supabase | snake_case plural | `time_entries` |
| Columnes BD | snake_case | `clock_in_lat` |
| Branques Git | kebab-case + prefix | `feat/clock-in-geo` |

---

## 9. Git i Control de Versions

### Branques

| Branca | Protegida | Ús |
|---|---|---|
| `main` | ✅ | Producció. Deploy automàtic. |
| `develop` | ✅ | Integració. Base per a totes les branques. |
| `feat/*` | ❌ | Nova funcionalitat. Surt de `develop`. |
| `fix/*` | ❌ | Correcció de bug. |
| `hotfix/*` | ❌ | Urgent a producció. Surt de `main`. |
| `chore/*` | ❌ | Manteniment, deps, config. |

### Conventional Commits (obligatori)

```
feat(auth): afegir autenticació amb Google OAuth
fix(clock-in): corregir duplicació en doble clic
chore(deps): actualitzar Next.js a 14.2.0
refactor(hooks): extreure lògica de pauses a useBreaks
test(time-entries): afegir tests per a Server Action clockIn
```

### Pull Requests

- Tot entra per PR. **Cap push directe a `main` o `develop`.**
- Mínim 1 aprovació abans de fer merge.
- Usa **Squash and merge** per mantenir l'historial net.

---

## 10. Qualitat i Tests

| Nivell | Eina | Cobertura mínima |
|---|---|---|
| Unitaris | Vitest | 70% lògica de negoci |
| Integració | Vitest + Supabase local | Tots els fluxos crítics |
| Components | Testing Library | Components crítics |
| E2E | Playwright | Happy paths principals |

**Checklist pre-PR:**
- [ ] `tsc --noEmit` sense errors
- [ ] ESLint sense errors
- [ ] Tests passant
- [ ] Zero `console.log` ni `debugger`
- [ ] Variables d'entorn noves al `.env.example`
- [ ] Migracions incloses si hi ha canvis d'esquema
- [ ] RLS revisat si s'afegeix nova taula
- [ ] Captures de pantalla si hi ha canvis visuals

---

## 11. Seguretat

**Regles no negociables:**
1. `SERVICE_ROLE_KEY` mai al codi client ni al repositori.
2. Valida **sempre** l'input al servidor (Zod) abans de tocar la BD.
3. Comprova autenticació a **cada** Server Action (`supabase.auth.getUser()`).
4. No confiïs en l'`userId` que pugui venir de paràmetres; usa `user.id` del servidor.
5. RLS és la darrera línia de defensa; no substitueix la validació al servidor.

---

## 12. Rendiment

- `next/image` per a totes les imatges. `next/font` per a tipografies.
- `.select('id, name')` sempre — mai `.select('*')` en producció.
- Paginació des del principi per a llistes llargues.
- `React.memo`, `useMemo`, `useCallback` amb criteri, no preventivament.

**Objectius:**

| Mètrica | Objectiu |
|---|---|
| LCP | < 2.5s |
| CLS | < 0.1 |
| Lighthouse Performance | > 85 |
| Temps resposta Server Action | < 500ms (P95) |

---

## 13. CI/CD

- Pipeline: `type-check → lint → tests → build` en cada PR.
- Deploy a producció (`main`) automàtic si tot passa.
- **Mai reutilitzis la mateixa BD** per a entorns diferents:
  - Local → `supabase start` (instància local)
  - Staging → projecte Supabase independent
  - Producció → projecte Supabase de producció (pla Pro)

---

## Les 20 Regles d'Or

| # | Regla |
|---|---|
| 1 | TypeScript strict sempre. Zero `any`. |
| 2 | Server Components per defecte; `'use client'` el més avall possible. |
| 3 | Totes les mutacions via Server Actions validades amb Zod. |
| 4 | Dos clients Supabase: `createServerClient()` al servidor, `createBrowserClient()` al client. |
| 5 | RLS activat i testejat a TOTES les taules. |
| 6 | `SERVICE_ROLE_KEY` mai al codi client ni al repositori. |
| 7 | Comprova sempre `auth.getUser()` al servidor. |
| 8 | `.select()` específic sempre; mai `.select('*')` en producció. |
| 9 | Totes les migracions versionades amb Supabase CLI. |
| 10 | Estructura per feature, no per tipus. |
| 11 | Un component per fitxer; PascalCase per a components. |
| 12 | Conventional Commits obligatori. |
| 13 | Cap push directe a `main` o `develop`. Tot per PR. |
| 14 | Husky + lint-staged: linting automàtic en cada commit. |
| 15 | Mobile-first amb Tailwind. Testa a 375px i 1440px. |
| 16 | Patró `Result<T, E>` per a operacions que poden fallar. |
| 17 | Cobertura de tests mínima del 70% de la lògica de negoci. |
| 18 | Zero `console.log` ni `debugger` al codi de producció. |
| 19 | Variables d'entorn noves documentades al `.env.example`. |
| 20 | Mesura abans d'optimitzar. Lighthouse > 85 com a criteri de qualitat. |
