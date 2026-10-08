# Library reference

Everything exported by `capstring`.

## `capstring(str, style?, options?)`

Default export and named export.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `str` | `string` | | Text to transform |
| `style` | `Style` | `'same'` | A style name |
| `options.strict` | `boolean` | `false` | Throw instead of returning `false` / the input |

**Returns** `string`, or `false` when `str` is not a string and `strict` is off.

```js
capstring('hello world', 'title');                 // 'Hello World'
capstring('hello world', 'title', { strict: true });
```

Throws in strict mode:

- `TypeError` when `str` is not a string
- `RangeError` when `style` is not a known style

## `capstringAll(str, options?)`

Runs every style and returns an object keyed by style name in `STYLES` order. Same `options` and same non-string behavior as `capstring`.

```js
capstringAll('hi');
// { same: 'hi', none: '', proper: 'hi', title: 'Hi', ..., piglatin: 'ihay' }
```

## `STYLES`

Frozen `readonly string[]` of all style names. Order is stable across releases; new styles are appended.

## `CATEGORIES`

Frozen object grouping every style exactly once:

```js
{
  case:     ['same', 'none', 'proper', 'title', 'sentence', 'upper', 'lower', 'swap'],
  code:     ['camel', 'pascal', 'snake', 'kebab', 'slug', 'constant', 'python', 'dot', 'path', 'train', 'hashtag', 'acronym'],
  fun:      ['reverse', 'sponge', 'mock', 'alternate', 'crazy', 'random', 'clap', 'piglatin'],
  encoding: ['leet', 'rot13', 'morse', 'binary'],
  art:      ['flip', 'smallcaps', 'bubble', 'wide', 'strike']
}
```

Use it to build grouped UIs, like the [playground](/) does.

## `getStyles()`

Returns a fresh, mutable copy of `STYLES`.

## `isValidStyle(value)`

`true` when `value` is a style name. In TypeScript this is a type guard: inside the `if`, `value` narrows to `Style`.

```ts
const input: string = getUserInput();
if (isValidStyle(input)) {
  capstring('hi', input); // input is Style here
}
```

## Package layout

| File | Purpose |
|---|---|
| `index.js` | The whole library, browser-safe (no Node imports) |
| `index.d.ts` | Hand-written TypeScript declarations |
| `cli.js` | CLI logic as a testable `main(argv, io)` |
| `bin/capstring.js` | The `npx capstring` executable |

That is the entire published package: 7 files, zero dependencies, `sideEffects: false` so bundlers can tree-shake it.
