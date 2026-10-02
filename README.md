[![capstring](https://img.shields.io/badge/capstring-CaPiTaLiZe%20StRiNgS!-b5d4ff.svg)](https://github.com/brianfunk/capstring)
[![npm version](https://img.shields.io/npm/v/capstring.svg)](https://www.npmjs.com/package/capstring)
[![npm downloads](https://img.shields.io/npm/dm/capstring.svg)](https://www.npmjs.com/package/capstring)
[![Website](https://img.shields.io/badge/web-capstring.netlify.app-b5d4ff.svg)](https://capstring.netlify.app)
[![CI](https://github.com/brianfunk/capstring/actions/workflows/ci.yml/badge.svg)](https://github.com/brianfunk/capstring/actions/workflows/ci.yml)
[![Open Source Love](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://github.com/ellerbrock/open-source-badge/)
[![Semver](https://img.shields.io/badge/SemVer-2.0-blue.svg)](http://semver.org/spec/v2.0.0.html)
[![License](https://img.shields.io/github/license/mashape/apistatus.svg)](https://opensource.org/licenses/MIT)
[![LinkedIn](https://img.shields.io/badge/Linked-In-blue.svg)](https://www.linkedin.com/in/brianrandyfunk)

# capstring

> CaPiTaLiZe StRiNgS in 37 ways!

A small, serious, zero-dependency library for turning text into any case, code convention, or
ridiculous fun style. Unicode and emoji safe. Ships a CLI and TypeScript types.

## Features

- **37 transformation styles** - case, code conventions, encodings, and Unicode art
- **Zero dependencies** - one 17 kB file, browser-safe
- **Unicode aware** - `Élan Vital`, `crème-brûlée`, emoji and flags survive every style
- **Smart tokenizer** - `XMLHttpRequest` becomes `xml-http-request`, `hello_world` becomes `helloWorld`
- **CLI** - `npx capstring kebab "Hello World"`
- **TypeScript types** - autocomplete for every style name
- **100% test coverage**

## Try it online

**[capstring.netlify.app](https://capstring.netlify.app)** - type anything, see all 37 styles, click to copy.

## Installation

```bash
npm install capstring
```

## Quick Start

```javascript
import capstring from 'capstring';

capstring('hello world', 'title');        // 'Hello World'
capstring('XMLHttpRequest', 'kebab');     // 'xml-http-request'
capstring('Crème Brûlée & Co.', 'slug');  // 'creme-brulee-co'
capstring('hello world', 'constant');     // 'HELLO_WORLD'
capstring('hello world', 'sponge');       // 'HeLlO WoRlD'
capstring('hello world', 'flip');         // 'plɹoʍ ollǝɥ'
capstring('hello world', 'hashtag');      // '#HelloWorld'
```

## CLI

```bash
npx capstring kebab "Hello World"          # hello-world
echo "hello world" | npx capstring title   # Hello World
npx capstring --all "hello world"          # every style, one per line
npx capstring --list                       # style names
npx capstring snake --json "Hello World"   # {"input":"Hello World","style":"snake","output":"hello_world"}
```

Exit code `2` means a usage error (unknown style or option, missing text).

## All 37 Styles

### Case

| Style | Input | Output |
|-------|-------|--------|
| `same` | Hello World | Hello World |
| `none` | Hello World | *(empty)* |
| `proper` | Hello World | Hello World *(alias of same)* |
| `title` | élan vital | Élan Vital |
| `sentence` | hello. world! | Hello. World! |
| `upper` | hello world | HELLO WORLD |
| `lower` | HELLO WORLD | hello world |
| `swap` | Hello World | hELLO wORLD |

### Code

| Style | Input | Output |
|-------|-------|--------|
| `camel` | hello world | helloWorld |
| `pascal` | hello world | HelloWorld |
| `snake` | hello world | hello_world |
| `kebab` | Crème Brûlée | crème-brûlée |
| `slug` | Crème Brûlée & Co. | creme-brulee-co |
| `constant` | hello world | HELLO_WORLD |
| `python` | hello world | HELLO_WORLD *(alias of constant)* |
| `dot` | hello world | hello.world |
| `path` | hello world | hello/world |
| `train` | hello world | Hello-World |
| `hashtag` | hello world | #HelloWorld |
| `acronym` | as soon as possible | ASAP |

All code styles share one tokenizer: words split on whitespace, `_`, `-`, `.`, `/`, punctuation,
and camelCase boundaries (`XMLHttpRequest` → `xml`, `http`, `request`). Letters stay attached to
digits (`utf8`, `mp3`). Apostrophes are dropped (`don't` → `dont`).

### Fun

| Style | Input | Output |
|-------|-------|--------|
| `reverse` | hello world | dlrow olleh |
| `sponge` | hello world | HeLlO WoRlD |
| `mock` | hello world | hElLo wOrLd |
| `alternate` | hello world | hElLo WoRlD *(letters only)* |
| `crazy` | hello world | *(deterministic pseudo-random case)* |
| `random` | hello world | *(random case, different every call)* |
| `clap` | hello world | hello 👏 world |
| `piglatin` | hello world | ellohay orldway |

### Encodings

| Style | Input | Output |
|-------|-------|--------|
| `leet` | hello world | h3110 w0r1d |
| `rot13` | hello | uryyb |
| `morse` | SOS 1 | ... --- ... / .---- |
| `binary` | hi | 01101000 01101001 |

### Unicode Art

| Style | Input | Output |
|-------|-------|--------|
| `flip` | hello | ollǝɥ |
| `smallcaps` | hello | ʜᴇʟʟᴏ |
| `bubble` | hello | ⓗⓔⓛⓛⓞ |
| `wide` | hello | ｈｅｌｌｏ |
| `strike` | hello | h̶e̶l̶l̶o̶ |

## API

### `capstring(str, style = 'same', options?)`

```javascript
import capstring from 'capstring';

capstring('hello world', 'title');  // 'Hello World'
capstring('hello world');           // 'hello world' (default: same)
capstring('');                      // ''
capstring(123);                     // false (not a string)
capstring('hello', 'nope');         // 'hello' (unknown style returns input)

// Strict mode throws instead
capstring(123, 'title', { strict: true });    // TypeError
capstring('hi', 'nope', { strict: true });    // RangeError
```

### `capstringAll(str, options?)`

Every style at once, keyed by style name in `STYLES` order.

```javascript
import { capstringAll } from 'capstring';

const all = capstringAll('hello world');
all.kebab;   // 'hello-world'
all.morse;   // '.... . .-.. .-.. --- / .-- --- .-. .-.. -..'
```

### `getStyles()`, `isValidStyle(style)`, `STYLES`, `CATEGORIES`

```javascript
import { getStyles, isValidStyle, STYLES, CATEGORIES } from 'capstring';

getStyles();              // ['same', 'none', 'proper', ...] (fresh copy)
isValidStyle('kebab');    // true
STYLES.length;            // 37 (frozen)
CATEGORIES.art;           // ['flip', 'smallcaps', 'bubble', 'wide', 'strike'] (frozen)
```

### TypeScript

```typescript
import capstring, { type Style } from 'capstring';

const style: Style = 'kebab';   // autocompletes all 37 names
capstring('Hello', style);      // string
```

## HTTP API

Free, no key, CORS enabled, hosted at `https://capstring.netlify.app/api`.

```bash
curl https://capstring.netlify.app/api/title/hello%20world
# {"input":"hello world","style":"title","output":"Hello World"}

curl "https://capstring.netlify.app/api/all/hello%20world?format=txt"
# same	hello world
# none
# ...

curl https://capstring.netlify.app/api/chain/upper+reverse/hello
# {"input":"hello","styles":["upper","reverse"],"output":"OLLEH"}

curl -X POST https://capstring.netlify.app/api/batch \
  -H "Content-Type: application/json" \
  -d '{"style":"slug","texts":["Crème Brûlée","Hello World"]}'
```

| Endpoint | Returns |
|----------|---------|
| `GET /api/styles` | style names and categories |
| `GET /api/:style/:text` | `{ input, style, output }` |
| `GET /api/all/:text` | every style |
| `GET /api/chain/:styles/:text` | styles applied in order (`+` or `,` separated, max 10) |
| `POST /api/batch` | `{ style, texts[] }` (max 100 texts) |
| `GET /api/badge/:style/:text` | shields-style SVG badge, `?label=` to override the left side |
| `GET /api/lorem/:count` | lorem ipsum words (1 to 1000), optional `?style=` |
| `GET /api/spell/:text` | spell-corrected text plus a `corrections` list, optional `?style=` |

[![capstring badge](https://capstring.netlify.app/api/badge/sponge/hello%20world?label=capstring)](https://capstring.netlify.app)

```markdown
![sponge](https://capstring.netlify.app/api/badge/sponge/hello%20world)
```

Text is limited to 2,000 characters. Add `?format=txt` for plain text, `?pretty=1` for indented
JSON, or `?text=` to pass text with slashes. Errors are `{ "error": { "code", "message" } }`.

The previous standalone API, cAPIta, is archived and redirects here.

## Behavior notes

- **Unicode**: every style iterates code points, and `reverse` / `flip` iterate grapheme clusters, so
  emoji, flags, and combining accents stay intact. Requires `Intl.Segmenter` (Node 16+, all modern browsers).
- **`title`** capitalizes every word, including small words like "of" and "the". Hyphens and
  underscores break words (`stop-me` → `Stop-Me`). Apostrophes stay inside words (`don't` → `Don't`).
- **`sentence`** capitalizes after `.`, `!`, `?` followed by whitespace. `3.14 is pi` is left alone.
- **`slug`** is ASCII only: diacritics are folded (`é` → `e`, `ß` → `ss`), everything else becomes a
  hyphen. Scripts with no ASCII folding (CJK, Cyrillic) produce an empty slug. Use `kebab` to keep
  Unicode letters.
- **`piglatin`** and **`morse`** only understand Latin letters; other characters pass through
  (`piglatin`) or are dropped (`morse`).
- **`random`** is the only non-deterministic style.

## Development

```bash
npm install            # Install dependencies
npm test               # Run tests
npm run lint           # Run linter
npm run test:coverage  # Test with coverage (100% required)
npm run dev            # Netlify Dev: site + API at http://localhost:8888
```

The website lives in `web/` (plain HTML/CSS/JS, no build step) and the API in
`netlify/functions/api.js`. Both import `index.js` directly. The spellcheck endpoint's
dependencies (`nspell`, `dictionary-en`) are devDependencies bundled into the function, so the
npm package itself stays zero-dependency.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on the code of conduct and the process for submitting pull requests.

## Versioning

This project uses [Semantic Versioning 2.0](http://semver.org/spec/v2.0.0.html).

## Requirements

- Node.js 22.12+ (or any modern browser)
- ES modules (`import`/`export`)

## License

MIT - Copyright 2016-2026 Brian Funk
