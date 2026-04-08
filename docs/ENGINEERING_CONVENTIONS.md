# Engineering conventions

## Commands

- `npm run dev` starts local development
- `npm run lint` checks code quality
- `npm run typecheck` checks TypeScript
- `npm run format` formats the workspace
- `npm run format:check` verifies formatting without changes

## Naming

- components use `kebab-case` filenames and `PascalCase` exports
- hooks use `use-` prefix
- repositories end with `.repository.ts`
- services end with `.service.ts`
- policies end with `.policy.ts`
- schemas live in `lib/validations` or inside a feature if they are local

## Structure

- `src/app` contains routes and route layouts
- `src/components` contains reusable UI and layout blocks
- `src/features` contains feature-owned UI and local logic
- `src/server` contains services, repositories and policies
- `src/lib` contains cross-cutting helpers, constants and validations
- `src/types` contains shared domain and data types

## Commits

Use short imperative commit messages.

Suggested pattern:
- `init next app shell`
- `add supabase client helpers`
- `create admin users table layout`

## Styling

- use design tokens from `globals.css` and Tailwind theme extensions
- avoid ad hoc hex colors inside components
- reuse primitives before creating new one-off markup patterns

## Data access

- UI components do not talk directly to Supabase when logic grows beyond trivial reads
- data access goes through repositories
- business rules go through services
- role decisions go through policies
