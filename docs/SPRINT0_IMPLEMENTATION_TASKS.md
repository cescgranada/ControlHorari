# Sprint 0 implementation tasks

## Scope

This document converts `MVP-001` to `MVP-005` into executable implementation tasks.

## MVP-001 - Initialize Next.js base

Goal: create a stable web foundation with public and protected layouts.

Tasks:
- create `package.json` with Next.js, React, TypeScript and core scripts
- create `tsconfig.json`, `next.config.ts` and `next-env.d.ts`
- create `src/app/layout.tsx`, `src/app/page.tsx` and route groups for `(public)` and `(protected)`
- create base shells for public and protected views
- add starter pages for `/login` and `/app`

Done when:
- `npm run dev` starts without manual setup work
- `/login` and `/app` render through different shells

## MVP-002 - Tailwind and UI base

Goal: define visual tokens and reusable primitives before feature work starts.

Tasks:
- configure Tailwind and PostCSS
- define CSS variables for brand, semantic and surface colors
- define type scale and font choices in `globals.css`
- create `Button`, `Card` and `Badge` primitives
- apply the design tokens to public and protected shells

Done when:
- UI primitives are reused in the starter pages
- colors and spacing come from shared tokens, not inline ad hoc styles

## MVP-003 - Supabase environment and helpers

Goal: isolate data access setup from the start.

Tasks:
- add `.env.example` with public and server keys
- create typed env access helpers
- create browser and server Supabase client factories
- add base database types placeholder aligned with the migration design
- keep env parsing lazy so local build does not fail before secrets exist

Done when:
- frontend and server code can import a single Supabase entry point
- missing env values fail only when a client is actually created

## MVP-004 - Modular architecture

Goal: avoid feature logic spreading through random files.

Tasks:
- create `features`, `components`, `server`, `lib` and `types` folders
- add route constants and navigation config
- create starter validation schema for auth
- create starter repository, service and policy files
- add basic domain types shared across features

Done when:
- there is a clear path for UI, business logic and data access
- new modules can follow the same structure without refactor work

## MVP-005 - Quality baseline

Goal: make local quality checks part of the normal workflow.

Tasks:
- add lint, format and typecheck scripts
- configure ESLint, Prettier and EditorConfig
- add ignore rules for generated output
- document engineering conventions for naming, file placement and commits

Done when:
- `npm run lint`, `npm run format:check` and `npm run typecheck` are available
- the project includes a short engineering workflow document

## Recommended execution order

1. create project config and route groups
2. add visual tokens and UI primitives
3. add Supabase helpers and shared types
4. add modular architecture starter files
5. add quality tooling and validate the scaffold
