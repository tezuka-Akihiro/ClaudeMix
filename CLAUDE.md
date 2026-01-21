# ClaudeMix Project Context

## Project Overview (WHAT)

- **Concept**: Remix MVP Boilerplate optimized for Claude-driven development.
- **Stack**: Remix, TypeScript, Tailwind CSS, Cloudflare Pages (Workers, D1, KV).
- **Structure**:
  - `app/routes/` - **UI Layer**: Routing, Loaders/Actions.
  - `app/components/` - **UI Layer**: Visual components.
  - `app/lib/` - **Pure Logic Layer**: Business logic, pure functions (No side effects).
  - `app/data-io/` - **Side Effects Layer**: DB access, API calls.
  - `content/{section}/` - **SSoT**: YAML specs for literals and configurations.
  - `app/specs/` - **Shared Specs**: Project-wide definitions and shared constants.

## Design Philosophy (WHY)

- **3-Layer Architecture**: Strict separation to ensure testability and maintainability.
  - UI depends on Data-IO.
  - Data-IO depends on Lib.
  - Lib is independent (Pure).
- **Single Source of Truth (SSoT)**: All literal values/configs must be in `*-spec.yaml`. Hardcoding is prohibited.
- **Styling**: Use Tailwind utility classes only. No custom CSS files or global styles.

## Verification Commands (HOW)

- `npm run dev:wrangler` - Start dev server with Cloudflare runtime constraints.
- `npm run typecheck` - Run TypeScript validation.
- `npm run lint:all` - Run all linters (Template, CSS, Markdown, Blog Metadata).
- `npm test` - Run unit tests (Vitest).
- `npm run generate` - Generate code using scaffolds (Structure Assurance).

## Detailed Documentation

- Architecture Rules: @docs/boilerplate_architecture/ARCHITECTURE_MANIFESTO2.md
- Styling Charter: @docs/CSS_structure/STYLING_CHARTER.md
- Spec/Yaml Guide: @docs/boilerplate_architecture/YAML_REFERENCE_GUIDE.md
- Common vs Shared: @docs/boilerplate_architecture/COMMON_VS_SHARED.md
- Project Definition: @app/specs/shared/project-spec.yaml
