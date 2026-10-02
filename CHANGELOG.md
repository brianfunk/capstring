# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-10-02

### Added

- **8 new styles** (37 total): `smallcaps`, `bubble`, `wide`, `strike`, `clap`, `morse`, `binary`, `piglatin`
- **CLI**: `npx capstring <style> [text]`, `--all`, `--list`, `--json`, `--help`, `--version`; reads stdin when no text is given
- **TypeScript declarations** (`index.d.ts`) with a `Style` union type for autocomplete
- `capstringAll(str)` - every style at once, keyed by style name
- `CATEGORIES` - frozen style groupings (`case`, `code`, `fun`, `encoding`, `art`)
- `{ strict: true }` option - throw `TypeError` / `RangeError` instead of returning `false` / the input
- Smart tokenizer for code styles: splits on camelCase boundaries, `_`, `-`, `.`, `/` and punctuation (`XMLHttpRequest` → `xml-http-request`)
- `files` whitelist, `sideEffects: false`, `./package.json` export, `prepublishOnly` gate
- 100% coverage thresholds enforced; Node 24 added to CI; CLI smoke test in CI

### Behavior changes

- Empty string input now returns `''` instead of `false` (non-string input still returns `false`)
- `slug` is now a real slugifier: diacritics folded, punctuation removed, ASCII only (`Crème Brûlée & Co.` → `creme-brulee-co`). It no longer equals `kebab`, which keeps Unicode letters
- All code styles tokenize camelCase and separator input (`helloWorld` → `hello_world`, was `helloworld`)
- `title` is Unicode aware (`élan vital` → `Élan Vital`, was `éLan Vital`); `_` now breaks words
- `sentence` capitalizes after `.`, `!`, `?` (`hello. world` → `Hello. World`)
- `leet` uses the conventional ASCII map and preserves case (`hello WORLD` → `h3110 W0R1D`, was `h3££0 w0r£d`)
- `alternate` counts Unicode letters, not just a-z
- `hashtag` of text with no words returns `''` instead of `#`
- `crazy` output may differ from 1.0.0 for text containing emoji (now seeded per code point)

### Fixed

- `reverse` and `flip` no longer corrupt emoji, flags, or combining accents (grapheme-cluster aware)
- All styles iterate code points instead of UTF-16 code units
- `@eslint/js` declared as a devDependency

### Docs

- Style count corrected everywhere (README, AGENTS.md, package.json)
- README regrouped into Case / Code / Fun / Encodings / Unicode Art with behavior notes

## [1.0.0] - 2026-02-01

### Breaking Changes

- **Node.js 18+ required** - Dropped support for older Node.js versions
- **ESM only** - Package now uses ES modules (`import`/`export`)

### Added

- **29 transformation styles** - Added 14 new styles:
  - `kebab` / `slug` - hello-world (URL-friendly)
  - `dot` - hello.world
  - `path` - hello/world
  - `constant` - HELLO_WORLD (SCREAMING_SNAKE_CASE)
  - `train` - Hello-World (Train-Case)
  - `sponge` - HeLlO (starts uppercase)
  - `mock` - hElLo (starts lowercase)
  - `swap` - Swap case (Hello → hELLO)
  - `alternate` - aLtErNaTe (letters only)
  - `hashtag` - #HelloWorld
  - `acronym` - ASAP (first letters)
  - `rot13` - uryyb (ROT13 cipher)
  - `flip` - ollǝɥ (upside down)
- `getStyles()` - Returns array of all style names
- `isValidStyle()` - Validates style names
- `STYLES` constant - Frozen array of all 29 styles
- Full test suite with Vitest (41 tests)
- GitHub Actions CI (Node 18, 20, 22)
- ESLint 9 with flat config
- 98% test coverage
- PR and issue templates

### Changed

- Complete ES2022+ rewrite (const/let, arrow functions, template literals)
- Migrated from Mocha/Chai to Vitest
- Migrated from Travis CI to GitHub Actions

### Removed

- CommonJS support (`require()`)
- Travis CI
- CodeClimate configuration
- Istanbul (replaced by Vitest coverage)

## [0.1.3] - 2016

- Previous stable release
