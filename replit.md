# PulseAI Clinical Triage

PulseAI is a synthetic-data clinical triage workspace with SQLite-backed lab analysis and clinician-reviewed referral drafting.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm --filter @workspace/pulseai run dev` — run the existing Vite frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Optional env: `GEMINI_API_KEY` — server-only Gemini key; without it, clearly labelled demo fallback responses are used
- Optional env: `GEMINI_MODEL` — Gemini model name, default `gemini-2.5-flash`
- Optional env: `SQLITE_DB_PATH` — SQLite file path, default `artifacts/api-server/data/pulseai.sqlite`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: local SQLite via Node.js built-in `node:sqlite`
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

- Gemini is called only from the Express server; the frontend never receives the API key.
- Missing `GEMINI_API_KEY` intentionally produces a persisted, clearly labelled demo fallback so the MVP remains runnable.
- Uploaded report bytes are analyzed in memory and only structured results plus metadata are persisted.

## Product

The workspace lists synthetic patients, accepts lab report uploads for structured clinical analysis, persists report results, and generates clinician-reviewed referral drafts.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
