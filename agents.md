# Repository Guidelines

## Project Structure & Module Organization
The `app/` directory is the React Router v7 application: route modules live in `app/routes/`, shared UI in `app/components/`, hooks in `app/hooks/`, utilities in `app/utils/`, and client helpers in `app/lib/`. The `convex/` folder contains serverless functions, schema definitions, and Convex configuration. Static assets reside in `public/`, deployment outputs in `build/`, and operational runbooks in `guides/`. Configuration defaults sit in `config.example.ts`; copy to `config.ts` for local overrides.

## Build, Test, and Development Commands
Run `npm run dev` for the full-stack dev server with hot reload. `npm run build` creates the production bundle under `build/`. Use `npm run start` to serve the built output locally. Verify types and regenerate React Router loaders with `npm run typecheck`, which runs `react-router typegen` before `tsc`.

## Coding Style & Naming Conventions
Write TypeScript everywhere, using ES modules and strict typing. Prefer PascalCase for React components, camelCase for functions and variables, and kebab-case for route filenames (e.g., `pricing.tsx`). Co-locate loader/action logic with their route module. Favor Tailwind utility classes over custom CSS; place shared design tokens in `app/app.css` only when unavoidable. Keep Convex queries and mutations in files that match their domain (`subscriptions.ts`, `users.ts`).

## Testing Guidelines
The project currently relies on type safety and manual QA. When adding complex logic, scaffold Vitest + React Testing Library tests beside the code (e.g., `Component.test.tsx`) and gate networked code behind mocks. At minimum, run `npm run typecheck` before every PR and include screenshots or recordings for UI changes.

## Commit & Pull Request Guidelines
Follow the existing history pattern of short, imperative commit subjects ("Update integrations links text"). Group related changes together and avoid unrelated refactors. Pull requests should include a concise summary, linked issue or Linear ticket, and a checklist of executed commands. Mention any new environment variables, schema migrations, or Convex changes, and attach proof of testing (command output, screenshots).

## React Router & Convex Tips
Always import route types from `./+types/[route]` when accessing loader data, and rerun `npm run typecheck` if those files go stale. Convex deployments expect the schema in `convex/schema.ts`; keep mutations idempotent and document new functions in `convex/README.md`.
