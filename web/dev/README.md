# capstring developer docs

> CaPiTaLiZe StRiNgS. A small, serious, zero-dependency library for turning text into any case, code convention, encoding, or ridiculous fun style. Unicode and emoji safe. Ships a CLI, TypeScript types, and a free HTTP API.

```bash
npm install capstring
```

```js
import capstring, { capstringAll } from 'capstring';

capstring('hello world', 'title');        // 'Hello World'
capstring('XMLHttpRequest', 'kebab');     // 'xml-http-request'
capstring('Crème Brûlée & Co.', 'slug');  // 'creme-brulee-co'
capstring('hello world', 'sponge');       // 'HeLlO WoRlD'
capstring('hello world', 'flip');         // 'plɹoʍ ollǝɥ'

capstringAll('hi').morse;                 // '.... ..'
```

## Four ways in

| | Where | Start |
|---|---|---|
| **Library** | Node 22+, any modern browser, Deno, Bun | [Getting started](getting-started.md) |
| **CLI** | `npx capstring kebab "Hello World"` | [Command line](cli.md) |
| **HTTP API** | `https://capstring.netlify.app/api` | [HTTP API from code](http-api.md) · [Full API reference](/docs/) |
| **Playground** | Type, click to copy, chain styles | [Open the playground](/) |

## Why this one

- **Every style you need** across case, code conventions, encodings, and Unicode art. [See them all](styles.md).
- **Smart tokenizer**: `XMLHttpRequest`, `hello_world`, `hello-world`, and `helloWorld` all split correctly.
- **Real slug**: diacritics folded, punctuation dropped, ASCII only.
- **Unicode and emoji safe**: flags, ZWJ sequences, and combining accents survive every style.
- **Zero dependencies, 7 files, under 40 kB** on npm. A test fails if that ever grows.
- **100% test coverage**, every behavior change documented in the [changelog](changelog.md).
