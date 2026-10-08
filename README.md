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

> CaPiTaLiZe StRiNgS!

A small, serious, zero-dependency library for turning text into any case, code convention, or
ridiculous fun style. Unicode and emoji safe. Ships a CLI and TypeScript types.

## Features

- **Every style you need** - case, code conventions, encodings, and Unicode art
- **Zero dependencies** - one 17 kB file, browser-safe
- **Unicode aware** - `Élan Vital`, `crème-brûlée`, emoji and flags survive every style
- **Smart tokenizer** - `XMLHttpRequest` becomes `xml-http-request`, `hello_world` becomes `helloWorld`
- **Website, HTTP API, and docs** - [capstring.netlify.app](https://capstring.netlify.app): playground, [Developer Docs](https://capstring.netlify.app/docs/), [API Reference](https://capstring.netlify.app/api)
- **CLI** - `npx capstring kebab "Hello World"`
- **TypeScript types** - autocomplete for every style name
- **100% test coverage**

## Try it online

**[capstring.netlify.app](https://capstring.netlify.app)** - type anything, see every style, click to copy.

## Installation

```bash
npm install capstring
```

## Quick Start

```javascript
import capstring from 'capstring';

capstring('hello world', 'title');     // 'Hello World'
capstring('hello world', 'kebab');     // 'hello-world'
capstring('hello world', 'constant');  // 'HELLO_WORLD'
capstring('hello world', 'sponge');    // 'HeLlO WoRlD'
capstring('hello world', 'flip');      // 'plɹoʍ ollǝɥ'
capstring('hello world', 'hashtag');   // '#HelloWorld'
```

## CLI

```bash
# no install, runs the latest version each time
npx capstring kebab "hello world"          # hello-world

# or install once and use it anywhere
npm install -g capstring
capstring kebab "hello world"              # hello-world
```

```bash
npx capstring kebab "Hello World"          # hello-world
echo "hello world" | npx capstring title   # Hello World
npx capstring --all "hello world"          # every style, one per line
npx capstring --list                       # style names
npx capstring --count "hello world"        # words: 2, chars: 11, chars (no spaces): 10, spaces: 1
npx capstring snake --json "Hello World"   # {"input":"Hello World","style":"snake","output":"hello_world"}
```

Exit code `2` means a usage error (unknown style or option, missing text).

## All Styles

Every style applied to `hello world`. Full explanations with more examples are in the [Developer Docs](https://capstring.netlify.app/docs/#styles).

### Case

| Style | `hello world` becomes |
|-------|------------------------|
| `same` | `hello world` |
| `none` | *(empty string)* |
| `proper` | `hello world` |
| `title` | `Hello World` |
| `sentence` | `Hello world` |
| `upper` | `HELLO WORLD` |
| `lower` | `hello world` |
| `swap` | `HELLO WORLD` |
| `capitalize` | `Hello world` |
| `lowerfirst` | `hello world` |

### Code

| Style | `hello world` becomes |
|-------|------------------------|
| `camel` | `helloWorld` |
| `pascal` | `HelloWorld` |
| `snake` | `hello_world` |
| `kebab` | `hello-world` |
| `slug` | `hello-world` |
| `constant` | `HELLO_WORLD` |
| `python` | `HELLO_WORLD` |
| `dot` | `hello.world` |
| `path` | `hello/world` |
| `train` | `Hello-World` |
| `hashtag` | `#HelloWorld` |
| `acronym` | `HW` |
| `ada` | `Hello_World` |
| `cobol` | `HELLO-WORLD` |
| `initials` | `H.W.` |

### Fun

| Style | `hello world` becomes |
|-------|------------------------|
| `reverse` | `dlrow olleh` |
| `sponge` | `HeLlO WoRlD` |
| `mock` | `hElLo wOrLd` |
| `alternate` | `hElLo WoRlD` |
| `crazy` | `HEllo WorlD` |
| `random` | *(random case, different every call)* |
| `clap` | `hello 👏 world` |
| `piglatin` | `ellohay orldway` |
| `spaced` | `h e l l o  w o r l d` |
| `squish` | `helloworld` |
| `nato` | `Hotel Echo Lima Lima Oscar / Whiskey Oscar Romeo Lima Delta` |

### Encodings

| Style | `hello world` becomes |
|-------|------------------------|
| `leet` | `h3110 w0r1d` |
| `rot13` | `uryyb jbeyq` |
| `morse` | `.... . .-.. .-.. --- / .-- --- .-. .-.. -..` |
| `binary` | `01101000 01100101 01101100 01101100 01101111 00100000 01110111 01101111 01110010 01101100 01100100` |
| `hex` | `68 65 6c 6c 6f 20 77 6f 72 6c 64` |
| `base64` | `aGVsbG8gd29ybGQ=` |

### Unicode Art

| Style | `hello world` becomes |
|-------|------------------------|
| `flip` | `plɹoʍ ollǝɥ` |
| `smallcaps` | `ʜᴇʟʟᴏ ᴡᴏʀʟᴅ` |
| `bubble` | `ⓗⓔⓛⓛⓞ ⓦⓞⓡⓛⓓ` |
| `wide` | `ｈｅｌｌｏ　ｗｏｒｌｄ` |
| `strike` | `h̶e̶l̶l̶o̶ w̶o̶r̶l̶d̶` |
| `bold` | `𝗵𝗲𝗹𝗹𝗼 𝘄𝗼𝗿𝗹𝗱` |
| `italic` | `𝘩𝘦𝘭𝘭𝘰 𝘸𝘰𝘳𝘭𝘥` |
| `script` | `𝓱𝓮𝓵𝓵𝓸 𝔀𝓸𝓻𝓵𝓭` |

All code styles share one tokenizer: words split on whitespace, `_`, `-`, `.`, `/`, punctuation,
emoji, and camelCase boundaries (`XMLHttpRequest` → `xml-http-request`). Letters stay attached to
digits (`utf8`). Apostrophes are dropped (`don't` → `dont`).

## API

### `capstring(str, style = 'same', options?)`

```javascript
import capstring from 'capstring';

capstring('hello world', 'title');  // 'Hello World'
capstring('hello world');           // 'hello world' (default: same)
capstring('');                      // ''
capstring(123);                     // false (not a string)
capstring('hello world', 'nope');   // 'hello world' (unknown style returns input)

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
all.nato;    // 'Hotel Echo Lima Lima Oscar / Whiskey Oscar Romeo Lima Delta'
```

### `getStyles()`, `isValidStyle(style)`, `STYLES`, `CATEGORIES`

```javascript
import { getStyles, isValidStyle, STYLES, CATEGORIES } from 'capstring';

getStyles();              // ['same', 'none', 'proper', ...] (fresh copy)
isValidStyle('kebab');    // true
STYLES;                   // frozen array of every style name
CATEGORIES.art;           // ['flip', 'smallcaps', 'bubble', 'wide', 'strike'] (frozen)
```

### TypeScript

```typescript
import capstring, { type Style } from 'capstring';

const style: Style = 'kebab';   // autocompletes every style name
capstring('Hello', style);      // string
```

## HTTP API

Free, no key, CORS enabled, hosted at `https://capstring.netlify.app/api`. Interactive reference
with try-it-out: [capstring.netlify.app/api](https://capstring.netlify.app/api).

```bash
curl https://capstring.netlify.app/api/title/hello%20world
# {"input":"hello world","style":"title","output":"Hello World"}

curl https://capstring.netlify.app/api/sponge/hello%20world.txt
# HeLlO WoRlD

curl -H "Accept: text/csv" https://capstring.netlify.app/api/all/hello%20world

curl -X POST https://capstring.netlify.app/api/batch \
  -H "Content-Type: application/json" \
  -d '{"style":"slug","texts":["hello world","Hello World"]}'
```

| Endpoint | Returns |
|----------|---------|
| `GET /api/:style/:text` | `{ input, style, output }` |
| `GET /api/all/:text` | every style |
| `POST /api/batch` | `{ style, texts[] }` (max 1,000 texts) |
| `GET /api/spell/:text` | spell-corrected text plus a `corrections` list, optional `?style=` |
| `GET /api/count/:text` | words, characters, characters without spaces |
| `GET /api/lorem/:count` | lorem ipsum words (1 to 1000), optional `?style=` |
| `GET /api/badge/:style/:text` | shields-style SVG badge, `?label=` to override the left side |
| `GET /api/styles` | style names and categories |

Output is JSON by default. Pick another format with an extension (`.txt`, `.html`, `.xml`, `.yaml`,
`.csv`, `.jsonp`, `.svg` or `.png` for the result as an image), `?format=`, or an `Accept` header. Text is limited to 10,000 characters (500 for
spell); GET URLs are capped around 8 KB by the host, so use `POST /api/batch` for longer text. Errors come back in the same format as `{ "error": { "code", "message" } }`.

[![capstring badge](https://capstring.netlify.app/api/badge/sponge/hello%20world?label=capstring)](https://capstring.netlify.app)

## Behavior notes

Exact rules for `title`, `sentence`, `slug`, the tokenizer, and Unicode handling are documented per
style in the [Developer Docs](https://capstring.netlify.app/docs/#styles). The short version: every
style iterates code points, the reordering and art styles iterate grapheme clusters, `slug` is ASCII
only, and `random` is the only non-deterministic style.

## Development

```bash
npm install            # Install dependencies
npm test               # Run tests
npm run lint           # Run linter
npm run test:coverage  # Test with coverage (100% required)
npm run dev            # Netlify Dev: site + API at http://localhost:8888
```

The website (`web/`: playground and Developer Docs; plain HTML/CSS/JS, no build step; the Swagger API
Reference is served by the API function at `/api`) and the API (`netlify/functions/api.js`) both import `index.js` directly. The spellcheck and PNG
dependencies (`nspell`, `dictionary-en`, `@resvg/resvg-js`) are devDependencies bundled into the function,
with the fonts for PNG rendering vendored in `netlify/fonts/`, so the npm package itself stays zero-dependency.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on the code of conduct and the process for submitting pull requests.

## Versioning

This project uses [Semantic Versioning 2.0](http://semver.org/spec/v2.0.0.html).

## Requirements

- Node.js 22.13+ (or any modern browser)
- ES modules (`import`/`export`)

## License

MIT - Copyright 2016-2026 Brian Funk
