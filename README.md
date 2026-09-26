# LeadRadar frontend

Sales dashboard for LeadRadar: ranked leads with the evidence behind every score, live analysis runs, and the admin
configuration (services, signal questions, ideal customer profile, rules, scoring). Product spec: [SPEC.md](SPEC.md).
Backend, API and architecture: [MacLovins/backend](https://github.com/MacLovins/backend).

React 19 · Vite 8 · TypeScript · Tailwind 4 · shadcn (`base-nova`, Base UI) · TanStack Query · React Router ·
react-hook-form + zod · Orval · MSW · Vitest.

## Run it

```bash
npm ci
npm run dev:mock   # the whole API is served in the browser by the mock backend (src/testing), no server needed
npm run dev        # proxies /api to the backend (see below)
```

Demo accounts in mock mode (the backend's `lr seed` creates the same ones): `admin@leadradar.ai` / `admin12345!` and
`sales@leadradar.ai` / `sales12345!`.

`npm run dev` proxies `/api` to `https://api.leadradar.business`. To use another backend, e.g. a local
`docker compose up` of MacLovins/backend, create `.env.development.local`:

```bash
API_PROXY_TARGET=http://localhost:8000
```

The proxy strips `Origin`/`Referer`, because the backend rejects cookie-authenticated writes from any origin other than
its public one. In production, serve `dist/` and `/api` from the same origin behind one reverse proxy (SPEC §1.5:
Caddy), with the backend's `APP_PUBLIC_ORIGIN` set to that origin.

Optional: `VITE_ORG_NAME=Orange Systems` shows the organisation under the logo.

## Checks

```bash
npm run lint && npm run format:check && npm run typecheck && npm test && npm run build
```

CI runs the same, plus a check that the committed API client matches `openapi.json`.

## API client

The client is generated, never hand-written:

1. `npm run sync:api` copies `openapi.json` from a clone of MacLovins/backend next to this repo (`../backend`, or pass
   a path: `npm run sync:api -- <dir>`).
2. `npm run gen:api` runs Orval: typed TanStack Query hooks and models in `src/api/generated`.

FastAPI leaves many fields untyped (`dict`, plain `str` for enums). `scripts/openapi-contract.ts` narrows them in
memory during generation to what the backend code returns, with a reference to the backend file for each patch.
`openapi.json` itself stays a verbatim copy. Two endpoints are read by hand: the run progress stream
(`src/api/run-events.ts`, SSE over POST with a polling fallback in `src/hooks/use-run-events.ts`) and the CSV export
(`src/api/leads-export.ts`, a download link).

Auth is the backend's httpOnly `lr_session` cookie; the app never sees a token. Errors follow the backend envelope
`{"error": {"code", "message", "details"}}` and surface as `ApiError` (`src/api/mutator.ts`).

## Layout

```
src/
  app/         router, providers, query client, app shell (composes features)
  api/         Orval output, fetch mutator, SSE reader, cache helpers
  components/  ui/ (shadcn primitives restyled to the design), common/ (TierBadge, ScoreBar, ReasonList…), layout/ (sidebar)
  features/    one folder per screen group; features never import each other (ESLint enforces it)
  hooks/       session, current service, labels, live run events
  lib/         formatting, UI copy (labels.ts), LinkedIn links, storage
  testing/     MSW mock backend (dev:mock and tests), Vitest setup
```

Design tokens live in `src/index.css` (Orange palette, Geist and Geist Mono). The UI is English; plain-language copy
is in `src/lib/labels.ts`, enum labels come from `GET /meta/labels`.
