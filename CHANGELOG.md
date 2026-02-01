# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
