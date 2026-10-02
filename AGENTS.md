# AI Agent Instructions for capstring

## Overview

`capstring` is a lightweight JavaScript library for text capitalization and transformation.
Zero dependencies, 37 styles, Unicode and emoji safe, ships a CLI and TypeScript types.

## Quick Start

```javascript
import capstring, { capstringAll } from 'capstring';

capstring('hello world', 'title');     // 'Hello World'
capstring('XMLHttpRequest', 'kebab');  // 'xml-http-request'
capstring('Crème Brûlée', 'slug');     // 'creme-brulee'
capstringAll('hi').upper;              // 'HI'
```

```bash
npx capstring kebab "Hello World"      # hello-world
echo hi | npx capstring --all          # every style
```

## API

```javascript
capstring(str, style = 'same', { strict = false } = {})
```

- `str` - String to transform
- `style` - Style name (default: 'same')
- `strict` - Throw `TypeError` / `RangeError` instead of returning `false` / the input
- Returns: Transformed string; `''` for empty input; `false` if `str` is not a string

```javascript
import { capstringAll, getStyles, isValidStyle, STYLES, CATEGORIES } from 'capstring';

capstringAll('hi');     // { same: 'hi', none: '', ... } in STYLES order
getStyles();            // fresh copy of STYLES
isValidStyle('kebab');  // true
STYLES;                 // frozen array of all 37 style names
CATEGORIES;             // frozen { case, code, fun, encoding, art }
```

## All 37 Styles

| Category | Styles |
|----------|--------|
| case | same, none, proper, title, sentence, upper, lower, swap |
| code | camel, pascal, snake, kebab, slug, constant, python, dot, path, train, hashtag, acronym |
| fun | reverse, sponge, mock, alternate, crazy, random, clap, piglatin |
| encoding | leet, rot13, morse, binary |
| art | flip, smallcaps, bubble, wide, strike |

## Files

- `index.js` - the whole library. Must stay browser-safe: no `node:` imports, no `process`.
- `cli.js` - CLI logic as `main(argv, io)`; `bin/capstring.js` is the executable shim.
- `index.d.ts` - hand-written types. `test/types.test.js` fails if the `Style` union drifts from `STYLES`.

## Website and API

- `web/` - static site, imports `./capstring.js` (copied from `index.js` at Netlify build time)
- `netlify/functions/api.js` - HTTP API at `https://capstring.netlify.app/api` (transform, all, chain, batch, badge, lorem, spell)
- `npm run dev` runs both locally on http://localhost:8888

## Testing

```bash
npm test              # Run tests
npm run lint          # Run linter
npm run test:coverage # Coverage report (100% thresholds enforced)
```
