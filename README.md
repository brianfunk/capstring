[![capstring](https://img.shields.io/badge/capstring-CaPiTaLiZe%20StRiNgS!-b5d4ff.svg)](https://github.com/brianfunk/capstring)
[![npm version](https://img.shields.io/npm/v/capstring.svg)](https://www.npmjs.com/package/capstring)
[![npm downloads](https://img.shields.io/npm/dm/capstring.svg)](https://www.npmjs.com/package/capstring)
[![CI](https://github.com/brianfunk/capstring/actions/workflows/ci.yml/badge.svg)](https://github.com/brianfunk/capstring/actions/workflows/ci.yml)
[![Open Source Love](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://github.com/ellerbrock/open-source-badge/)
[![Semver](https://img.shields.io/badge/SemVer-2.0-blue.svg)](http://semver.org/spec/v2.0.0.html)
[![License](https://img.shields.io/github/license/mashape/apistatus.svg)](https://opensource.org/licenses/MIT)
[![LinkedIn](https://img.shields.io/badge/Linked-In-blue.svg)](https://www.linkedin.com/in/brianrandyfunk)

# capstring

> CaPiTaLiZe StRiNgS in 29 ways!

A lightweight, zero-dependency library for text capitalization and transformation. Perfect for formatting strings for code, URLs, display, or fun!

## Features

- **29 transformation styles** - More than any other library!
- **Zero dependencies** - Lightweight and fast
- **ESM native** - Modern JavaScript modules
- **98% test coverage** - Thoroughly tested

## Installation

```bash
npm install capstring
```

## Quick Start

```javascript
import capstring from 'capstring';

capstring('hello world', 'title');     // 'Hello World'
capstring('hello world', 'camel');     // 'helloWorld'
capstring('hello world', 'kebab');     // 'hello-world'
capstring('hello world', 'constant');  // 'HELLO_WORLD'
capstring('hello world', 'leet');      // 'h3££0 w0r£d'
capstring('hello world', 'hashtag');   // '#HelloWorld'
```

## All 29 Styles

### Case Styles

| Style | Input | Output |
|-------|-------|--------|
| `same` | Hello World | Hello World |
| `none` | Hello World | *(empty)* |
| `proper` | Hello World | Hello World |
| `title` | hello world | Hello World |
| `sentence` | hello world | Hello world |
| `upper` | hello world | HELLO WORLD |
| `lower` | HELLO WORLD | hello world |
| `swap` | Hello World | hELLO wORLD |

### Code Styles

| Style | Input | Output |
|-------|-------|--------|
| `camel` | hello world | helloWorld |
| `pascal` | hello world | HelloWorld |
| `snake` | hello world | hello_world |
| `kebab` | hello world | hello-world |
| `slug` | hello world | hello-world |
| `constant` | hello world | HELLO_WORLD |
| `python` | hello world | HELLO_WORLD |
| `dot` | hello world | hello.world |
| `path` | hello world | hello/world |
| `train` | hello world | Hello-World |

### Fun Styles

| Style | Input | Output |
|-------|-------|--------|
| `leet` | hello world | h3££0 w0r£d |
| `reverse` | hello world | dlrow olleh |
| `sponge` | hello world | HeLlO WoRlD |
| `mock` | hello world | hElLo wOrLd |
| `alternate` | hello world | hElLo WoRlD |
| `crazy` | hello world | *(deterministic random)* |
| `random` | hello world | *(random case)* |

### New Styles

| Style | Input | Output |
|-------|-------|--------|
| `hashtag` | hello world | #HelloWorld |
| `acronym` | as soon as possible | ASAP |
| `rot13` | hello | uryyb |
| `flip` | hello | ollǝɥ |

## API

### `capstring(str, style)`

Transform a string to the specified style.

```javascript
import capstring from 'capstring';

capstring('hello world', 'title');  // 'Hello World'
capstring('hello world');           // 'hello world' (default: same)
capstring(123);                     // false (invalid input)
```

### `getStyles()`

Get an array of all supported style names.

```javascript
import { getStyles } from 'capstring';

getStyles();  // ['same', 'none', 'proper', 'title', ...]
```

### `isValidStyle(style)`

Check if a style is supported.

```javascript
import { isValidStyle } from 'capstring';

isValidStyle('kebab');    // true
isValidStyle('invalid');  // false
```

### `STYLES`

Frozen array of all style names.

```javascript
import { STYLES } from 'capstring';

STYLES.length;  // 29
```

## REST API

Looking for an API? Check out [cAPIta](https://github.com/brianfunk/cAPIta) - a full REST API powered by capstring!

```bash
curl https://your-api.com/title/hello%20world
# {"input":"hello world","output":"Hello World","cap":"title"}
```

## Development

```bash
npm install        # Install dependencies
npm test           # Run tests
npm run lint       # Run linter
npm run test:coverage  # Test with coverage
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on the code of conduct and the process for submitting pull requests.

## Versioning

This project uses [Semantic Versioning 2.0](http://semver.org/spec/v2.0.0.html).

## Requirements

- Node.js 18+
- ES modules (`import`/`export`)

## License

MIT - Copyright 2016-2026 Brian Funk
