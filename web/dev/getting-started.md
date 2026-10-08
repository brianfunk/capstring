# Getting started

## Install

```bash
npm install capstring
# or
pnpm add capstring
yarn add capstring
bun add capstring
```

Requires Node 22.13 or newer (ES modules). No runtime dependencies.

## Import

capstring is ESM only. Use `import`, not `require`.

```js
// default export is the main function
import capstring from 'capstring';

// named exports
import { capstring, capstringAll, getStyles, isValidStyle, STYLES, CATEGORIES } from 'capstring';
```

### Browser, no bundler

The library file is dependency-free and browser-safe, so you can import it straight from a CDN:

```html
<script type="module">
  import capstring from 'https://cdn.jsdelivr.net/npm/capstring@1/index.js';
  console.log(capstring('hello world', 'title')); // Hello World
</script>
```

### Deno and Bun

```ts
import capstring from 'npm:capstring';   // Deno
import capstring from 'capstring';       // Bun, after `bun add capstring`
```

## Transform one string

```js
capstring(str, style = 'same', options = {})
```

Returns the transformed string. Passing a non-string returns `false`; an empty string returns `''`.

```js
capstring('hello world', 'camel');     // 'helloWorld'
capstring('hello world');              // 'hello world' (default: same)
capstring('');                         // ''
capstring(123, 'upper');               // false
capstring('hello', 'not-a-style');     // 'hello' (unknown style returns input)
```

## Strict mode

By default bad input is tolerated. Turn on `strict` to throw instead:

```js
capstring(123, 'title', { strict: true });    // TypeError: capstring: expected a string, got number
capstring('hi', 'nope', { strict: true });    // RangeError: capstring: unknown style "nope"
```

## Every style at once

```js
import { capstringAll } from 'capstring';

const all = capstringAll('hello world');
all.kebab;      // 'hello-world'
all.acronym;    // 'HW'
Object.keys(all);        // every style, in canonical order
```

## Discover styles

```js
import { STYLES, CATEGORIES, getStyles, isValidStyle } from 'capstring';

STYLES;                 // frozen array of every style name
CATEGORIES.code;        // ['camel', 'pascal', 'snake', 'kebab', ...]
getStyles();            // a fresh copy you can mutate
isValidStyle('kebab');  // true
```

Next: the full [library reference](library.md) or the [table of all styles](styles.md).
