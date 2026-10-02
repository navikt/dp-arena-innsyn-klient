# dp-arena-innsyn-klient

React Router v8 (framework mode) app that lets Nav-saksbehandlere look up Arena
saksdata for a person. Part of team Dagpenger.

## Commands

- `pnpm install` — install deps (requires GitHub PAT with `read:packages` for `@navikt` scope in `.npmrc`)
- `pnpm dev` — run locally on `http://localhost:3000` with mocked APIs (MSW)
- `pnpm build` — production build (`react-router build`)
- `pnpm typecheck` — `react-router typegen && tsc`
- `pnpm test` — run all Vitest tests
  - Single file: `pnpm vitest run app/features/sak/components/vedtak-detaljer/vilkar-liste.test.tsx`
  - Single test name: `pnpm vitest run -t "skal sortere vilkår"`
- `pnpm generate-openapi-types` — regenerate `openapi/arena-sak-innsyn-typer.ts` from the spec in `redocly.yaml` (points at the live dp-migrering OpenAPI doc)
- `pnpm generate-token` — fetch local Azure OBO tokens for calling dev backends (needs Naisdevice connected)

CI (`.github/workflows/deploy.yaml`) runs `pnpm test` before building/deploying, so keep `pnpm test` and `pnpm typecheck` green before pushing.

## Architecture

- **Routing**: all routes are declared explicitly in `app/routes.ts` (not file-based). Route tree is nested under one `layout("features/layout/index.tsx")`:
  `/` → `/person/:personId` → `/person/:personId/saker` → `/person/:personId/saker/:sakId`, plus `api/internal/*` (isAlive/isReady/metrics) for Nais probes.
- **Feature folders** (`app/features/<name>`): each route's page component, its `clients/*.server.ts` (server-only data fetching), and its `components/` live together. Follow this layout for new features rather than grouping by technical type.
- **Server-only client calls**: data fetching against the Arena backend goes through `arenaInnsynsClient` (`app/utils/client.utils.server.ts`), an `openapi-fetch` client typed from `openapi/arena-sak-innsyn-typer.ts` (generated, do not hand-edit). Client functions (e.g. `person-client.server.ts`, `sak-client.server.ts`) always: get an OBO token via `getSaksbehandlingOboToken`, call the typed client, and on `error` call `handleHttpProblem` (throws a `Response` with the problem's status/title) — follow this pattern for new endpoints.
- **Auth flow**: Azure AD + Nais Wonderwall sidecar (`autoLogin: true` in `.nais/nais.yaml`). `app/utils/auth.utils.server.ts` validates the inbound token and exchanges it for OBO tokens per downstream audience (`getSaksbehandlingOboToken` for dp-migrering, `getMicrosoftOboToken` for Microsoft Graph). `app/features/layout/clients/auth.server.ts` resolves the logged-in saksbehandler's profile (via Graph), cached in an in-memory LRU keyed by NAV-ident.
- **Local/dev mode**: `IS_LOCALHOST=true` short-circuits auth — token helpers return env-var tokens directly and `getSaksbehandler` returns `mocks/data/mock-saksbehandler.ts` instead of calling Graph. `USE_MSW` controls whether MSW (`mocks/mock-server.ts`, handlers in `mocks/mock-azure.ts`) intercepts outbound HTTP instead of hitting real dev APIs.
- **Env access**: always go through `getEnv(key)` in `app/utils/env.utils.ts` (reads `window.env` client-side, `process.env` server-side) — don't read `process.env`/`window.env` directly in feature code. New env vars must be added to the `IEnv` interface.
- **Errors/alerts**: `handleHttpProblem` throws for route-level error boundaries; `getHttpProblemAlert` builds an `IAlert` for the in-page alert banner (`useGlobalAlerts` / `GlobalAlerts`) when a failure shouldn't hard-fail the page.
- **Styling**: Aksel design system (`@navikt/ds-react`, `@navikt/ds-css`) plus Tailwind v4 (`@navikt/ds-tailwind` preset) and CSS Modules per component (`*.module.css`). Prefer Aksel components/tokens over raw Tailwind utility classes.

## Conventions

- Path alias `~/*` → `app/*` (see `tsconfig.json`); import app code via `~/...`, not relative paths across features.
- Server-only modules use the `.server.ts` suffix (enforced by React Router's build) — any code touching tokens, secrets, or the Arena client must live in a `.server.ts` file.
- Tests sit next to the code they cover (`*.test.tsx`), use Vitest + Testing Library; component tests needing a DOM add `// @vitest-environment happy-dom` at the top of the file (default environment is `node`).
- Generated/openapi types are imported as `type {components}`/`type {paths}` from `openapi/arena-sak-innsyn-typer.ts` — regenerate via `pnpm generate-openapi-types` rather than editing by hand.
- Never log fødselsnummer, names, or other personal data (see `app/utils/skjul-sensitiv-opplysning.ts` for masking personal data in logs/UI).
