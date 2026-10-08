# TypeScript

Types ship in the package (`index.d.ts`). No `@types` install needed.

## The `Style` union

Every style name is a string literal type, so editors autocomplete them and typos fail to compile:

```ts
import capstring, { type Style, type Category } from 'capstring';

const style: Style = 'kebab';          // autocompletes every style
const bad: Style = 'kebap';            // error: not assignable to Style
const group: Category = 'encoding';    // 'case' | 'code' | 'fun' | 'encoding' | 'art'
```

## Overloads

`capstring` and `capstringAll` are overloaded so the return type matches what you pass in:

```ts
capstring('hi', 'upper');              // string
capstring(value as unknown, 'upper');  // string | false
capstringAll('hi');                    // Record<Style, string>
capstringAll(value as unknown);        // Record<Style, string> | false
```

The style parameter accepts `Style | (string & {})`, which keeps autocomplete while still allowing an arbitrary string (an unknown style returns the input unchanged unless `strict` is on).

## Narrowing with `isValidStyle`

```ts
import { isValidStyle, capstring } from 'capstring';

function transform(text: string, style: string) {
  if (!isValidStyle(style)) throw new Error(`unknown style ${style}`);
  return capstring(text, style); // style is Style here
}
```

## Options

```ts
interface CapstringOptions {
  strict?: boolean; // throw TypeError / RangeError instead of returning false / input
}
```

## Declarations, in full

```ts
export type Style = 'same' | 'none' | 'proper' | 'title' | 'sentence' | 'upper' | 'lower' | 'swap'
  | 'camel' | 'pascal' | 'snake' | 'kebab' | 'slug' | 'constant' | 'python' | 'dot' | 'path' | 'train'
  | 'leet' | 'reverse' | 'sponge' | 'mock' | 'alternate' | 'crazy' | 'random'
  | 'hashtag' | 'acronym' | 'rot13' | 'flip'
  | 'smallcaps' | 'bubble' | 'wide' | 'strike' | 'clap' | 'morse' | 'binary' | 'piglatin';

export type Category = 'case' | 'code' | 'fun' | 'encoding' | 'art';

export interface CapstringOptions { strict?: boolean }

export const STYLES: readonly Style[];
export const CATEGORIES: Readonly<Record<Category, readonly Style[]>>;

export function capstring(str: string, style?: Style | (string & {}), options?: CapstringOptions): string;
export function capstring(str: unknown, style?: Style | (string & {}), options?: CapstringOptions): string | false;

export function capstringAll(str: string, options?: CapstringOptions): Record<Style, string>;
export function capstringAll(str: unknown, options?: CapstringOptions): Record<Style, string> | false;

export function getStyles(): Style[];
export function isValidStyle(style: unknown): style is Style;
export default capstring;
```

A test in the repo fails if this union ever drifts from the runtime `STYLES` array.
