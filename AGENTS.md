# Repository Guidelines

## Project Structure & Module Organization
Primary React + TypeScript app lives in `src/`, with route-level components under `src/components/...` (e.g. `brand`, `personas`). Shared hooks/utilities sit in `src/utils` and visual primitives in `src/styles`. API client logic is under `src/services` (`config/apiConfig.ts` sets base URLs). Server-side helpers and experimental scripts live in `api/`. `server.js` exposes the Express proxy used in development, while `research/` stores reference data and copy. Static entry assets (`index.html`, `favicon.*`) stay at the root.

## Build, Test, and Development Commands
`npm run dev` launches the Vite client on http://localhost:5173. Use `npm run server` to start the Express proxy that forwards requests to the production API. `npm run dev:all` runs both in one shell for full-stack work. `npm run build` performs a TypeScript check then builds the production bundle, and `npm run preview` serves that bundle locally. `npm run lint` runs `tsc --noEmit` for strict type validation; run it before every PR.

## Coding Style & Naming Conventions
Favor TypeScript, functional React components, and hooks. Components live in PascalCase directories/files (`BrandProfile.tsx`), utilities in camelCase (`formatBrand.ts`). Keep JSX indentation at two spaces and prefer early returns for clarity. Co-locate module-specific styles under `src/styles` using the same component name. Reuse the shared Axios client from `src/services/config/apiConfig.ts` instead of ad-hoc fetch calls.

## Testing Guidelines
Automated tests are not yet in place; use type-checking plus manual regression passes across the `/brand`, `/personas`, and `/generations` routes. When adding tests, place Vitest specs beside the module as `<name>.test.ts[x]` and wire coverage gates once the suite exists. Include mocked API responses rather than hitting the live proxy.

## Commit & Pull Request Guidelines
Commits follow short, imperative subjects (`Fix Vercel function configuration pattern`). Keep related changes together and note any API contract updates in the body. Pull requests must summarize user-facing changes, list how you tested (`npm run dev`, manual flows), and link tracking issues. Attach screenshots or recordings for UI adjustments and call out new environment variables.

## Security & Configuration Tips
Never commit `.env` files. Required client variables: `VITE_API_BASE_URL` for local proxying, `VITE_CLAUDE_API_KEY`, `VITE_OPENAI_API_KEY`, and optional `VITE_CORS_PROXY_URL`. In production, rely on the empty base URL so the Vercel edge functions route requests correctly; for local work point to `http://localhost:3001`.
