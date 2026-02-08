# Claude Code Instructions for capstring

## Project Context

capstring is a lightweight JavaScript library for text capitalization and transformation. It supports 29 different styles including case transformations, code conventions, and fun styles.

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

## Supported Styles (29 total)

**Case:** same, none, proper, title, sentence, upper, lower, swap
**Code:** camel, pascal, snake, kebab, slug, constant, python, dot, path, train
**Fun:** leet, reverse, sponge, mock, alternate, crazy, random
**New:** hashtag, acronym, rot13, flip

## When Making Changes

1. Ensure all tests pass: `npm test`
2. Maintain 100% coverage: `npm run test:coverage`
3. Run linter: `npm run lint`
4. Update CHANGELOG.md for any user-facing changes
5. Preserve the ASCII art header

## Related Projects

- **cAPIta** - REST API that wraps capstring (separate repo)

---

## Working Style

### Think First, Code Second
For anything non-trivial, plan the approach before writing code. Identify which files change, what the edge cases are, and how to verify it works. A solid plan means fewer iterations and cleaner implementations.

### Own the Problem
When something's broken - CI failing, bug reported, error in logs - just go fix it. Read the error, trace the cause, implement the fix. Don't wait for instructions on each step.

### Verify, Don't Assume
After making changes, prove they work. Run the tests. Check the output. If asked to review code, be genuinely critical - find the issues, don't just approve.

### When Stuck or Wrong
If a solution feels hacky, stop. Rethink from scratch using what you learned. If corrected on a mistake, suggest a CLAUDE.md update to prevent it happening again - be specific about what to avoid.

### Stay Focused
Use subagents for research, exploration, or isolated subtasks. Keep the main conversation for coordinating and making decisions.
