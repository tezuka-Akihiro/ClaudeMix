# Task Completion Checklist

When completing a development task, run these commands in order:

1. **Test** - `npm test` or `npm run test:run`
   - Run unit tests with Vitest
   - Verify all tests pass
   - Use `npm run test:ui` for interactive testing

2. **Type Check** - `npm run typecheck`
   - Verify TypeScript compilation
   - Fix any type errors

3. **Lint** - `npm run lint`  
   - Check code style and quality
   - Fix any linting errors

4. **Build** - `npm run build`
   - Ensure production build works
   - Check for build errors

## Testing Setup
- **Framework**: Vitest with jsdom environment
- **Config**: Located in vite.config.js
- **Setup**: test/setup.js for @testing-library/jest-dom
- **Spec Data**: Use test/utils/spec-loader.js to load YAML spec files
- **Templates**: Reference spec.yaml files for test data values

## Notes
- Always run tests first to catch issues early
- Tests reference spec.yaml files for consistent test data
- Use minimal test items focusing on key functionality