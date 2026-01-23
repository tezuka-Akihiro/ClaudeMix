# ClaudeMix Project Context

## Project Overview (WHAT)

- **Concept**: Remix MVP Boilerplate optimized for Claude-driven development.
- **Stack**: Remix, TypeScript, Tailwind CSS, Cloudflare Pages (Workers, D1, KV).
- **Single Source of Truth (SSoT)**: All literal values/configs must be in `*-spec.yaml`. Hardcoding is prohibited.

## Verification Commands (HOW)

- `npm run dev:wrangler` - Start dev server with Cloudflare runtime constraints.
- `npm run typecheck` - Run TypeScript validation.
- `npm run lint:all` - Run all linters (Template, CSS, Markdown, Blog Metadata).
- `npm test` - Run unit tests (Vitest).
- `npm run generate` - Generate code using scaffolds (Structure Assurance).

## Reference

- Project Definition: @app/specs/shared/project-spec.yaml
- Spec/Yaml Guide: @docs/boilerplate_architecture/YAML_REFERENCE_GUIDE.md

**Note**: Architecture, styling, testing, and validation rules are automatically applied via `.claude/rules/`.
