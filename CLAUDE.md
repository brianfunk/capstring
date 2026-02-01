# Claude Code Instructions for capstring

## Project Context

capstring is a lightweight JavaScript library for text capitalization and transformation. It supports 24+ different styles including case transformations, code conventions, and fun styles.

## Development Commands

```bash
npm install        # Install dev dependencies
npm test           # Run Vitest tests
npm run lint       # Run ESLint
npm run test:coverage  # Run tests with coverage report
```

## Code Style

- ES2022+ syntax (const/let, arrow functions, template literals)
- ESM modules only (`import`/`export`)
- Full JSDoc documentation
- 100% test coverage target

## Architecture

Single-file library with a main function and helper exports:
- `capstring(str, style)` - Main transformation function
- `getStyles()` - Returns array of all style names
- `isValidStyle(style)` - Validates a style name
- `STYLES` - Frozen array constant of all styles

## Supported Styles (24 total)

**Case:** same, none, proper, title, sentence, upper, lower, swap
**Code:** camel, pascal, snake, kebab, slug, constant, python, dot, path
**Fun:** leet, reverse, sponge, mock, alternate, crazy, random

## When Making Changes

1. Ensure all tests pass: `npm test`
2. Maintain 100% coverage: `npm run test:coverage`
3. Run linter: `npm run lint`
4. Update CHANGELOG.md for any user-facing changes
5. Preserve the ASCII art header

## Related Projects

- **cAPIta** - REST API that wraps capstring (separate repo)
