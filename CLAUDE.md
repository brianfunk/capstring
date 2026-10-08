# Claude Code Instructions for capstring

## Project Context

capstring is a lightweight JavaScript library for text capitalization and transformation. It supports many styles including case transformations, code conventions, encodings, and fun Unicode styles. Serious and robust, even though it's for fun.

## Development Commands

```bash
npm install        # Install dev dependencies
npm test           # Run Vitest tests
npm run lint       # Run ESLint
npm run test:coverage  # Run tests with coverage report
npm run dev        # Netlify Dev: website + API on http://localhost:8888
```

## Code Style

- Node 22.13+ (CI runs 22 and 24; eslint 10 needs 22.13, vitest 5 needs 22.12)
- ES2022+ syntax (const/let, arrow functions, template literals)
- ESM modules only (`import`/`export`)
- Full JSDoc documentation
- 100% test coverage target

## Architecture

Single-file library plus a thin CLI:
- `index.js` - the whole library. **Must stay browser-safe**: no `node:` imports, no `process`.
  - `capstring(str, style, { strict })` - Main transformation function
  - `capstringAll(str, options)` - Every style at once
  - `getStyles()`, `isValidStyle(style)`, `STYLES`, `CATEGORIES`
- `cli.js` - `main(argv, io)` with injected I/O so it is unit-testable; `bin/capstring.js` is the shim
- `index.d.ts` - hand-written types; `test/types.test.js` enforces that the `Style` union matches `STYLES`
- `web/` - static site, no build step. Playground (`index.html`, `app.js`), Developer Docs (`docs/`: single Stripe-style page, per-style docs in `docs/styles-data.js` with outputs computed live). The Swagger API Reference is served by the API function at `/api` for browsers (`netlify/functions/swagger-page.js`, themed by `web/swagger-theme.css`, spec at `web/openapi.json`), shared header/footer/theme (`site.js`, `site.css`, `theme-init.js`). Imports `./capstring.js`, which Netlify's build copies from `index.js` (gitignored locally)
- `netlify/functions/api.js` - the whole HTTP API, Functions 2.0 handler owning `/api/*`; tested by constructing `Request` objects. `nspell` and `dictionary-en` (spellcheck) and `@resvg/resvg-js` (png format, with fonts vendored in `netlify/fonts/`) are **devDependencies** on purpose: the function bundles them and the npm package stays zero-dependency. They are listed as external + included_files in `netlify.toml` because they read files by path or are native binaries.
- `netlify.toml` - publish `web/`, build copies `index.js`, bundles the function. Branch settings (production `master`, branch deploy `dev`) live in the Netlify UI, not in the file

## Supported Styles

**Case:** same, none, proper, title, sentence, upper, lower, swap, capitalize, lowerfirst
**Code:** camel, pascal, snake, kebab, slug, constant, python, dot, path, train, hashtag, acronym, ada, cobol, initials
**Fun:** reverse, sponge, mock, alternate, crazy, random, clap, piglatin, spaced, squish, nato
**Encoding:** leet, rot13, morse, binary, hex, base64
**Art:** flip, smallcaps, bubble, wide, strike, bold, italic, script

Never write the style count into prose, docs, or the site; it changes. Compute it from `STYLES` where a number is needed.
Docs and tables use `hello world` as the example everywhere; no "(alias of X)" notes.

Never remove a style name; `proper` and `python` are kept as aliases on purpose.

## When Making Changes

1. Ensure all tests pass: `npm test`
2. Maintain 100% coverage (thresholds enforced): `npm run test:coverage`
3. Run linter: `npm run lint`
4. Update CHANGELOG.md for any user-facing changes; behavior changes get their own section
5. Adding a style: add to `STYLES` **and** one `CATEGORIES` group **and** the `Style` union in `index.d.ts` **and** `web/docs/styles-data.js` **and** the enum in `web/openapi.json`, then regenerate the README table (every table row is `hello world`)
6. Preserve the ASCII art header
7. Keep the npm package lean: `test/package.test.js` fails if the tarball gains a file or exceeds the size budget. Website, API, tests, and changelog never ship to npm

## Deployment

Netlify site `capstring` (personal team) deploys from git: `master` is production, `dev` is a branch deploy, PRs get previews. No deploy step in GitHub Actions.

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
